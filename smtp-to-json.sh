#!/bin/bash

# SMTP to JSON converter script
# Usage: ./smtp-to-json.sh [input-file]
# If no input file is provided, reads from stdin

if [ $# -eq 0 ]; then
    # Read from stdin
    node "$(dirname "$0")/pub/dist/index.js"
elif [ $# -eq 1 ]; then
    # Read from file
    if [ -f "$1" ]; then
        cat "$1" | node "$(dirname "$0")/pub/dist/index.js"
    else
        echo "Error: File '$1' not found" >&2
        exit 1
    fi
else
    echo "Usage: $0 [input-file]" >&2
    echo "  If no input file is provided, reads from stdin" >&2
    exit 1
fi