#!/bin/bash
# This script is for pulling the latest image, and cleaning up unneeded ones

# Pull latest image
docker pull ${image_reference}:latest

# Get all local image IDs, and convert that string to an array 
images_output=$(docker images --no-trunc --format "{{.ID}}")
readarray -t images_array <<<$images_output

# Delete all images that lack the 'latest' tag
for image in "$${images_array[@]}"
do
    image_tags="$(docker inspect --type=image "$image" --format '{{join .RepoTags " "}}')"
    if [[ "$image_tags" != *"latest"* ]]
    then
        docker image rm --force "$image"
    fi
done