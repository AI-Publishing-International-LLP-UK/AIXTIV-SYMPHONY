resource "google_project_iam_binding" "super_claude" {
  project = "anthology-ai-publishing"
  role    = "roles/owner"
  members = [
    "serviceAccount:super-claude@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}