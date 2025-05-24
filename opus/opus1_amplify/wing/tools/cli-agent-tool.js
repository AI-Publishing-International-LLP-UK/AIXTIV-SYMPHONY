#!/usr/bin/env node

/**
 * Agent CLI Tool - Provides coding assistance in the terminal
 *
 * This tool connects to the Agent system and provides interactive coding help
 * from the command line, with awareness of the current project context.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const { glob } = require('glob');

// Configuration
const CONFIG_DIR =
  process.env.HOME || process.env.USERPROFILE
    ? path.join(process.env.HOME || process.env.USERPROFILE, '.agent-cli')
    : '.';
const CONFIG_FILE = path.join(CONFIG_DIR, 'agent-config.json');
const API_ENDPOINT =
  process.env.AGENT_API_ENDPOINT || 'https://api.example.com/agent';
const VERSION = '1.0.0';

// Command-line interface setup
program
  .name('agent-cli')
  .description('AI-powered coding assistant in your terminal')
  .version(VERSION);

program
  .option('-t, --token <token>', 'authentication token')
  .option('--agent-id <id>', 'agent ID')
  .option('-v, --verbose', 'verbose output')
  .option('--init', 'initialize the CLI tool');

program
  .command('ask <question>')
  .description('Ask the agent a coding question')
  .action(async question => {
    await handleQuestion(question);
  });

program
  .command('explain <file>')
  .description('Explain the code in a file')
  .action(async file => {
    await handleExplain(file);
  });

program
  .command('improve <file>')
  .description('Suggest improvements for a file')
  .action(async file => {
    await handleImprove(file);
  });

program
  .command('generate <prompt>')
  .description('Generate code based on a prompt')
  .option('-o, --output <file>', 'output file for generated code')
  .action(async (prompt, options) => {
    await handleGenerate(prompt, options.output);
  });

program
  .command('summarize')
  .description('Summarize the current project')
  .action(async () => {
    await handleSummarize();
  });

program
  .command('shell')
  .description('Start an interactive agent shell')
  .action(async () => {
    await startInteractiveShell();
  });

// Parse command-line arguments
program.parse();
const options = program.opts();

// Main function
async function main() {
  try {
    // Check if we need to initialize
    if (options.init) {
      await initializeCLI();
      return;
    }

    // Load configuration
    const config = loadConfig();
    if (!config && !options.token) {
      console.error(
        chalk.red(
          'Error: Agent CLI not initialized. Run with --init to set up.'
        )
      );
      return;
    }

    // If no specific command is provided, start interactive shell
    if (
      process.argv.length <= 2 ||
      (process.argv.length === 3 && process.argv[2] === '--verbose')
    ) {
      await startInteractiveShell();
    }

    // CLI tool is ready
    console.log(chalk.green('CLI Agent Ready'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    }
    return null;
  } catch (error) {
    console.error(
      chalk.yellow(`Warning: Could not load configuration: ${error.message}`)
    );
    return null;
  }
}

// Initialize the CLI tool
async function initializeCLI() {
  console.log(chalk.blue('Initializing Agent CLI...'));

  // Create config directory if it doesn't exist
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // If token is provided via command-line, use it
  if (options.token && options.agentId) {
    const config = {
      token: options.token,
      agentId: options.agentId,
      initialized: new Date().toISOString(),
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(chalk.green('CLI initialized successfully.'));
    return;
  }

  // Otherwise, prompt for auth or direct to web app
  console.log(
    chalk.yellow('No token provided. Please authenticate with the web portal:')
  );
  console.log(chalk.blue('\nhttps://app.example.com/pilots-lounge\n'));
  console.log(
    'After authentication, run the CLI tool with the provided token:'
  );
  console.log(
    chalk.gray(
      '\n$ agent-cli --token <your-token> --agent-id <your-agent-id>\n'
    )
  );
}

// Handle coding questions
async function handleQuestion(question) {
  const spinner = startSpinner('Thinking...');

  try {
    const response = await sendToAgent({
      action: 'ask',
      question,
      context: await getProjectContext(),
    });

    stopSpinner(spinner);

    console.log(chalk.green('\n--- Answer ---\n'));
    console.log(response.answer);

    // Log code examples separately with syntax highlighting
    if (response.code) {
      console.log(chalk.cyan('\n--- Code Example ---\n'));
      console.log(response.code);
    }
  } catch (error) {
    stopSpinner(spinner);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Handle code explanation
async function handleExplain(filePath) {
  // Resolve the file path
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: File not found: ${resolvedPath}`));
    return;
  }

  const spinner = startSpinner(`Analyzing ${path.basename(resolvedPath)}...`);

  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const fileExt = path.extname(resolvedPath);

    const response = await sendToAgent({
      action: 'explain',
      filePath: resolvedPath,
      fileName: path.basename(resolvedPath),
      fileContent,
      fileType: fileExt.replace('.', ''),
      context: await getProjectContext(resolvedPath),
    });

    stopSpinner(spinner);

    console.log(chalk.green('\n--- Explanation ---\n'));
    console.log(response.explanation);

    // Show key functions or sections if available
    if (response.keyComponents) {
      console.log(chalk.cyan('\n--- Key Components ---\n'));
      for (const component of response.keyComponents) {
        console.log(chalk.yellow(`${component.name}:`));
        console.log(component.description);
        console.log();
      }
    }
  } catch (error) {
    stopSpinner(spinner);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Handle code improvement suggestions
async function handleImprove(filePath) {
  // Resolve the file path
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: File not found: ${resolvedPath}`));
    return;
  }

  const spinner = startSpinner(
    `Analyzing ${path.basename(resolvedPath)} for improvements...`
  );

  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const fileExt = path.extname(resolvedPath);

    const response = await sendToAgent({
      action: 'improve',
      filePath: resolvedPath,
      fileName: path.basename(resolvedPath),
      fileContent,
      fileType: fileExt.replace('.', ''),
      context: await getProjectContext(resolvedPath),
    });

    stopSpinner(spinner);

    console.log(chalk.green('\n--- Improvement Suggestions ---\n'));

    if (response.suggestions.length === 0) {
      console.log(
        chalk.green('No improvements suggested. The code looks good!')
      );
      return;
    }

    for (let i = 0; i < response.suggestions.length; i++) {
      const suggestion = response.suggestions[i];
      console.log(chalk.yellow(`${i + 1}. ${suggestion.title}`));
      console.log(suggestion.description);

      if (suggestion.code) {
        console.log(chalk.cyan('\nSuggested code:'));
        console.log(suggestion.code);
      }

      console.log(); // Blank line between suggestions
    }

    // Ask if user wants to apply any suggestions
    if (response.suggestions.some(s => s.patch)) {
      const answer = await promptUser(
        'Do you want to apply any suggestions? (y/n): '
      );
      if (answer.toLowerCase() === 'y') {
        await handleApplySuggestions(
          resolvedPath,
          fileContent,
          response.suggestions
        );
      }
    }
  } catch (error) {
    stopSpinner(spinner);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Handle applying code improvement suggestions
async function handleApplySuggestions(filePath, originalContent, suggestions) {
  const patchableSuggestions = suggestions.filter(s => s.patch);

  if (patchableSuggestions.length === 0) {
    console.log(chalk.yellow('No applicable suggestions found.'));
    return;
  }

  // Show numbered list of suggestions
  console.log(chalk.green('\nApplicable suggestions:'));
  for (let i = 0; i < patchableSuggestions.length; i++) {
    console.log(chalk.cyan(`${i + 1}. ${patchableSuggestions[i].title}`));
  }

  // Ask which suggestion to apply
  const answer = await promptUser(
    'Enter suggestion number to apply (or "all"): '
  );

  try {
    if (answer.toLowerCase() === 'all') {
      // Apply all suggestions
      let updatedContent = originalContent;

      for (const suggestion of patchableSuggestions) {
        updatedContent = applySuggestion(updatedContent, suggestion.patch);
      }

      // Create backup
      const backupPath = `${filePath}.bak`;
      fs.writeFileSync(backupPath, originalContent);
      console.log(chalk.yellow(`Created backup at ${backupPath}`));

      // Write updated content
      fs.writeFileSync(filePath, updatedContent);
      console.log(chalk.green('Applied all suggestions successfully.'));
    } else {
      const index = parseInt(answer) - 1;

      if (isNaN(index) || index < 0 || index >= patchableSuggestions.length) {
        console.log(chalk.red('Invalid selection.'));
        return;
      }

      // Create backup
      const backupPath = `${filePath}.bak`;
      fs.writeFileSync(backupPath, originalContent);
      console.log(chalk.yellow(`Created backup at ${backupPath}`));

      // Apply the selected suggestion
      const updatedContent = applySuggestion(
        originalContent,
        patchableSuggestions[index].patch
      );
      fs.writeFileSync(filePath, updatedContent);
      console.log(chalk.green(`Applied suggestion ${index + 1} successfully.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error applying suggestions: ${error.message}`));
  }
}

// Apply a suggestion patch to content
function applySuggestion(content, patch) {
  let result = content;

  // Apply each change in reverse order (to avoid offset issues)
  const changes = patch.sort((a, b) => b.start - a.start);

  for (const change of changes) {
    const before = result.substring(0, change.start);
    const after = result.substring(change.end);
    result = before + change.replacement + after;
  }

  return result;
}

// Handle code generation
async function handleGenerate(prompt, outputFile) {
  const spinner = startSpinner('Generating code...');

  try {
    const response = await sendToAgent({
      action: 'generate',
      prompt,
      context: await getProjectContext(),
      outputFormat: outputFile
        ? path.extname(outputFile).replace('.', '')
        : null,
    });

    stopSpinner(spinner);

    if (outputFile) {
      // Save to file
      fs.writeFileSync(outputFile, response.code);
      console.log(chalk.green(`Generated code saved to ${outputFile}`));
    } else {
      // Display in terminal
      console.log(chalk.green('\n--- Generated Code ---\n'));
      console.log(response.code);
    }

    // Show explanation if available
    if (response.explanation) {
      console.log(chalk.cyan('\n--- Explanation ---\n'));
      console.log(response.explanation);
    }
  } catch (error) {
    stopSpinner(spinner);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Handle project summarization
async function handleSummarize() {
  const spinner = startSpinner('Analyzing project...');

  try {
    const context = await getProjectContext();

    const response = await sendToAgent({
      action: 'summarize',
      context,
    });

    stopSpinner(spinner);

    console.log(chalk.green('\n--- Project Summary ---\n'));
    console.log(response.summary);

    if (response.keyComponents) {
      console.log(chalk.cyan('\n--- Key Components ---\n'));
      for (const component of response.keyComponents) {
        console.log(chalk.yellow(`${component.name}:`));
        console.log(component.description);
        console.log();
      }
    }

    if (response.suggestions) {
      console.log(chalk.magenta('\n--- Suggestions ---\n'));
      for (let i = 0; i < response.suggestions.length; i++) {
        console.log(chalk.yellow(`${i + 1}. ${response.suggestions[i]}`));
      }
    }
  } catch (error) {
    stopSpinner(spinner);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Start an interactive shell
async function startInteractiveShell() {
  console.log(
    chalk.green('Starting interactive agent shell. Type "exit" to quit.')
  );
  console.log(chalk.green('Type "help" for a list of commands.'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blue('agent> '),
  });

  rl.prompt();

  rl.on('line', async line => {
    const input = line.trim();

    if (input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }

    if (input === 'help') {
      showHelp();
      rl.prompt();
      return;
    }

    if (input === '') {
      rl.prompt();
      return;
    }

    // Handle special commands
    if (input.startsWith('/')) {
      await handleShellCommand(input.substring(1));
      rl.prompt();
      return;
    }

    // Treat as a question otherwise
    const spinner = startSpinner('Thinking...');

    try {
      const response = await sendToAgent({
        action: 'ask',
        question: input,
        context: await getProjectContext(),
      });

      stopSpinner(spinner);

      console.log(chalk.green('\n--- Answer ---\n'));
      console.log(response.answer);

      if (response.code) {
        console.log(chalk.cyan('\n--- Code Example ---\n'));
        console.log(response.code);
      }
    } catch (error) {
      stopSpinner(spinner);
      console.error(chalk.red(`Error: ${error.message}`));
    }

    rl.prompt();
  }).on('close', () => {
    console.log(chalk.green('Goodbye!'));
    process.exit(0);
  });
}

// Show help information
function showHelp() {
  console.log(chalk.green('\nAvailable commands:'));
  console.log('  help              Show this help information');
  console.log('  exit, quit        Exit the shell');
  console.log(chalk.cyan('\nSpecial commands:'));
  console.log('  /explain <file>   Explain the code in a file');
  console.log('  /improve <file>   Suggest improvements for a file');
  console.log('  /generate <desc>  Generate code based on description');
  console.log('  /save <file>      Save the last code example to a file');
  console.log('  /summarize        Summarize the current project');
  console.log('  /context          Show the current context');
  console.log(chalk.yellow('\nAsk any coding question directly:'));
  console.log('  How do I implement a binary search in JavaScript?');
  console.log("  What's the best way to handle errors in async functions?");
  console.log();
}

// Handle shell commands
async function handleShellCommand(command) {
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case 'explain':
      if (!args) {
        console.log(chalk.red('Error: Missing file path'));
        return;
      }
      await handleExplain(args);
      break;

    case 'improve':
      if (!args) {
        console.log(chalk.red('Error: Missing file path'));
        return;
      }
      await handleImprove(args);
      break;

    case 'generate':
      if (!args) {
        console.log(chalk.red('Error: Missing description'));
        return;
      }
      await handleGenerate(args);
      break;

    case 'save':
      if (!args) {
        console.log(chalk.red('Error: Missing file path'));
        return;
      }
      handleSaveLastCode(args);
      break;

    case 'summarize':
      await handleSummarize();
      break;

    case 'context':
      await showContext();
      break;

    default:
      console.log(chalk.red(`Unknown command: ${cmd}`));
      break;
  }
}

// Save the last code example to a file
function handleSaveLastCode(filePath) {
  // This would require tracking the last code example
  console.log(chalk.yellow('This feature is not implemented yet.'));
}

// Show the current context
async function showContext() {
  const context = await getProjectContext();

  console.log(chalk.green('\n--- Current Context ---\n'));
  console.log('Working directory:', chalk.cyan(context.workingDirectory));
  console.log('Project type:', chalk.cyan(context.projectType || 'Unknown'));
  console.log('Files in context:', chalk.cyan(context.files.length));

  if (context.packageInfo) {
    console.log(chalk.green('\nPackage Information:'));
    console.log('Name:', chalk.cyan(context.packageInfo.name));
    console.log('Version:', chalk.cyan(context.packageInfo.version));

    if (
      context.packageInfo.dependencies &&
      Object.keys(context.packageInfo.dependencies).length > 0
    ) {
      console.log(chalk.green('\nDependencies:'));
      for (const [dep, version] of Object.entries(
        context.packageInfo.dependencies
      )) {
        console.log(`${chalk.cyan(dep)}: ${version}`);
      }
    }
  }

  console.log(chalk.green('\nProject Structure:'));

  // Show tree-like structure
  const dirs = new Set();
  context.files.forEach(file => {
    const dir = path.dirname(file);
    if (dir !== '.') {
      dirs.add(dir);
    }
  });

  const sortedDirs = Array.from(dirs).sort();

  for (const dir of sortedDirs) {
    console.log(chalk.cyan(`└── ${dir}`));

    const filesInDir = context.files
      .filter(file => path.dirname(file) === dir)
      .map(file => path.basename(file));

    for (const file of filesInDir) {
      console.log(chalk.yellow(`    └── ${file}`));
    }
  }

  const rootFiles = context.files
    .filter(file => path.dirname(file) === '.')
    .map(file => path.basename(file));

  for (const file of rootFiles) {
    console.log(chalk.yellow(`└── ${file}`));
  }
}

// Get the project context
async function getProjectContext(filePath = null) {
  const context = {
    workingDirectory: process.cwd(),
    files: [],
    fileContents: {},
    projectType: null,
    packageInfo: null,
    gitInfo: null,
  };

  try {
    // If file path is provided, focus on that file and its directory
    const focusDir = filePath
      ? path.dirname(path.resolve(filePath))
      : process.cwd();

    // Detect project type
    if (fs.existsSync(path.join(focusDir, 'package.json'))) {
      context.projectType = 'node';
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(focusDir, 'package.json'), 'utf8')
        );
        context.packageInfo = {
          name: packageJson.name,
          version: packageJson.version,
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
        };
      } catch (error) {
        // Ignore package.json parsing errors
      }
    } else if (fs.existsSync(path.join(focusDir, 'go.mod'))) {
      context.projectType = 'go';
    } else if (
      fs.existsSync(path.join(focusDir, 'pom.xml')) ||
      fs.existsSync(path.join(focusDir, 'build.gradle'))
    ) {
      context.projectType = 'java';
    } else if (
      fs.existsSync(path.join(focusDir, 'requirements.txt')) ||
      fs.existsSync(path.join(focusDir, 'setup.py'))
    ) {
      context.projectType = 'python';
    }

    // Get git info if available
    try {
      const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        stdio: 'pipe',
      })
        .toString()
        .trim();
      context.gitInfo = {
        branch: gitBranch,
      };
    } catch (error) {
      // Not a git repository or git not installed
    }

    // Get relevant files
    if (filePath) {
      // If analyzing a specific file, include that file and its imports
      context.files.push(path.relative(process.cwd(), filePath));
      context.fileContents[path.relative(process.cwd(), filePath)] =
        fs.readFileSync(filePath, 'utf8');

      // TODO: Extract imports and include them
    } else {
      // Otherwise, get a sample of important files
      const patterns = [
        // Configuration files
        'package.json',
        'tsconfig.json',
        '.env.example',
        '.gitignore',
        // Source files, limit the scope for performance
        '*.{js,ts,jsx,tsx,py,java,go,rb}',
        'src/*.{js,ts,jsx,tsx,py,java,go,rb}',
        'src/**/*.{js,ts,jsx,tsx,py,java,go,rb}',
      ];

      const foundFiles = await glob(patterns, {
        cwd: focusDir,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
        maxDepth: 3, // Limit depth to avoid scanning too many files
      });

      // Limit to 20 files maximum for performance
      context.files = foundFiles
        .slice(0, 20)
        .map(file => path.join(path.relative(process.cwd(), focusDir), file));

      // Get content of the most relevant files
      for (const file of context.files.slice(0, 5)) {
        try {
          context.fileContents[file] = fs.readFileSync(
            path.resolve(process.cwd(), file),
            'utf8'
          );
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    return context;
  } catch (error) {
    console.error(chalk.red(`Error getting project context: ${error.message}`));
    return context;
  }
}

// Send a request to the agent
async function sendToAgent(payload) {
  const config = loadConfig();
  const token = options.token || (config && config.token);
  const agentId = options.agentId || (config && config.agentId);

  if (!token || !agentId) {
    throw new Error('Authentication required. Run with --init to set up.');
  }

  try {
    const response = await axios.post(
      API_ENDPOINT,
      {
        ...payload,
        agentId,
        environment: 'cli',
        workingDirectory: process.cwd(),
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': `AgentCLI/${VERSION}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error(
        'Could not connect to agent service. Check your internet connection.'
      );
    } else {
      throw error;
    }
  }
}

// Prompt the user for input
function promptUser(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Start a spinner
function startSpinner(message) {
  if (options.verbose) {
    console.log(chalk.blue(message));
    return null;
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;

  process.stdout.write(`${chalk.blue(message)} `);

  const spinner = setInterval(() => {
    process.stdout.write(`\r${chalk.blue(message)} ${chalk.cyan(frames[i])}`);
    i = (i + 1) % frames.length;
  }, 80);

  return spinner;
}

// Stop a spinner
function stopSpinner(spinner) {
  if (spinner) {
    clearInterval(spinner);
    process.stdout.write('\r\033[K'); // Clear the line
  }
}

// Start the program
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
