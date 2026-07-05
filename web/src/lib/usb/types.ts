// Normalized capture model shared by the in-browser pcapng parser and the
// Python pcap-to-json.py converter. Keep the two in sync.

export type Direction = "IN" | "OUT";

export type TransferType =
  | "CONTROL"
  | "BULK"
  | "INTERRUPT"
  | "ISOCHRONOUS"
  | "UNKNOWN";

export type UrbType = "SUBMIT" | "COMPLETE";

export interface SetupPacket {
  bmRequestType: number;
  bRequest: number;
  wValue: number;
  wIndex: number;
  wLength: number;
}

export interface USBPacket {
  index: number;
  timestamp: number; // seconds, relative to first packet
  busId: number | null;
  deviceAddress: number | null;
  endpoint: number | null;
  direction: Direction | null;
  transferType: TransferType;
  urbType: UrbType | null;
  setup: SetupPacket | null;
  dataHex: string; // may be ""
  status: number | null;
}

export interface CaptureMeta {
  source: string;
  packetCount: number;
  generatedBy: string;
}

export interface Capture {
  meta: CaptureMeta;
  packets: USBPacket[];
}
