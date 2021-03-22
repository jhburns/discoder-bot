provider "google" {
  credentials = file("./.secrets/gcp-auth.json")
  project = "temp-305913"
  region = "us-central1"
  zone = "us-central1-a"
}

// Create random id
resource "random_id" "instance_id" {
 byte_length = 8
}

// Create firewall and its rules, for the default VPC
resource "google_compute_firewall" "discoder_bot" {
  name    = "discoder-bot-firewall"
  network = "default"

  // Allow pining
  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    // 22 for SSH, 80 and 443 for the bot
    ports = ["22", "80", "443"]
  }
}

locals {
  image_reference = "${var.image_repo_and_name}:latest"
}

// Create compute instance
resource "google_compute_instance" "discoder_bot" {
  name = "discoder-bot-${random_id.instance_id.hex}"

  // This instance type is always free
  machine_type = "f1-micro"
  can_ip_forward = false

  scheduling {
    automatic_restart = true
    on_host_maintenance = "MIGRATE"
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-1804-bionic-v20201014"
      size = 10 // GB
    }

    auto_delete = true
  }

  network_interface {
    network = "default"
    access_config {
    }
  }

  // Set SSH key
  metadata = {
    ssh-keys = "ubuntu:${file("./.secrets/id_rsa.pub")}"
  }

  metadata_startup_script = templatefile("./startup.tpl", {
    discord_auth_token = var.discord_auth_token
    image_reference = local.image_reference
    git_clone_repo_url = var.git_clone_repo_url
    pull_script_source = templatefile("./pull-script.tpl", {
      image_reference = local.image_reference
    })
  })
}

// Output the ip so it can be used with SSH
output "ip" {
  value = google_compute_instance.discoder_bot.network_interface.0.access_config.0.nat_ip
}
