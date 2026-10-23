#!/usr/bin/env bash
set -euo pipefail
umask 077
mkdir -p "$HOME/.ssh"
trap 'rm -f "$HOME/.ssh/crm_deploy"' EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$HOME/.ssh/crm_deploy"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$HOME/.ssh/known_hosts"
ssh_options=(-i "$HOME/.ssh/crm_deploy" -o BatchMode=yes -o StrictHostKeyChecking=yes)
ssh "${ssh_options[@]}" crmapp@82.146.57.196 upload < deploy/remote.sh
printf '%s' "$GHCR_TOKEN" | ssh "${ssh_options[@]}" crmapp@82.146.57.196 "deploy $GITHUB_SHA"
curl --fail --silent --show-error --max-time 15 https://app.provansov.ru/health | python3 -c 'import json,os,sys; d=json.load(sys.stdin); assert d["status"] == "ok" and d["revision"] == os.environ["GITHUB_SHA"]; print("External HTTPS health: 200; revision:",d["revision"])'
