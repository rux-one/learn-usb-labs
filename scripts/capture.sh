#!/usr/bin/env bash
# Capture USB traffic from a usbmon bus into captures/<name>.pcapng
#
# Usage:
#   ./scripts/capture.sh                 # interactive: pick bus + duration
#   ./scripts/capture.sh -b 1 -d 10 -o mydev
#     -b BUS       usbmon bus number (e.g. 1 for usbmon1). 0 = all buses.
#     -d SECONDS   capture duration (default 10)
#     -o NAME      output name (writes captures/NAME.pcapng)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
CAP_DIR="$REPO_DIR/captures"
mkdir -p "$CAP_DIR"

BUS=""
DURATION=10
NAME=""

while getopts "b:d:o:h" opt; do
  case "$opt" in
    b) BUS="$OPTARG" ;;
    d) DURATION="$OPTARG" ;;
    o) NAME="$OPTARG" ;;
    h) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option"; exit 1 ;;
  esac
done

if ! command -v tshark >/dev/null 2>&1; then
  echo "tshark not found. Run ./scripts/check-env.sh first." >&2
  exit 1
fi

echo "Available usbmon interfaces:"
tshark -D 2>/dev/null | grep -i usbmon || {
  echo "No usbmon interfaces. Try: sudo modprobe usbmon" >&2; exit 1; }

if [ -z "$BUS" ]; then
  echo
  read -rp "Enter usbmon bus number (0 = all buses): " BUS
fi

if [ -z "$NAME" ]; then
  read -rp "Output name [capture]: " NAME
  NAME="${NAME:-capture}"
fi

IFACE="usbmon${BUS}"
OUT="$CAP_DIR/${NAME}.pcapng"

echo
echo ">> Capturing on '$IFACE' for ${DURATION}s -> $OUT"
echo ">> Interact with your device now (plug in / type / read files)..."
echo

# -a duration: stop after N seconds. May need sudo depending on permissions.
if tshark -i "$IFACE" -a "duration:${DURATION}" -w "$OUT" 2>/dev/null; then
  :
else
  echo "Permission denied? retrying with sudo..." >&2
  sudo tshark -i "$IFACE" -a "duration:${DURATION}" -w "$OUT"
fi

echo
echo ">> Saved $OUT"
echo ">> Convert with: ./scripts/pcap-to-json.py \"$OUT\" \"${OUT%.pcapng}.json\""
echo ">> Or drag the .pcapng straight into the dashboard."
