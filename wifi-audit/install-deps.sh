#!/usr/bin/env bash
# One-shot dependency installer for Debian/Ubuntu/Kali.
set -euo pipefail
if [[ $EUID -ne 0 ]]; then exec sudo "$0" "$@"; fi

apt-get update
apt-get install -y \
  python3 python3-venv python3-pip \
  iw aircrack-ng \
  hcxtools hcxdumptool \
  hashcat wordlists

if [[ ! -f /usr/share/wordlists/rockyou.txt && -f /usr/share/wordlists/rockyou.txt.gz ]]; then
  gunzip -k /usr/share/wordlists/rockyou.txt.gz
fi

echo "Done. Now: cd $(dirname "$0") && sudo ./run.sh"
