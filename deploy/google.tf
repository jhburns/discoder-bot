provider "google" {
  credentials = file("./.secrets/gcp-auth.json")
  project = "temp-305913"
  region = "us-central1"
  zone = "us-central1-b"
}

// Create random id
resource "random_id" "instance_id" {
 byte_length = 8
}

// TODO firewall

resource "google_compute_instance" "discoder_bot" {
  name = "discoder-bot-${random_id.instance_id.hex}"
  machine_type = "f1-micro"
  can_ip_forward = false

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-1804-bionic-v20201014"
      size = 10
    }

    auto_delete = true
  }

  network_interface {
    network = "default"
    access_config {
    }
  }

  metadata = {
    ssh-keys = "ubuntu:${file("./.secrets/id_rsa.pub")}"
  }
}

output "ip" {
  value = google_compute_instance.discoder_bot.network_interface.0.access_config.0.nat_ip
}
