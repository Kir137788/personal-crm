#!/usr/bin/env bash
set -euo pipefail
exec sudo -n /usr/local/sbin/crm-release deploy "$1"
