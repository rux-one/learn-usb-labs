# Lab 2 — Transfer types & packet structure

**Goal:** recognize the four transfer types and dissect a control transfer.

## The four types

| Type | Use | Guarantees | Example |
|------|-----|-----------|---------|
| **Control** | setup/config | reliable, bidirectional | enumeration on EP0 |
| **Bulk** | bulk data | reliable, no timing | flash drive read/write |
| **Interrupt** | small periodic | bounded latency | keyboard/mouse |
| **Isochronous** | streaming | timed, *no* retransmit | audio, webcam |

## Control transfer stages

1. **SETUP** — the 8-byte request.
2. **DATA** — optional payload (direction from `bmRequestType` bit 7).
3. **STATUS** — zero-length handshake acknowledging completion.

## What to do (dashboard: Lab 2)

- Load the **Flash Drive** sample to see **Bulk** (green) alongside **Control**.
- Load the **Keyboard** sample to see **Interrupt** (amber) reports on a lane.
- Click a control block on the timeline to see its SETUP/DATA/STATUS breakdown.

## Key ideas

- Endpoints are **unidirectional**; a device has separate IN and OUT endpoints.
- `wMaxPacketSize` limits how many bytes fit in one packet; large transfers are
  split into multiple packets.
- Timeline lanes = one endpoint/direction, so you can see per-endpoint activity.
