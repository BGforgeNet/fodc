#!/bin/bash

set -xeu -o pipefail

cd "$(dirname "$0")"
tsx src/parse-data.ts mods out
