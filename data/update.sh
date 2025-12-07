#!/bin/bash

set -xeu -o pipefail

cd "$(dirname "$0")"
pnpm exec tsx src/parse-data.ts mods out
