provider "google" {
  credentials = file("./.secrets/gcp-auth.json")
  project = "temp-305913"
  region = "us-central1"
  zone = "us-central1-b"
}
