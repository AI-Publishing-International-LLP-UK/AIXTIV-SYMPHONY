resource "google_service_account" "lucy_auto" {
  account_id   = "lucy-auto"
  display_name = "Lucy Auto Service Account"
  project      = "api-for-warp-drive"
}

resource "google_project_iam_member" "lucy_auto_permissions" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/run.invoker",
    "roles/cloudbuild.builds.editor",
    "roles/storage.objectViewer",
    "roles/cloudtrace.agent"
  ])
  
  project = "api-for-warp-drive"
  role    = each.key
  member  = "serviceAccount:${google_service_account.lucy_auto.email}"
}

resource "google_service_account_iam_binding" "admin_account_iam" {
  service_account_id = google_service_account.lucy_auto.name
  role               = "roles/iam.serviceAccountUser"
  members = [
    "user:pr@coaching2100.com"
  ]
}

output "lucy_auto_email" {
  value = google_service_account.lucy_auto.email
}