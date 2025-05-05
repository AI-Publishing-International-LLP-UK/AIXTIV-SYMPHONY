resource "google_cloudfunctions_function" "dr_claude" {
  name        = "delegateTask"
  runtime     = "nodejs20"
  entry_point = "delegateTask"
  source_archive_bucket = "your-bucket"
  source_archive_object = "dr-claude.zip"
  trigger_http = true
  available_memory_mb = 512
  timeout = 60
}
