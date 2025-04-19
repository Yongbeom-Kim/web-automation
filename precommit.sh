#!/bin/bash

# Get list of staged files
files=$(git diff --cached --name-only --diff-filter=ACMR)

# Run prettier on staged files
yarn fmt

# Re-add formatted files that were previously staged
if [ -n "$files" ]; then
    echo "$files" | xargs git add
fi
