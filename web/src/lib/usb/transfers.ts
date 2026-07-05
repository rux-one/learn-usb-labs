// Group raw usbmon packets into logical USB transfers (pairing SUBMIT with its
// COMPLETE), identify control-transfer stages, and extract descriptors and the
// enumeration sequence used by Labs 1 and 2.

import { decodeSetup } from "./setup";
import type { DecodedSetup } from "./setup";
import { hexToBytes } from "./hex";
import { parseDescriptorBlob } from "./descriptors";
import type { DescNode } from "./descriptors";
import type { Capture, TransferType, USBPacket } from "./types";

export interface Transfer {
  id: number;
  busId: number | null;
  deviceAddress: number | null;
  endpoint: number | null;
  direction: USBPacket["direction"];
  transferType: TransferType;
  setup: DecodedSetup | null;
  submit: USBPacket;
  complete: USBPacket | null;
  dataHex: string; // combined payload (setup response or bulk/int data)
  startTime: number;
  endTime: number;
  status: number | null;
  byteCount: number;
}

function key(p: USBPacket): string {
  return `${p.busId}-${p.deviceAddress}-${p.endpoint}-${p.transferType}`;
}

export function groupTransfers(cap: Capture): Transfer[] {
  const pending = new Map<string, USBPacket[]>();
  const transfers: Transfer[] = [];
  let id = 0;

  for (const p of cap.packets) {
    if (p.urbType === "SUBMIT") {
      const k = key(p);
      if (!pending.has(k)) pending.set(k, []);
      pending.get(k)!.push(p);
    } else if (p.urbType === "COMPLETE") {
      const k = key(p);
      const queue = pending.get(k);
      const submit = queue && queue.length ? queue.shift()! : null;
      transfers.push(makeTransfer(id++, submit ?? p, p));
    } else {
      // no urb type info — treat each packet as its own transfer
      transfers.push(makeTransfer(id++, p, null));
    }
  }
  // leftover submits with no completion
  for (const queue of pending.values()) {
    for (const s of queue) transfers.push(makeTransfer(id++, s, null));
  }
  transfers.sort((a, b) => a.startTime - b.startTime);
  return transfers;
}

function makeTransfer(id: number, submit: USBPacket, complete: USBPacket | null): Transfer {
  const dataHex = (submit.dataHex || "") + (complete?.dataHex || "");
  return {
    id,
    busId: submit.busId,
    deviceAddress: submit.deviceAddress,
    endpoint: submit.endpoint,
    direction: submit.direction,
    transferType: submit.transferType,
    setup: submit.setup ? decodeSetup(submit.setup) : null,
    submit,
    complete,
    dataHex,
    startTime: submit.timestamp,
    endTime: complete?.timestamp ?? submit.timestamp,
    status: complete?.status ?? submit.status,
    byteCount: dataHex.length / 2,
  };
}

// Control-transfer stages for the timeline stage breakdown.
export interface ControlStage {
  stage: "SETUP" | "DATA" | "STATUS";
  description: string;
}

export function controlStages(t: Transfer): ControlStage[] {
  if (t.transferType !== "CONTROL" || !t.setup) return [];
  const stages: ControlStage[] = [
    { stage: "SETUP", description: t.setup.summary },
  ];
  if (t.byteCount > 0) {
    stages.push({
      stage: "DATA",
      description: `${t.byteCount} bytes ${t.setup.fields[0].raw & 0x80 ? "IN" : "OUT"}`,
    });
  }
  stages.push({ stage: "STATUS", description: "handshake" });
  return stages;
}

// A decoded descriptor as returned by some GET_DESCRIPTOR transfer.
export interface CapturedDescriptor {
  transferId: number;
  deviceAddress: number | null;
  descriptorType: number;
  bytes: Uint8Array;
  tree: DescNode[];
}

export function collectDescriptors(transfers: Transfer[]): CapturedDescriptor[] {
  const out: CapturedDescriptor[] = [];
  for (const t of transfers) {
    if (!t.setup) continue;
    const bReq = t.setup.fields[1].raw;
    if (bReq !== 6) continue; // GET_DESCRIPTOR
    if (t.byteCount === 0) continue;
    const descType = (Number(t.setup.fields[2].raw) >> 8) & 0xff;
    const bytes = hexToBytes(t.dataHex);
    out.push({
      transferId: t.id,
      deviceAddress: t.deviceAddress,
      descriptorType: descType,
      bytes,
      tree: parseDescriptorBlob(bytes),
    });
  }
  return out;
}

// The enumeration handshake = the standard control requests to a device early
// in its life. We surface them as an ordered list for the sequence diagram.
export interface EnumStep {
  transferId: number;
  time: number;
  deviceAddress: number | null;
  request: string;
  detail: string;
  direction: "IN" | "OUT";
}

export function enumerationSequence(transfers: Transfer[]): EnumStep[] {
  return transfers
    .filter((t) => t.setup && t.setup.requestType === "Standard")
    .map((t) => ({
      transferId: t.id,
      time: t.startTime,
      deviceAddress: t.deviceAddress,
      request: t.setup!.fields[1].value,
      detail: t.setup!.fields[2].value,
      direction: (Number(t.setup!.fields[0].raw) & 0x80 ? "IN" : "OUT") as "IN" | "OUT",
    }));
}

// Device summary for the sidebar / overview.
export interface DeviceInfo {
  busId: number | null;
  address: number | null;
  transferCount: number;
  endpoints: Set<number>;
  transferTypes: Set<TransferType>;
}

export function summarizeDevices(transfers: Transfer[]): DeviceInfo[] {
  const map = new Map<string, DeviceInfo>();
  for (const t of transfers) {
    const k = `${t.busId}-${t.deviceAddress}`;
    if (!map.has(k)) {
      map.set(k, {
        busId: t.busId,
        address: t.deviceAddress,
        transferCount: 0,
        endpoints: new Set(),
        transferTypes: new Set(),
      });
    }
    const d = map.get(k)!;
    d.transferCount++;
    if (t.endpoint != null) d.endpoints.add(t.endpoint);
    d.transferTypes.add(t.transferType);
  }
  return Array.from(map.values()).sort(
    (a, b) => (a.address ?? 0) - (b.address ?? 0),
  );
}
