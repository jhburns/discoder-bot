#!/bin/bash

timeout --signal=SIGTERM ${BOT_TIMEOUT} "$@"

# Add output so what is happening is more clear to users
if [ $? -eq 124 ]
then
    echo "⌛ ‼️ Code timed out."
    exit 124
fi