#!/usr/bin/env bash
# Rolls the new version out, one pod at a time, once the migrations have run.
set -euo pipefail
kubectl -n invoicer set image deployment/api api="ghcr.io/invoicer/api:${GITHUB_SHA}"
kubectl -n invoicer rollout status deployment/api --timeout=5m
