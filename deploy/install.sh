#!/usr/bin/env bash
# Run interactively with sudo after reviewing this file and server.sh.
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Run with sudo'; exit 1; }
source_dir=$(cd -- "$(dirname -- "$0")" && pwd)
install -d -m 700 -o root -g root /opt/personal-crm
install -m 644 -o root -g root "$source_dir/compose.yaml" /opt/personal-crm/compose.yaml
install -m 755 -o root -g root "$source_dir/server.sh" /usr/local/sbin/crm-release
install -d -m 755 -o root -g root /usr/local/lib/crm
install -m 644 -o root -g root "$source_dir/remote.sh" /usr/local/lib/crm/remote.sh
install -m 755 -o root -g root "$source_dir/ssh-gate.sh" /usr/local/sbin/crm-ssh-gate
printf '%s\n' 'crmapp ALL=(root) NOPASSWD: /usr/local/sbin/crm-release' > /etc/sudoers.d/crm-release
chmod 440 /etc/sudoers.d/crm-release
visudo -cf /etc/sudoers.d/crm-release
# Only add a health location to the CRM virtual host; preserve landing and Basic auth.
python3 - <<'PY'
from pathlib import Path
import shutil
p=Path('/etc/nginx/sites-available/krug')
s=p.read_text()
marker='server_name app.provansov.ru;'
addition='''
    # crm-public-health
    location = /health {
        auth_basic off;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header Authorization "";
    }
'''
# Certbot also has an HTTP redirect block; edit the first (HTTPS) app block only.
if '# crm-public-health' not in s:
 if marker not in s: raise SystemExit('CRM nginx host not found')
 shutil.copy2(p, str(p)+'.before-ci')
 p.write_text(s.replace(marker, marker+addition, 1))
PY
nginx -t
systemctl reload nginx
echo 'Deployment helper installed. Configure .env before deploying.'
