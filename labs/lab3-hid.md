# Lab 3 — Decoding HID class traffic

**Goal:** turn raw interrupt-IN bytes into keypresses / mouse movement.

## Capture

```bash
./scripts/capture.sh -b 1 -d 8 -o hid
# type a few keys or move the mouse during the window
```

Or click the **HID Keyboard** sample.

## Boot-protocol layouts

**Keyboard** (8 bytes):

| Byte | Meaning |
|------|---------|
| 0 | modifier bitmap (Ctrl/Shift/Alt/GUI, L+R) |
| 1 | reserved |
| 2–7 | up to 6 pressed key usage IDs |

**Mouse** (3–4 bytes): `[buttons][dX][dY][wheel]` (dX/dY are signed).

## What to do (dashboard: Lab 3)

- Watch key codes appear as you press/release. `0x0b` = `h`, `0x0c` = `i`.
- Toggle the decode profile (auto/keyboard/mouse).

## Key ideas

- Boot protocol has a **fixed layout**; full HID uses a **report descriptor**
  to define arbitrary layouts (a natural next step).
- This "spec defines byte meaning" idea is exactly what you *rebuild yourself*
  for undocumented vendor devices in Lab 4.
