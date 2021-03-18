variable "discord_auth_token" {
  description = "Discord authorization token needed by the bot."
  type = string
}

variable "runtime_image_name" {
  description = "The docker image to be pulled, and watched for updates."
  type = string
}