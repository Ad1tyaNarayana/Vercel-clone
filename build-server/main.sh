#!/bin/bash

export GIT_REPOSITORY__URL="$GIT_REPOSITORY__URL"

mkdir -p /app/output

git clone "$GIT_REPOSITORY__URL" /app/output

exec node script.js