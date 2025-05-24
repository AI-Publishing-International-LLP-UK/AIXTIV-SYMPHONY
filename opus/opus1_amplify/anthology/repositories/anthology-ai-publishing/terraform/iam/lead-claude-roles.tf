resource "google_project_iam_binding" "claude_lead" {
  project = "anthology-ai-publishing"
  role    = "roles/aiplatform.admin"
  members = [
    "serviceAccount:claude-lead@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "claude_lead_storage" {
  project = "anthology-ai-publishing"
  role    = "roles/storage.admin"
  members = [
    "serviceAccount:claude-lead@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}