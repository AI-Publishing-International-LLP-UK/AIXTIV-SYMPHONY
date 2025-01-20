variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "api-for-warp-drive"
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "The deployment environment (production or staging)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["production", "staging"], var.environment)
    error_message = "Environment must be either 'production' or 'staging'."
  }
}