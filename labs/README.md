# Lab walkthroughs

Each lab pairs a **dashboard page** (interactive visuals) with a short markdown
walkthrough here. Recommended order:

1. [Lab 0 — Setup & first capture](lab0-setup.md)
2. [Lab 1 — Enumeration & descriptors](lab1-enumeration.md)
3. [Lab 2 — Transfer types & packets](lab2-transfers.md)
4. [Lab 3 — Decoding HID class traffic](lab3-hid.md)
5. [Lab 4 — RE workflow: diffing](lab4-diffing.md)
6. [Lab 5 — Replay & intro to fuzzing](lab5-replay.md)

Every lab works immediately using the **bundled samples** (see the buttons in
the dashboard's Capture Loader). Swap in your own `.pcapng` when ready.

## The capture → visualize loop

```bash
sudo modprobe usbmon                 # once per boot
./scripts/capture.sh -b 1 -d 10 -o mycap
# interact with the device during the countdown
# then drag captures/mycap.pcapng into the dashboard
```
