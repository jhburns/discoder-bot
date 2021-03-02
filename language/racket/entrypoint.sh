#!/bin/bash

timeout --signal=SIGTERM ${BOT_TIMEOUT} "$@"

OUTPUT="$?"

if [ "$OUTPUT" -eq 124 ]
then
    echo "⌛ ‼️ Code timed out."
fi

exit "$OUTPUT"