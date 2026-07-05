# Lab 5 — Replay & intro to fuzzing

**Goal:** confirm a reversed protocol by speaking it, then mutate it (fuzzing).

> **Safety:** replaying/fuzzing writes to a real device. Use only hardware you
> own and are willing to break. Never fuzz storage holding data you care about.
> The dashboard never sends anything — you run the generated Python yourself.

## Replay (pyusb)

The Lab 5 page turns each captured control request into a `ctrl_transfer()`
call. Example:

```python
import usb.core, usb.util

dev = usb.core.find(idVendor=0x1d83, idProduct=0x0001)
dev.set_configuration()
# (bmRequestType, bRequest, wValue, wIndex, data_or_length)
dev.ctrl_transfer(0x40, 0x01, 0x0001, 0, None)   # e.g. "LED red"
```

Permissions: either run as root or add a udev rule granting your user access to
the device's vendor/product ID.

## Fuzzing seed

```python
import time, usb.core
dev = usb.core.find(idVendor=0x1d83, idProduct=0x0001)
dev.set_configuration()
for wValue in range(0x00, 0x100):
    try:
        dev.ctrl_transfer(0x40, 0x01, wValue, 0, None)
        print(f"{wValue:#04x} ok")
    except usb.core.USBError as e:
        print(f"{wValue:#04x} -> {e}")   # anomalies worth a closer look
    time.sleep(0.05)
```

## Key ideas

- **Replay** proves your reconstruction is correct.
- **Fuzzing** = replay + mutation while monitoring for crashes / odd responses.
- Start narrow (one field, small range), log everything, reset between runs.
- For deeper work: emulate a device with **Facedancer**, or capture a target's
  own traffic and mutate at the boundary.
