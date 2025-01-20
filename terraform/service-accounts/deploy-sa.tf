resource "google_service_account" "deploy_sa" {
  account_id   = "github-deploy-sa"
  display_name = "GitHub Actions Deploy Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "deploy_sa_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/storage.admin",
    "roles/cloudbuild.builds.editor",
    "roles/iam.serviceAccountUser"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.deploy_sa.email}"
}

resource "google_iam_workload_identity_pool" "github_pool" {
  provider                  = google-beta
  workload_identity_pool_id = "github-pool"
  display_name             = "GitHub Actions Pool"
  description              = "Identity pool for GitHub Actions deployments"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  provider                           = google-beta
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }
  
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_binding" "workload_identity_binding" {
  service_account_id = google_service_account.deploy_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/C2100-PR/api-for-warp-drive"
  ]
}