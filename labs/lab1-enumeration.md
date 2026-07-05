# Lab 1 — Enumeration & descriptors

**Goal:** understand the plug-in handshake and decode a device's descriptors.

## Capture

```bash
./scripts/capture.sh -b 1 -d 8 -o enum
# plug the device in DURING the capture window
```

Or click the **HID Keyboard** / **USB Flash Drive** sample in the dashboard.

## What to look for (dashboard: Lab 1)

- **Enumeration sequence** — the ordered standard control requests:
  - `GET_DESCRIPTOR (Device)` — first 8 bytes, then the full 18.
  - `SET_ADDRESS` — host assigns the device a bus address.
  - `GET_DESCRIPTOR (Configuration)` — header first, then the whole blob.
  - `GET_DESCRIPTOR (String)` — human-readable names (UTF-16LE).
  - `SET_CONFIGURATION` — device becomes usable.
- **Descriptor tree** — device → configuration → interface → endpoint.

## Key ideas

- Control transfers use **endpoint 0** and start with an 8-byte **SETUP** packet
  (`bmRequestType, bRequest, wValue, wIndex, wLength`).
- For `GET_DESCRIPTOR`, `wValue` high byte = descriptor type, low byte = index.
- The **interface descriptor's** class/subclass/protocol identifies the device
  type (e.g. `03/01/01` = HID boot keyboard, `08/06/50` = Mass Storage SCSI BOT).
- `bEndpointAddress` bit 7 = direction; `bmAttributes` low 2 bits = transfer type.
