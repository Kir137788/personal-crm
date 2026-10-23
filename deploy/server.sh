#!/usr/bin/env bash
# Installed root-owned; never execute a workflow-provided script as root.
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
export HOME=/root
umask 077
base=/opt/personal-crm
repo=ghcr.io/kir137788/personal-crm
[[ $EUID == 0 ]] || { echo 'Root helper required'; exit 1; }
exec 9>/run/lock/crm-release.lock
flock -w 300 9
cd "$base"
compose() { docker compose --env-file /dev/null -p prod -f "$base/compose.yaml" "$@"; }
valid_sha() { [[ $1 =~ ^[0-9a-f]{40}$ ]]; }
read_revision() { [[ ! -f $1 ]] || cat "$1"; }
smoke() {
  for ((i=0;i<30;i++)); do
    if curl -fsS --max-time 5 http://127.0.0.1:3000/health 2>/dev/null |
      python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("status")=="ok" and d.get("revision")==sys.argv[1] else 1)' "$APP_REVISION" 2>/dev/null; then
      echo "Health 200; revision $APP_REVISION"
      return 0
    fi
    sleep 2
  done
  echo 'Health check failed. No automatic rollback was performed.' >&2
  return 1
}
record_success() {
  local old
  old=$(read_revision current)
  if [[ -n $old && $old != "$APP_REVISION" ]]; then printf '%s\n' "$old" > previous; fi
  printf '%s\n' "$APP_REVISION" > current
  local tag previous
  previous=$(read_revision previous)
  while IFS= read -r tag; do
    if valid_sha "$tag" && [[ $tag != "$APP_REVISION" && $tag != "$previous" ]]; then
      docker image rm "$repo:$tag" >/dev/null || echo "Image $tag retained because it is in use"
    fi
  done < <(docker image ls "$repo" --format '{{.Tag}}')
}
action=${1:-}
case "$action" in
  deploy)
    [[ $# == 2 ]] && valid_sha "$2" || exit 2
    export APP_REVISION=$2
    [[ -f .env && $(stat -c '%a' .env) == 600 && $(stat -c '%u' .env) == 0 ]] || { echo 'Root-owned .env with mode 600 required'; exit 1; }
    config=$(mktemp -d /run/crm-registry.XXXXXX)
    trap 'rm -rf "$config"' EXIT
    docker --config "$config" login ghcr.io -u Kir137788 --password-stdin >/dev/null 2>&1
    docker --config "$config" pull "$repo:$APP_REVISION"
    rm -rf "$config"
    trap - EXIT
    # One-time adoption of the existing PostgreSQL volume. Never run two servers on it.
    if [[ ! -f adopted ]]; then
      docker volume inspect krug_postgres_data --format '{{.Name}}' >/dev/null
      docker exec krug-db-1 pg_dump -U krug -d krug -Fc > before-adoption.dump.tmp
      mv before-adoption.dump.tmp before-adoption.dump
      docker stop krug-app-1 krug-db-1 >/dev/null
      touch adopted
    fi
    compose up -d --wait --wait-timeout 180 db
    # set -e prevents app replacement when migrations fail.
    compose run --rm --no-deps migrate
    compose up -d --no-deps app
    smoke
    record_success
    ;;
  rollback)
    [[ $# == 1 ]] || exit 2
    export APP_REVISION=$(read_revision previous)
    valid_sha "$APP_REVISION" || { echo 'No previous successful release'; exit 1; }
    compose up -d --no-deps app
    smoke
    record_success
    ;;
  seed)
    [[ $# == 1 ]] || exit 2
    [[ ! -f seeded ]] || { echo 'Seed already completed; skipping'; exit 0; }
    export APP_REVISION=$(read_revision current)
    valid_sha "$APP_REVISION" || exit 1
    smoke
    compose run --rm --no-deps seed
    touch seeded
    ;;
  status)
    [[ $# == 1 ]] || exit 2
    echo "Successful revision: $(read_revision current)"
    echo "Previous revision: $(read_revision previous)"
    docker ps --filter label=com.docker.compose.project=prod --format '{{.Names}} {{.Status}} {{.Ports}}'
    ;;
  *) echo 'Usage: crm-release deploy SHA | rollback | seed | status'; exit 2 ;;
esac
