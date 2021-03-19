#!/bin/bash
# This script should be ran as root

set -euf -o pipefail

# Add and enable swap if not already done
if [[ $(swapon -s | wc -l) -lt 2 ]];
then
  echo "-----------Enabling Swap-----------"
  # Also add 'ubuntu' user to docker group,
  # So containers can be run without root
  groupadd docker
  usermod -aG docker ubuntu

  # Add swap, none is enable by default
  fallocate -l 3G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  echo "/swapfile    none    swap    sw    0   0" >> /etc/fstab

  # Turn on swap limit support
  echo 'GRUB_CMDLINE_LINUX_DEFAULT="console=ttyS0 cgroup_enable=memory swapaccount=1"' \
    >> /etc/default/grub.d/50-cloudimg-settings.cfg

  update-grub
  reboot # Required for swap limit to take effect
fi

# Install packages and clone the bot code, if not already done
if [ ! -d "/home/ubuntu/discoder-bot" ]
then
  echo "-----------Setting Up System-----------"

  # Install Node.js
  curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
  apt-get install -y nodejs=14.16.0-1nodesource1

  # Install pm2 globally
  npm install -g pm2@4.5.5 pm2-logrotate@2.7.0

  # Install Docker
  apt-get update
  apt-get install --yes \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg \
      lsb-release

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | sudo gpg --yes --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

  echo \
    "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update
  apt-get install --yes docker-ce=5:20.10.* docker-ce-cli=5:20.10.* containerd.io=1.4.*

  # Pull runtime image
  docker pull ${runtime_image_name}

# Download code as ubuntu user, start watchtower
sudo -i -u ubuntu bash << EOF
  cd /home/ubuntu/
  git clone --depth 1 https://github.com/jhburns/discoder-bot.git

  # Install packages
  cd /home/ubuntu/discoder-bot/src/
  npm ci

  # Start watchtower in docker, 15 minute polling interval
  docker run -d \
      --name watchtower \
      -v /var/run/docker.sock:/var/run/docker.sock \
      --restart always \
      containrrr/watchtower:1.1.6 --cleanup --monitor-only --interval 900
EOF

fi

echo "-----------Starting Bot-----------"

sudo -i -u ubuntu bash << EOF
# Start bot from with pm2
cd /home/ubuntu/discoder-bot/src/

sudo DISCORD_AUTH_TOKEN=${discord_auth_token} \
  RUNTIME_IMAGE_NAME=${runtime_image_name} \
  pm2 start --name bot --log log.txt --exp-backoff-restart-delay=100 index.js
EOF