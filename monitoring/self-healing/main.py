#!/usr/bin/env python3
"""
ASOOS Self-Healing Service Monitor
Auto-remediation for Cloud Run services with Diamond SAO integration
"""
import os
import json
import time
import requests
from google.cloud import run_v2
from google.cloud import monitoring_v3
from google.cloud import logging
import functions_framework

PROJECT_ID = os.environ.get('PROJECT_ID', 'api-for-warp-drive')
REGIONS = ['us-west1', 'us-central1']
DIAMOND_SAO_URL = 'https://mocoa-owner-interface-859242575175.us-central1.run.app'

# Critical services that require immediate healing
CRITICAL_SERVICES = [
    'universal-gateway',
    'mcp-zaxxon-2100-cool',
    'payment-pipeline', 
    'pcp-activation-service',
    'mongodb-mcp-oauth-uscentral1',
    'auto-provision-mcp-uscentral1'
]

class ServiceHealer:
    def __init__(self):
        self.run_client = run_v2.ServicesClient()
        self.monitoring_client = monitoring_v3.MetricServiceClient()
        self.logging_client = logging.Client()
        
    def check_service_health(self, service_name, region):
        """Check if a Cloud Run service is healthy"""
        try:
            service_url = f"https://{service_name}-859242575175.{region}.run.app/health"
            response = requests.get(service_url, timeout=10)
            
            if response.status_code == 200:
                return True, "Healthy"
            elif response.status_code == 403:
                # 403 with Cloudflare protection is actually healthy
                return True, "Protected (Healthy)"
            else:
                return False, f"HTTP {response.status_code}"
                
        except requests.exceptions.RequestException as e:
            return False, f"Connection error: {str(e)}"
    
    def restart_service(self, service_name, region):
        """Restart a Cloud Run service"""
        try:
            service_path = f"projects/{PROJECT_ID}/locations/{region}/services/{service_name}"
            
            # Force new revision deployment to restart service
            service = self.run_client.get_service(name=service_path)
            
            # Update with a timestamp to force new revision
            current_time = str(int(time.time()))
            if not service.spec.template.metadata.annotations:
                service.spec.template.metadata.annotations = {}
            
            service.spec.template.metadata.annotations['auto-healer-restart'] = current_time
            
            operation = self.run_client.update_service(service=service)
            operation.result()  # Wait for completion
            
            self.log_event(f"✅ Restarted {service_name} in {region}", "INFO")
            return True
            
        except Exception as e:
            self.log_event(f"❌ Failed to restart {service_name} in {region}: {str(e)}", "ERROR")
            return False
    
    def scale_service(self, service_name, region, min_instances=2):
        """Scale up service instances"""
        try:
            service_path = f"projects/{PROJECT_ID}/locations/{region}/services/{service_name}"
            service = self.run_client.get_service(name=service_path)
            
            # Update scaling settings
            service.spec.template.metadata.annotations['run.googleapis.com/execution-environment'] = 'gen2'
            service.spec.template.spec.scaling.min_instance_count = min_instances
            
            operation = self.run_client.update_service(service=service)
            operation.result()
            
            self.log_event(f"📈 Scaled {service_name} in {region} to min {min_instances} instances", "INFO")
            return True
            
        except Exception as e:
            self.log_event(f"❌ Failed to scale {service_name} in {region}: {str(e)}", "ERROR")
            return False
    
    def log_event(self, message, severity="INFO"):
        """Log events to Cloud Logging"""
        logger = self.logging_client.logger("service-auto-healer")
        logger.log_text(message, severity=severity)
        print(f"[{severity}] {message}")
    
    def notify_diamond_sao(self, event_data):
        """Send notifications to Diamond SAO Command Center v34"""
        try:
            response = requests.post(
                f"{DIAMOND_SAO_URL}/api/diamond-sao/v34/alerts",
                json=event_data,
                timeout=10
            )
            if response.status_code == 200:
                self.log_event("📡 Notified Diamond SAO Command Center", "INFO")
            else:
                self.log_event(f"⚠️ Diamond SAO notification failed: {response.status_code}", "WARNING")
                
        except Exception as e:
            self.log_event(f"❌ Diamond SAO notification error: {str(e)}", "ERROR")
    
    def heal_all_services(self):
        """Check and heal all critical services"""
        healing_report = {
            "timestamp": time.time(),
            "services_checked": [],
            "services_healed": [],
            "services_failed": [],
            "total_actions": 0
        }
        
        for service in CRITICAL_SERVICES:
            for region in REGIONS:
                self.log_event(f"🔍 Checking {service} in {region}...", "INFO")
                
                is_healthy, status = self.check_service_health(service, region)
                service_info = {
                    "service": service,
                    "region": region, 
                    "status": status,
                    "healthy": is_healthy
                }
                
                healing_report["services_checked"].append(service_info)
                
                if not is_healthy:
                    self.log_event(f"🚨 {service} in {region} is unhealthy: {status}", "WARNING")
                    
                    # Attempt healing sequence
                    healing_actions = []
                    
                    # Step 1: Scale up instances
                    if self.scale_service(service, region, min_instances=3):
                        healing_actions.append("scaled_up")
                        time.sleep(30)  # Wait for scale-up
                    
                    # Step 2: Restart service if still unhealthy
                    is_healthy_after_scale, _ = self.check_service_health(service, region)
                    if not is_healthy_after_scale:
                        if self.restart_service(service, region):
                            healing_actions.append("restarted")
                            time.sleep(60)  # Wait for restart
                    
                    # Step 3: Final health check
                    time.sleep(30)
                    is_final_healthy, final_status = self.check_service_health(service, region)
                    
                    service_healing = {
                        "service": service,
                        "region": region,
                        "actions_taken": healing_actions,
                        "final_status": final_status,
                        "healed": is_final_healthy
                    }
                    
                    if is_final_healthy:
                        healing_report["services_healed"].append(service_healing)
                        self.log_event(f"✅ Successfully healed {service} in {region}", "INFO")
                    else:
                        healing_report["services_failed"].append(service_healing)
                        self.log_event(f"❌ Failed to heal {service} in {region}", "ERROR")
                    
                    healing_report["total_actions"] += len(healing_actions)
                else:
                    self.log_event(f"✅ {service} in {region} is healthy", "INFO")
        
        # Send comprehensive report to Diamond SAO
        self.notify_diamond_sao({
            "type": "self_healing_report",
            "report": healing_report,
            "diamond_sao_version": "v34"
        })
        
        return healing_report

@functions_framework.http
def heal_services(request):
    """HTTP Cloud Function entry point"""
    healer = ServiceHealer()
    report = healer.heal_all_services()
    
    return json.dumps(report, indent=2)

@functions_framework.cloud_event  
def heal_services_pubsub(cloud_event):
    """Pub/Sub triggered healing"""
    healer = ServiceHealer()
    healer.heal_all_services()

if __name__ == "__main__":
    # Local testing
    healer = ServiceHealer()
    report = healer.heal_all_services()
    print(json.dumps(report, indent=2))
