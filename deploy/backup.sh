#!/usr/bin/env bash
set -euo pipefail
# Run with sudo on the CRM server before a schema-changing release.
[[ $EUID == 0 ]] || { echo 'Run with sudo'; exit 1; }
umask 077
backup_dir=/var/backups/personal-crm
install -d -m 700 "$backup_dir"
backup_file=$(mktemp "$backup_dir/before-release-$(date +%Y%m%d-%H%M%S)-XXXXXX.dump")
trap 'if [[ -n ${backup_file:-} ]]; then rm -f "$backup_file"; fi' EXIT
docker exec prod-db-1 pg_dump -U krug -d krug -Fc > "$backup_file"
test -s "$backup_file"
docker exec -i prod-db-1 pg_restore --list < "$backup_file" > /dev/null
printf 'Backup verified: %s\n' "$backup_file"
backup_file=
