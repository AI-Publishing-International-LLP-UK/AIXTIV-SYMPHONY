resource "google_project_iam_binding" "jenkins_runner" {
  project = "anthology-ai-publishing"
  role    = "roles/cloudbuild.builds.builder"
  members = [
    "serviceAccount:jenkins-runner@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "github_runner" {
  project = "anthology-ai-publishing"
  role    = "roles/iam.serviceAccountUser"
  members = [
    "serviceAccount:github-runner@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "ai_pipeline_runner" {
  project = "anthology-ai-publishing"
  role    = "roles/aiplatform.serviceAgent"
  members = [
    "serviceAccount:ai-pipeline@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}

resource "google_project_iam_binding" "human_assistants" {
  project = "anthology-ai-publishing"
  role    = "roles/aiplatform.admin"
  members = [
    "user:pr@coaching2100.com",
    "user:dk@coaching2100.com"
  ]
}

resource "google_project_iam_binding" "service_accounts_admin" {
  project = "anthology-ai-publishing"
  role    = "roles/iam.serviceAccountAdmin"
  members = [
    "serviceAccount:jenkins-admin@anthology-ai-publishing.iam.gserviceaccount.com",
    "serviceAccount:github-admin@anthology-ai-publishing.iam.gserviceaccount.com"
  ]
}