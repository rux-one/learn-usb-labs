# Lab 0 — Setup & first capture

**Goal:** capture USB traffic with usbmon and read the raw packet list.

## 1. Enable usbmon

```bash
sudo modprobe usbmon
ls /sys/kernel/debug/usb/usbmon      # should list 0u, 1u, ...
tshark -D | grep usbmon              # tshark should see the interfaces
```

If `tshark` can't see them, either run capture with `sudo` or add yourself to
the `wireshark` group: `sudo usermod -aG wireshark $USER` (re-login after).

## 2. Find your device's bus

```bash
lsusb        # "Bus 001 Device 005: ID 046a:0036 ..."  -> usbmon1
```

## 3. Capture

```bash
./scripts/capture.sh -b 1 -d 10 -o first-capture
# unplug/replug or use the device during the 10s window
```

## 4. Explore

Open the dashboard (`cd web && npm run dev`), go to **Lab 0**, and drag
`captures/first-capture.pcapng` into the Capture Loader. Click rows in the
packet list to decode them.

## Key ideas

- **URB** = USB Request Block: one submitted request + its completion.
- usbmon shows a **SUBMIT** ('S') and **COMPLETE** ('C') event per URB; the
  dashboard pairs them into one logical transfer.
- Every transfer has a **bus, device address, endpoint, direction, and type**.
