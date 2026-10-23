#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/bin:/bin
case "${SSH_ORIGINAL_COMMAND:-}" in
  check) echo 'Restricted deployment key works' ;;
  upload)
    umask 077
    mkdir -p /home/crmapp/.crm-deploy
    candidate=$(mktemp /home/crmapp/.crm-deploy/script.XXXXXX)
    trap 'rm -f "$candidate"' EXIT
    head -c 4097 > "$candidate"
    cmp -s "$candidate" /usr/local/lib/crm/remote.sh || { echo 'Script differs from administrator-approved version'; exit 1; }
    mv "$candidate" /home/crmapp/.crm-deploy/remote.sh
    ;;
  deploy\ *)
    revision=${SSH_ORIGINAL_COMMAND#deploy }
    [[ $revision =~ ^[0-9a-f]{40}$ ]] || exit 2
    cmp -s /home/crmapp/.crm-deploy/remote.sh /usr/local/lib/crm/remote.sh || exit 1
    exec bash /usr/local/lib/crm/remote.sh "$revision"
    ;;
  *) echo 'Only CI upload and deployment commands are allowed' >&2; exit 1 ;;
esac
