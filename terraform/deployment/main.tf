terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  backend "gcs" {
    bucket = "api-for-warp-drive-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run service
resource "google_cloud_run_service" "main" {
  name     = "${var.environment}-service"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/${var.environment}-app:latest"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud Build trigger
resource "google_cloudbuild_trigger" "deploy" {
  name = "${var.environment}-deploy"

  trigger_template {
    branch_name = var.environment == "production" ? "main" : var.environment
    repo_name   = "api-for-warp-drive"
  }

  filename = "build/cloudbuild.yaml"

  substitutions = {
    _ENVIRONMENT = var.environment
  }
}