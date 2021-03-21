variable "discord_auth_token" {
  description = "Discord authorization token needed by the bot."
  type = string
}

variable "image_repo_and_name" {
  description = "The docker image to be pulled, and watched for updates."
  type = string
}

variable "git_clone_repo_url" {
  description = "URL of the git repo that is cloned into the instance."
  type = string
}
