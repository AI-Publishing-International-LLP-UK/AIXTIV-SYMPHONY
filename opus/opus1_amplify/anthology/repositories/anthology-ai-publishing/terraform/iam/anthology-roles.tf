resource "google_project_iam_binding" "vertex_ai_users" {
  project = "anthology-ai-publishing"
  role    = "roles/aiplatform.user"
  members = [
    "serviceAccount:claude-poet@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-memoria@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-grant@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-burby@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:doctora-maria@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-sabina@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-match@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-cypriot@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:memoria-vertex@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "storage_access" {
  project = "anthology-ai-publishing"
  role    = "roles/storage.objectViewer"
  members = [
    "serviceAccount:claude-poet@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-memoria@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:dr-grant@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "editors_storage" {
  project = "anthology-ai-publishing"
  role    = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:dr-burby@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:doctora-maria@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "system_admin" {
  project = "anthology-ai-publishing"
  role    = "roles/aiplatform.admin"
  members = [
    "serviceAccount:memoria-vertex@anthology-ai-publishing.iam.gserviceaccount.com",
    "user:pr@coaching2100.com"
  ]
}