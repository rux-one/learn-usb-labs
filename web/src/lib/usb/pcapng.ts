// Parse .pcapng and classic .pcap files containing Linux usbmon captures
// entirely in the browser, producing the same normalized Capture model as
// scripts/pcap-to-json.py. Supports LINKTYPE_USB_LINUX (189) and
// LINKTYPE_USB_LINUX_MMAPPED (220).

import { bytesToHex } from "./hex";
import type { Capture, TransferType, USBPacket } from "./types";

const TRANSFER_TYPES: Record<number, TransferType> = {
  0: "ISOCHRONOUS",
  1: "INTERRUPT",
  2: "CONTROL",
  3: "BULK",
};

const LINKTYPE_USB_LINUX = 189;
const LINKTYPE_USB_LINUX_MMAPPED = 220;

interface RawRecord {
  linktype: number;
  tsSec: number;
  tsUsec: number; // micro or nanoseconds depending on file; normalized to seconds later
  tsScale: number; // divisor to convert fractional part to seconds
  data: Uint8Array;
}

// --- usbmon record -> USBPacket -------------------------------------------

function parseUsbmon(rec: RawRecord, index: number, t0: number): USBPacket | null {
  const d = rec.data;
  if (d.length < 40) return null;
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  // Linux usbmon header is little-endian in the file regardless of host.
  const eventType = d[8]; // 'S' 0x53, 'C' 0x43, 'E' 0x45
  const transferType = d[9];
  const epAddr = d[10];
  const deviceAddress = d[11];
  const busId = dv.getUint16(12, true);
  const setupFlag = d[14]; // 0 => setup present
  const status = dv.getInt32(28, true);
  const dataLen = dv.getUint32(36, true);

  const headerLen = rec.linktype === LINKTYPE_USB_LINUX_MMAPPED ? 64 : 48;
  const setup =
    setupFlag === 0
      ? {
          bmRequestType: d[40],
          bRequest: d[41],
          wValue: dv.getUint16(42, true),
          wIndex: dv.getUint16(44, true),
          wLength: dv.getUint16(46, true),
        }
      : null;

  const payload = d.subarray(headerLen, Math.min(d.length, headerLen + dataLen));
  const dataHex = payload.length ? bytesToHex(payload) : "";

  const tsSec = rec.tsSec + rec.tsUsec / rec.tsScale;

  return {
    index,
    timestamp: tsSec - t0,
    busId,
    deviceAddress,
    endpoint: epAddr & 0x0f,
    direction: epAddr & 0x80 ? "IN" : "OUT",
    transferType: TRANSFER_TYPES[transferType] ?? "UNKNOWN",
    urbType: eventType === 0x53 ? "SUBMIT" : eventType === 0x43 ? "COMPLETE" : null,
    setup,
    dataHex,
    status,
  };
}

// --- pcapng container ------------------------------------------------------

function parsePcapng(buf: ArrayBuffer): RawRecord[] {
  const dv = new DataView(buf);
  const records: RawRecord[] = [];
  const interfaceLinktypes: number[] = [];
  let off = 0;
  let le = true;

  while (off + 12 <= buf.byteLength) {
    // Peek block type/length using current endianness (SHB will fix it).
    const blockType = dv.getUint32(off, le);
    if (blockType === 0x0a0d0d0a) {
      // Section Header Block — determine endianness from byte-order magic.
      const magic = dv.getUint32(off + 8, true);
      le = magic === 0x1a2b3c4d;
    }
    const totalLen = dv.getUint32(off + 4, le);
    if (totalLen < 12 || off + totalLen > buf.byteLength) break;

    if (blockType === 0x00000001) {
      // Interface Description Block: linktype(u16), reserved(u16), snaplen(u32)
      const linktype = dv.getUint16(off + 8, le);
      interfaceLinktypes.push(linktype);
    } else if (blockType === 0x00000006) {
      // Enhanced Packet Block
      const ifaceId = dv.getUint32(off + 8, le);
      const tsHigh = dv.getUint32(off + 12, le);
      const tsLow = dv.getUint32(off + 16, le);
      const capLen = dv.getUint32(off + 20, le);
      const dataStart = off + 28;
      const data = new Uint8Array(buf, dataStart, capLen);
      // pcapng timestamp resolution defaults to microseconds (10^6)
      const tsFull = tsHigh * 2 ** 32 + tsLow;
      records.push({
        linktype: interfaceLinktypes[ifaceId] ?? interfaceLinktypes[0] ?? 0,
        tsSec: Math.floor(tsFull / 1e6),
        tsUsec: tsFull % 1e6,
        tsScale: 1e6,
        data,
      });
    } else if (blockType === 0x00000003) {
      // Simple Packet Block: origlen(u32), data
      const capLen = dv.getUint32(off + 8, le);
      const data = new Uint8Array(buf, off + 12, capLen);
      records.push({
        linktype: interfaceLinktypes[0] ?? 0,
        tsSec: 0,
        tsUsec: 0,
        tsScale: 1e6,
        data,
      });
    }
    off += totalLen;
  }
  return records;
}

// --- classic pcap ----------------------------------------------------------

function parsePcap(buf: ArrayBuffer): RawRecord[] {
  const dv = new DataView(buf);
  const magic = dv.getUint32(0, true);
  let le = true;
  let nano = false;
  if (magic === 0xa1b2c3d4) { le = true; }
  else if (magic === 0xd4c3b2a1) { le = false; }
  else if (magic === 0xa1b23c4d) { le = true; nano = true; }
  else if (magic === 0x4d3cb2a1) { le = false; nano = true; }
  else return [];

  const linktype = dv.getUint32(20, le);
  const scale = nano ? 1e9 : 1e6;
  const records: RawRecord[] = [];
  let off = 24;
  while (off + 16 <= buf.byteLength) {
    const tsSec = dv.getUint32(off, le);
    const tsFrac = dv.getUint32(off + 4, le);
    const capLen = dv.getUint32(off + 8, le);
    if (off + 16 + capLen > buf.byteLength) break;
    const data = new Uint8Array(buf, off + 16, capLen);
    records.push({ linktype, tsSec, tsUsec: tsFrac, tsScale: scale, data });
    off += 16 + capLen;
  }
  return records;
}

export function parseCaptureFile(name: string, buf: ArrayBuffer): Capture {
  const dv = new DataView(buf);
  const first = dv.getUint32(0, true);
  let records: RawRecord[];
  if (first === 0x0a0d0d0a) {
    records = parsePcapng(buf);
  } else {
    records = parsePcap(buf);
  }

  const usb = records.filter(
    (r) => r.linktype === LINKTYPE_USB_LINUX || r.linktype === LINKTYPE_USB_LINUX_MMAPPED,
  );

  const t0 = usb.length ? usb[0].tsSec + usb[0].tsUsec / usb[0].tsScale : 0;
  const packets: USBPacket[] = [];
  usb.forEach((r, i) => {
    const p = parseUsbmon(r, i, t0);
    if (p) packets.push(p);
  });

  return {
    meta: { source: name, packetCount: packets.length, generatedBy: "pcapng.ts" },
    packets,
  };
}

// Load a normalized JSON capture (produced by pcap-to-json.py).
export function parseJsonCapture(name: string, text: string): Capture {
  const obj = JSON.parse(text) as Capture;
  if (!obj.meta) obj.meta = { source: name, packetCount: obj.packets.length, generatedBy: "json" };
  return obj;
}
