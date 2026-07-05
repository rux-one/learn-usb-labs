#!/usr/bin/env bash
# Verify the environment needed for the USB labs: usbmon, tshark, node, python, permissions.
set -uo pipefail

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$1"; }
bold()  { printf '\033[1m%s\033[0m\n' "$1"; }

ok=0
fail=0
check_ok()   { green "  [ok]   $1"; ok=$((ok+1)); }
check_fail() { red   "  [MISS] $1"; fail=$((fail+1)); }

bold "== USB Labs environment check =="

# --- Tools ---
bold "Tools"
for tool in tshark node npm python3; do
  if command -v "$tool" >/dev/null 2>&1; then
    check_ok "$tool -> $(command -v "$tool")"
  else
    check_fail "$tool not found"
  fi
done

# --- usbmon kernel module ---
bold "usbmon kernel interface"
# /sys/module avoids piping lsmod into grep -q, which trips pipefail via SIGPIPE
if [ -d /sys/module/usbmon ]; then
  check_ok "usbmon module loaded"
else
  check_fail "usbmon not loaded  ->  sudo modprobe usbmon"
fi

# debugfs mount (where usbmon lives); its contents are root-only, so only
# check the mount itself and list buses when we can actually read the dir
if grep -qs ' /sys/kernel/debug debugfs' /proc/mounts; then
  check_ok "debugfs mounted at /sys/kernel/debug (usbmon dir readable only by root)"
  if [ -r /sys/kernel/debug/usb/usbmon ]; then
    buses=$(ls /sys/kernel/debug/usb/usbmon 2>/dev/null | grep -E '^[0-9]+u$' | tr '\n' ' ')
    [ -n "$buses" ] && yellow "         available bus interfaces: $buses"
  fi
else
  check_fail "debugfs not mounted -> sudo mount -t debugfs none /sys/kernel/debug"
fi

# --- capture interfaces visible to tshark ---
bold "Capture interfaces"
if command -v tshark >/dev/null 2>&1; then
  usbmon_ifaces=$(tshark -D 2>/dev/null | grep -i usbmon || true)
  if [ -n "$usbmon_ifaces" ]; then
    check_ok "tshark sees usbmon interfaces:"
    echo "$usbmon_ifaces" | sed 's/^/           /'
  else
    check_fail "tshark sees no usbmon interfaces (need permissions or usbmon load)"
  fi
fi

# --- permissions ---
bold "Permissions"
if id -nG "$USER" 2>/dev/null | grep -qw wireshark; then
  check_ok "user '$USER' is in the 'wireshark' group"
else
  yellow "  [warn] user '$USER' not in 'wireshark' group."
  yellow "         capture will need sudo, or run:"
  yellow "           sudo usermod -aG wireshark $USER   (then re-login)"
fi

echo
bold "Summary: $ok ok, $fail missing"
if [ "$fail" -gt 0 ]; then
  yellow "Fix the [MISS] items above, then re-run this script."
  exit 1
fi
green "Environment looks good. You can capture and run the dashboard."
