#!/bin/bash
set -e

# Post-merge setup: keep the environment consistent after task merges.
# Idempotent and non-interactive.

npm install --no-audit --no-fund
