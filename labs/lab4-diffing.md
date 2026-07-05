# Lab 4 — RE workflow: diffing & reconstructing a protocol

**Goal:** reverse an undocumented vendor protocol by comparing captures.

## The core loop

1. **Baseline** — capture the device doing nothing.
2. **One action** — perform exactly one action; capture it.
3. **Diff** — the transfers that differ from baseline encode that action.
4. **Vary one field** — repeat with a small change; diff again to learn which
   byte maps to which parameter.
5. **Tabulate** — build a command table: constant bytes = structure, changing
   bytes = parameters.

## What to do (dashboard: Lab 4)

- Diff the **Vendor LED (red)** vs **(blue)** samples.
- Note the highlighted control request whose `wValue` changes with color
  (`0x0001` red vs `0x0002` blue) and the interrupt heartbeat payload.

## Practical capture tips

```bash
# capture two actions back-to-back into separate files
./scripts/capture.sh -b 1 -d 5 -o action-A
./scripts/capture.sh -b 1 -d 5 -o action-B
./scripts/pcap-to-json.py captures/action-A.pcapng captures/action-A.json
./scripts/pcap-to-json.py captures/action-B.pcapng captures/action-B.json
# load both in the diff view (drop A, then select current + a sample, or use JSON)
```

## Key ideas

- Vendor requests use `bmRequestType` type field = **Vendor** (`0x40`/`0xC0`).
- Isolate, then **change one variable at a time** — the discipline that makes
  reversing tractable.
