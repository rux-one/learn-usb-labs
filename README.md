# USB Reverse-Engineering Mini-Lab Series

Learn USB by **capturing real traffic** on Linux and **visualizing** it in a local web dashboard.
No special hardware required — just Linux `usbmon` + Wireshark's `tshark`, and a browser.

```
Real USB device  ──►  usbmon (kernel)  ──►  tshark  ──►  .pcapng
                                                            │
                                    scripts/pcap-to-json.py │
                                                            ▼
                                              normalized JSON  ──►  web dashboard
```

## Quick start

```bash
# 1. Check your environment (usbmon loaded? tshark installed? permissions?)
./scripts/check-env.sh

# 2. Start the dashboard
cd web && npm install && npm run dev
# open the printed http://localhost:5173

# 3. Capture some traffic (needs sudo or the 'wireshark' group)
./scripts/capture.sh            # interactive: pick a bus, records 10s
# -> writes captures/<name>.pcapng

# 4. Convert to the dashboard's JSON format
./scripts/pcap-to-json.py captures/my-capture.pcapng captures/my-capture.json

# 5. Drag the .pcapng OR .json into the dashboard's Capture Loader
```

The dashboard can parse **`.pcapng` directly in the browser** (via a bundled parser) or
load pre-converted **`.json`**. Bundled sample captures live in `captures/samples/` so
every lab works before you record your own.

## The labs

| Lab | Topic | Key visuals |
|-----|-------|-------------|
| **0** | Setup & first capture | Packet list, hex view |
| **1** | Enumeration & descriptors | Enumeration sequence diagram, descriptor tree |
| **2** | Transfer types & packets | Transfer timeline, SETUP/DATA/STATUS stages |
| **3** | Decoding class traffic (HID) | Report byte → meaning mapping |
| **4** | RE workflow: diffing | Capture diff, field annotation |
| **5** | Replay & intro to fuzzing | pyusb replay/mutator (opt-in, safety-gated) |

Each lab has a walkthrough in [`labs/`](labs/).

## Prerequisites

- **Linux** with `usbmon` (part of the kernel; `sudo modprobe usbmon`).
- **Wireshark / tshark** for capture and conversion.
- **Node.js + npm** for the dashboard.
- **Python 3** for `pcap-to-json.py` (and `pyusb` for the optional Lab 5).

On **NixOS**, a `flake.nix` / `shell.nix` is provided:

```bash
nix develop        # or: nix-shell
```

Run `./scripts/check-env.sh` — it prints exactly what's missing and how to fix it.

## Safety

Labs 0–4 are **read-only analysis**. Lab 5 (replay/fuzzing) can *send* data to a device and
is disabled by default; it requires an explicit flag and a device you're willing to break.
Never fuzz a device with important data or one you don't own.
