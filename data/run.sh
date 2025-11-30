#!/bin/bash

set -xeu -o pipefail

tsx src/parse-data.ts mods out
