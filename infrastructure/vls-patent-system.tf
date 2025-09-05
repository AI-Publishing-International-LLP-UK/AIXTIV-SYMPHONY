# VLS Patent System - Enterprise Infrastructure
# Vision Lake System with SallyPort Authentication & Dr. Burby Integration

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "api-for-warp-drive-terraform"
    prefix = "vls-patent-system"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "api-for-warp-drive"
}

variable "region" {
  description = "Primary GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (production/staging)"
  type        = string
  default     = "production"
}

# Provider Configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable Required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudtrace.googleapis.com",
    "cloudsql.googleapis.com",
    "redis.googleapis.com",
    "compute.googleapis.com",
    "dns.googleapis.com",
    "certificatemanager.googleapis.com",
    "iamcredentials.googleapis.com",
    "oauth2.googleapis.com"
  ])
  
  project = var.project_id
  service = each.value
  
  disable_on_destroy = false
}

# VLS Patent System Service Accounts
resource "google_service_account" "vls_patent_system" {
  account_id   = "vls-patent-system"
  display_name = "VLS Patent System Main Service Account"
  description  = "Service account for VLS Patent System with SallyPort authentication"
}

resource "google_service_account" "dr_burby_fleet" {
  account_id   = "dr-burby-fleet"
  display_name = "Dr. Burby Fleet Service Account"
  description  = "Service account for managing 10,000+ Dr. Burby instances"
}

resource "google_service_account" "sallyport_auth" {
  account_id   = "sallyport-auth"
  display_name = "SallyPort Authentication Service"
  description  = "Service account for SallyPort OAuth2 authentication system"
}

resource "google_service_account" "mcp_integration" {
  account_id   = "mcp-integration"
  display_name = "MCP Integration Service Account"
  description  = "Service account for Model Context Protocol integrations"
}

resource "google_service_account" "cicd_pipeline" {
  account_id   = "cicd-pipeline"
  display_name = "CI/CD CTTT Pipeline Service Account"
  description  = "Service account for Continuous Testing/Training/Tuning pipeline"
}

# IAM Roles for VLS Patent System
resource "google_project_iam_member" "vls_patent_system_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/secretmanager.secretAccessor",
    "roles/cloudsql.client",
    "roles/redis.editor",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/cloudtrace.agent"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.vls_patent_system.email}"
}

# IAM Roles for Dr. Burby Fleet
resource "google_project_iam_member" "dr_burby_fleet_roles" {
  for_each = toset([
    "roles/run.invoker",
    "roles/compute.instanceAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/aiplatform.user",
    "roles/ml.admin"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.dr_burby_fleet.email}"
}

# IAM Roles for SallyPort Auth
resource "google_project_iam_member" "sallyport_auth_roles" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
    "roles/iam.serviceAccountTokenCreator",
    "roles/oauth2.tokenExchanger"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sallyport_auth.email}"
}

# Secrets for VLS Patent System
resource "google_secret_manager_secret" "vls_secrets" {
  for_each = toset([
    "VLS_SALLYPORT_CLIENT_ID",
    "VLS_SALLYPORT_CLIENT_SECRET", 
    "VLS_DR_BURBY_API_KEY",
    "VLS_PATENT_MASTER_KEY",
    "VLS_MCP_INTEGRATION_TOKEN",
    "VLS_OAUTH2_PRIVATE_KEY"
  ])
  
  secret_id = each.value
  
  replication {
    auto {}
  }
  
  labels = {
    system      = "vls-patent-system"
    environment = var.environment
    component   = "authentication"
  }
}

# Cloud Run Service for VLS Patent System
resource "google_cloud_run_v2_service" "vls_patent_system" {
  name     = "vls-patent-system"
  location = var.region
  
  deletion_policy = "ABANDON"
  
  template {
    service_account = google_service_account.vls_patent_system.email
    
    # Scaling Configuration
    scaling {
      min_instance_count = 3
      max_instance_count = 100
    }
    
    # Container Configuration
    containers {
      name  = "vls-patent-container"
      image = "gcr.io/${var.project_id}/vls-patent-system:latest"
      
      ports {
        container_port = 8080
        name          = "http1"
      }
      
      # Resource Allocation
      resources {
        limits = {
          cpu    = "4"
          memory = "16Gi"
        }
        cpu_idle = true
        startup_cpu_boost = true
      }
      
      # Environment Variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "VLS_ENVIRONMENT"
        value = var.environment
      }
      
      env {
        name  = "CLOUD_ML_REGION"
        value = var.region
      }
      
      env {
        name  = "VLS_SALLYPORT_ENABLED"
        value = "true"
      }
      
      env {
        name  = "DR_BURBY_FLEET_SIZE"
        value = "10000"
      }
      
      # Secrets from Secret Manager
      env {
        name = "SALLYPORT_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.vls_secrets["VLS_SALLYPORT_CLIENT_ID"].secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "SALLYPORT_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.vls_secrets["VLS_SALLYPORT_CLIENT_SECRET"].secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "PINECONE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "PINECONE_API_KEY"
            version = "latest"
          }
        }
      }
      
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "OPENAI_API_KEY"
            version = "latest"
          }
        }
      }
      
      # Health Checks
      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds      = 10
        period_seconds       = 5
        failure_threshold    = 5
      }
      
      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 60
        timeout_seconds      = 10
        period_seconds       = 30
        failure_threshold    = 3
      }
    }
    
    # VPC Configuration
    vpc_access {
      connector = google_vpc_access_connector.vls_connector.id
      egress    = "ALL_TRAFFIC"
    }
    
    labels = {
      system      = "vls-patent-system"
      environment = var.environment
      component   = "patent-api"
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
  
  depends_on = [google_project_service.required_apis]
}

# VPC Connector for Cloud Run
resource "google_vpc_access_connector" "vls_connector" {
  name          = "vls-patent-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vls_network.name
  
  min_instances = 2
  max_instances = 10
}

# VLS Network Infrastructure
resource "google_compute_network" "vls_network" {
  name                    = "vls-patent-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "vls_subnet" {
  name          = "vls-patent-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.region
  network       = google_compute_network.vls_network.id
  
  secondary_ip_range {
    range_name    = "dr-burby-pods"
    ip_cidr_range = "10.1.0.0/16"
  }
  
  secondary_ip_range {
    range_name    = "mcp-services"
    ip_cidr_range = "10.2.0.0/16"
  }
}

# Cloud SQL for VLS System
resource "google_sql_database_instance" "vls_postgres" {
  name             = "vls-patent-db"
  database_version = "POSTGRES_15"
  region          = var.region
  
  settings {
    tier = "db-custom-4-16384"
    
    backup_configuration {
      enabled                        = true
      start_time                    = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 30
      }
    }
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vls_network.id
      require_ssl     = true
    }
    
    database_flags {
      name  = "max_connections"
      value = "1000"
    }
    
    maintenance_window {
      day  = 7
      hour = 4
    }
    
    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 20
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }
  
  deletion_protection = true
  
  depends_on = [google_service_networking_connection.vls_private_vpc_connection]
}

# Redis for VLS Caching
resource "google_redis_instance" "vls_cache" {
  name           = "vls-patent-cache"
  tier           = "STANDARD_HA"
  memory_size_gb = 10
  region         = var.region
  
  authorized_network = google_compute_network.vls_network.id
  
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
    notify-keyspace-events = "Ex"
  }
  
  labels = {
    system      = "vls-patent-system"
    environment = var.environment
  }
}

# Private VPC Connection for Cloud SQL
resource "google_compute_global_address" "vls_private_ip_address" {
  name          = "vls-private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vls_network.id
}

resource "google_service_networking_connection" "vls_private_vpc_connection" {
  network                 = google_compute_network.vls_network.id
  service                = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.vls_private_ip_address.name]
}

# Cloud Build for CI/CD CTTT Pipeline
resource "google_cloudbuild_trigger" "vls_cicd_trigger" {
  name        = "vls-patent-cicd-cttt"
  description = "VLS Patent System CI/CD CTTT Pipeline"
  
  service_account = google_service_account.cicd_pipeline.id
  
  github {
    owner = "AI-Publishing-International-LLP-UK"
    name  = "AIXTIV-SYMPHONY"
    push {
      branch = "^main$"
    }
  }
  
  filename = "cloudbuild-vls-patent.yaml"
  
  substitutions = {
    _ENVIRONMENT = var.environment
    _REGION      = var.region
    _SERVICE_NAME = "vls-patent-system"
  }
  
  tags = ["vls", "patent-system", "cicd", "cttt"]
}

# Load Balancer for VLS System
resource "google_compute_global_address" "vls_ip" {
  name = "vls-patent-system-ip"
}

resource "google_compute_managed_ssl_certificate" "vls_ssl" {
  name = "vls-patent-ssl"
  
  managed {
    domains = [
      "vls.2100.cool",
      "patent.2100.cool",
      "mcp.*.2100.cool"
    ]
  }
}

# Cloud Monitoring for VLS System
resource "google_monitoring_uptime_check_config" "vls_uptime_check" {
  display_name = "VLS Patent System Uptime Check"
  timeout      = "10s"
  period       = "60s"
  
  http_check {
    path         = "/health"
    port         = "443"
    use_ssl      = true
    validate_ssl = true
  }
  
  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "vls.2100.cool"
    }
  }
  
  content_matchers {
    content = "healthy"
    matcher = "CONTAINS_STRING"
  }
}

# Monitoring Alerts for VLS System
resource "google_monitoring_alert_policy" "vls_error_rate" {
  display_name = "VLS Patent System - High Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "Error rate > 5%"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"vls-patent-system\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.vls_alerts.name]
  
  alert_strategy {
    auto_close = "86400s"
  }
}

resource "google_monitoring_notification_channel" "vls_alerts" {
  display_name = "VLS Patent System Alerts"
  type         = "email"
  
  labels = {
    email_address = "pr@coaching2100.com"
  }
}

# Outputs
output "vls_patent_system_url" {
  description = "URL for the VLS Patent System"
  value       = google_cloud_run_v2_service.vls_patent_system.uri
}

output "vls_service_account_email" {
  description = "Email of the VLS Patent System service account"
  value       = google_service_account.vls_patent_system.email
}

output "dr_burby_fleet_service_account" {
  description = "Email of the Dr. Burby Fleet service account"
  value       = google_service_account.dr_burby_fleet.email
}

output "sallyport_auth_service_account" {
  description = "Email of the SallyPort Auth service account"  
  value       = google_service_account.sallyport_auth.email
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.vls_postgres.connection_name
}
