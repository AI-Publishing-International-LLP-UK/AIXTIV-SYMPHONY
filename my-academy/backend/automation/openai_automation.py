#!/usr/bin/env python3
"""
OpenAI Automation Script

This script implements a continuous automation solution using the OpenAI client
with Google service account authentication. It demonstrates how to build a
robust automation framework with configuration management, error handling,
retries, and proper logging.
"""

import argparse
import json
import logging
import os
import signal
import sys
import time
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Add parent directory to path to import from backend.integration
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

# Import the OpenAI client from the integration module
from backend.integration.openai import (
    Client,
    generate_oauth_token,
    get_openai_headers,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("openai_automation.log"),
    ],
)
logger = logging.getLogger("openai_automation")


class ConfigurationManager:
    """
    Manages configuration for the automation from config files and environment variables.
    """

    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize the configuration manager.

        Args:
            config_file: Path to the configuration file. If None, will look for
                         a default config file.
        """
        self.config: Dict[str, Any] = {}
        self.config_file = config_file or os.environ.get(
            "OPENAI_AUTOMATION_CONFIG", "config.json"
        )
        self.load_config()

    def load_config(self) -> None:
        """Load configuration from file and environment variables."""
        # Default configuration
        self.config = {
            "openai": {
                "model": "gpt-4",
                "timeout": 60,
                "max_retries": 3,
                "retry_delay": 2,
            },
            "google_auth": {
                "service_account_file": os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
                "audience": "https://api.openai.com",
            },
            "automation": {
                "interval": 60,  # seconds
                "max_errors": 5,
                "backoff_factor": 1.5,
            },
        }

        # Try to load from config file
        try:
            if self.config_file and os.path.exists(self.config_file):
                with open(self.config_file, "r") as f:
                    file_config = json.load(f)
                    # Update config with file values
                    self._update_nested_dict(self.config, file_config)
                logger.info(f"Loaded configuration from {self.config_file}")
        except Exception as e:
            logger.warning(f"Failed to load config file: {str(e)}")

        # Override with environment variables
        # Format: OPENAI_AUTOMATION_{SECTION}_{KEY}
        # Example: OPENAI_AUTOMATION_OPENAI_MODEL=gpt-4
        for env_var, env_value in os.environ.items():
            if env_var.startswith("OPENAI_AUTOMATION_"):
                try:
                    # Remove prefix and split by underscore
                    parts = env_var.replace("OPENAI_AUTOMATION_", "").lower().split("_")
                    if len(parts) >= 2:
                        section, key = parts[0], "_".join(parts[1:])
                        if section in self.config:
                            # Try to parse the value (string, int, float, bool, etc.)
                            try:
                                # Try as JSON first (for complex types)
                                parsed_value = json.loads(env_value)
                            except json.JSONDecodeError:
                                # Otherwise keep as string
                                parsed_value = env_value
                            self.config[section][key] = parsed_value
                            logger.debug(f"Set {section}.{key} from environment variable")
                except Exception as e:
                    logger.warning(f"Failed to process environment variable {env_var}: {str(e)}")

    def _update_nested_dict(self, d: Dict, u: Dict) -> Dict:
        """Update nested dictionary with another dictionary."""
        for k, v in u.items():
            if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                self._update_nested_dict(d[k], v)
            else:
                d[k] = v
        return d

    def get(self, section: str, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.

        Args:
            section: Configuration section
            key: Configuration key
            default: Default value if not found

        Returns:
            The configuration value or default
        """
        try:
            return self.config.get(section, {}).get(key, default)
        except Exception:
            return default


class BaseAutomation(ABC):
    """
    Base class for automation tasks with error handling and retries.
    """

    def __init__(self, config_manager: ConfigurationManager):
        """
        Initialize the base automation.

        Args:
            config_manager: Configuration manager instance
        """
        self.config = config_manager
        self.running = False
        self.error_count = 0
        self.max_errors = self.config.get("automation", "max_errors", 5)
        self.interval = self.config.get("automation", "interval", 60)  # seconds
        self.backoff_factor = self.config.get("automation", "backoff_factor", 1.5)
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def execute_task(self) -> bool:
        """
        Execute the automation task. This method should be implemented by subclasses.

        Returns:
            True if the task was successful, False otherwise
        """
        pass

    def run(self) -> None:
        """Run the automation in a loop until stopped."""
        self.running = True
        current_interval = self.interval
        
        while self.running:
            start_time = time.time()
            self.logger.info(f"Starting automation task at {datetime.now().isoformat()}")
            
            try:
                success = self.execute_task()
                if success:
                    self.error_count = 0
                    current_interval = self.interval  # Reset backoff
                    self.logger.info("Task completed successfully")
                else:
                    self.error_count += 1
                    current_interval = min(
                        current_interval * self.backoff_factor, 
                        3600  # Maximum backoff of 1 hour
                    )
                    self.logger.warning(
                        f"Task completed with errors (count: {self.error_count}). "
                        f"Next retry in {current_interval:.1f} seconds"
                    )
            except Exception as e:
                self.error_count += 1
                current_interval = min(
                    current_interval * self.backoff_factor, 
                    3600  # Maximum backoff of 1 hour
                )
                self.logger.error(
                    f"Error executing task: {str(e)}. "
                    f"Error count: {self.error_count}. "
                    f"Next retry in {current_interval:.1f} seconds", 
                    exc_info=True
                )
            
            # Check if we've hit the max error count
            if self.error_count >= self.max_errors:
                self.logger.critical(
                    f"Maximum error count reached ({self.max_errors}). Stopping automation."
                )
                self.stop()
                break
            
            # Sleep until the next interval, but account for the time taken to run the task
            elapsed = time.time() - start_time
            sleep_time = max(0.1, current_interval - elapsed)
            
            if self.running:  # Check again in case stop() was called during task execution
                self.logger.info(f"Sleeping for {sleep_time:.1f} seconds until next run")
                time.sleep(sleep_time)

    def stop(self) -> None:
        """Stop the automation."""
        self.logger.info("Stopping automation")
        self.running = False


class OpenAIAutomation(BaseAutomation):
    """
    OpenAI-specific automation implementation.
    """

    def __init__(self, config_manager: ConfigurationManager):
        """
        Initialize the OpenAI automation.

        Args:
            config_manager: Configuration manager instance
        """
        super().__init__(config_manager)
        self.client = None
        self.token_expiry = 0
        self.setup_client()

    def setup_client(self) -> None:
        """Set up the OpenAI client with authentication."""
        try:
            service_account_file = self.config.get(
                "google_auth", "service_account_file", None
            )
            audience = self.config.get("google_auth", "audience", "https://api.openai.com")
            
            if not service_account_file:
                raise ValueError(
                    "Google service account file not configured. "
                    "Set GOOGLE_APPLICATION_CREDENTIALS environment variable or configure in config file."
                )
            
            # Generate token and get authenticated headers
            token, expiry = generate_oauth_token(service_account_file, audience)
            headers = get_openai_headers(token)
            
            # Store the expiry time
            self.token_expiry = expiry
            
            # Create the OpenAI client
            self.client = Client(
                api_key=None,  # Not needed with token auth
                model=self.config.get("openai", "model", "gpt-4"),
                headers=headers,
                timeout=self.config.get("openai", "timeout", 60),
                max_retries=self.config.get("openai", "max_retries", 3),
            )
            
            self.logger.info(
                f"OpenAI client initialized with model {self.client.model}. "
                f"Token expires at {datetime.fromtimestamp(self.token_expiry).isoformat()}"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI client: {str(e)}", exc_info=True)
            raise

    def refresh_token_if_needed(self) -> bool:
        """
        Refresh the authentication token if it's about to expire.

        Returns:
            True if token was refreshed, False otherwise
        """
        # Refresh if token expires in less than 5 minutes
        if time.time() > (self.token_expiry - 300):
            self.logger.info("Authentication token is expiring soon. Refreshing...")
            try:
                service_account_file = self.config.get(
                    "google_auth", "service_account_file", None
                )
                audience = self.config.get(
                    "google_auth", "audience", "https://api.openai.com"
                )
                
                token, expiry = generate_oauth_token(service_account_file, audience)
                headers = get_openai_headers(token)
                
                self.token_expiry = expiry
                self.client.update_headers(headers)
                
                self.logger.info(
                    f"Authentication token refreshed. "
                    f"New expiry: {datetime.fromtimestamp(self.token_expiry).isoformat()}"
                )
                return True
            except Exception as e:
                self.logger.error(f"Failed to refresh token: {str(e)}", exc_info=True)
                return False
        return False

    def process_data_with_openai(self, data: Union[str, List[Dict]]) -> Dict:
        """
        Process data using the OpenAI API.

        Args:
            data: Input data to process

        Returns:
            Processed data from OpenAI
        """
        # Refresh token if needed
        self.refresh_token_if_needed()
        
        # Check if client is initialized
        if not self.client:
            raise RuntimeError("OpenAI client not initialized")
        
        # Prepare the prompt based on input data type
        if isinstance(data, str):
            prompt = data
        else:
            # Convert to a string representation
            prompt = json.dumps(data)
        
        # Process with OpenAI
        max_retries = self.config.get("openai", "max_retries", 3)
        retry_delay = self.config.get("openai", "retry_delay", 2)
        
        for attempt in range(max_retries + 1):
            try:
                self.logger.info(f"Sending request to OpenAI (attempt {attempt + 1}/{max_retries + 1})")
                response = self.client.completion(prompt)
                self.logger.info("Successfully received response from OpenAI")
                return response
            except Exception as e:
                if attempt < max_retries:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    self.logger.warning(
                        f"Error processing data with OpenAI: {str(e)}. "
                        f"Retrying in {wait_time} seconds (attempt {attempt + 1}/{max_retries})"
                    )
                    time.sleep(wait_time)
                    
                    # Refresh token before retry
                    self.refresh_token_if_needed()
                else:
                    self.logger.error(
                        f"Failed to process data with OpenAI after {max_retries + 1} attempts: {str(e)}",
                        exc_info=True
                    )
                    raise

    def execute_task(self) -> bool:
        """
        Execute the OpenAI automation task.

        Returns:
            True if successful, False otherwise
        """
        try:
            # Example task: process some data with OpenAI
            self.logger.info("Starting OpenAI processing task")
            
            # In a real implementation, you might:
            # 1. Fetch data from a database or API
            # 2. Process data in batches
            # 3. Store results back to a database
            
            # Example data to process
            data_to_process = {
                "task": "summarize",
                "content": "This is an example of a continuous automation task using OpenAI. "
                           "The script demonstrates how to build robust automation with "
                           "proper error handling, retries, and authentication.",
            }
            
            # Process the data
            result = self.process_data_with_openai(data_to_process)
            
            # Log the result
            self.logger.info(f"Processing complete. Result: {result}")
            
            # In a real implementation, you would save the result to a database
            # save_to_database(result)
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to execute OpenAI task: {str(e)}", exc_info=True)
            return False


def parse_arguments() -> argparse.Namespace:
    """
    Parse command-line arguments.

    Returns:
        Parsed command-line arguments
    """
    parser = argparse.ArgumentParser(
        description="OpenAI Automation Script",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "-c", "--config", 
        help="Path to configuration file",
        default=os.environ.get("OPENAI_AUTOMATION_CONFIG", "config.json"),
    )
    parser.add_argument(
        "-l", "--log-level",
        help="Logging level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default="INFO",
    )
    parser.add_argument(
        "-i", "--interval",
        help="Interval between task executions in seconds",
        type=int,
        default=None,
    )
    parser.add_argument(
        "--one-shot",
        help="Run the task once and exit",
        action="store_true",
    )
    return parser.parse_args()


def setup_signal_handlers(automation: BaseAutomation) -> None:
    """
    Set up signal handlers for graceful termination.

    Args:
        automation: The automation instance to stop on signal
    """
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}. Shutting down gracefully...")
        automation.stop()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


def main() -> int:
    """
    Main function to initialize and run the automation.

    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    try:
        # Parse command-line arguments
        args = parse_arguments()
        
        # Configure logging level
        if args.log_level:
            logging.getLogger().setLevel(getattr(logging, args.log_level))
            logger.setLevel(getattr(logging, args.log_level))
        
        # Initialize configuration
        logger.info("Initializing configuration")
        config_manager = ConfigurationManager(args.config)
        
        # Override interval if provided
        if args.interval is not None:
            config_manager.config["automation"]["interval"] = args.interval
        
        # Initialize the automation
        logger.info("Initializing OpenAI automation")
        automation = OpenAIAutomation(config_manager)
        
        # Set up signal handlers
        setup_signal_handlers(automation)
        
        # Run the automation
        if args.one_shot:
            logger.info("Running in one-shot mode")
            success = automation.execute_task()
            return 0 if success else 1
        else:
            logger.info("Starting continuous automation")
            automation.run()
            return 0
            
    except KeyboardInterrupt:
        logger.info("Interrupted by user. Exiting.")
        return 130  # Standard exit code for SIGINT
    except Exception as e:
        logger.critical(f"Unhandled exception: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
