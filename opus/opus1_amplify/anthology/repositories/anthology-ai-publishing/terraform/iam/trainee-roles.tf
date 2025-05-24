resource "google_project_iam_binding" "trainee_viewers" {
  project = "anthology-ai-publishing"
  role    = "roles/viewer"
  members = [
    "user:josh@coaching2100.com",
    "user:lori@coaching2100.com",
    "user:mike@coaching2100.com",
    "user:sarah@coaching2100.com",
    "user:alex@coaching2100.com"
  ]
}

resource "google_project_iam_binding" "trainee_developers" {
  project = "anthology-ai-publishing"
  role    = "roles/aiplatform.developer"
  members = [
    "user:josh@coaching2100.com",
    "user:lori@coaching2100.com",
    "user:mike@coaching2100.com",
    "user:sarah@coaching2100.com",
    "user:alex@coaching2100.com"
  ]
}

resource "google_project_iam_binding" "trainee_storage" {
  project = "anthology-ai-publishing"
  role    = "roles/storage.objectViewer"
  members = [
    "user:josh@coaching2100.com",
    "user:lori@coaching2100.com",
    "user:mike@coaching2100.com",
    "user:sarah@coaching2100.com",
    "user:alex@coaching2100.com"
  ]
}