// Helpers to synthesize realistic normalized captures for the bundled samples,
// so every lab works before you record your own traffic. The byte layouts match
// what a real device returns, so the decoders exercise the same code paths.

import { bytesToHex } from "@/lib/usb/hex";
import type { SetupPacket, TransferType, USBPacket } from "@/lib/usb/types";

export class CaptureBuilder {
  private packets: USBPacket[] = [];
  private t = 0;
  private idx = 0;

  constructor(private bus = 1, private addr = 0) {}

  setAddress(a: number) {
    this.addr = a;
  }

  private advance(ms: number) {
    this.t += ms / 1000;
  }

  // A full control transfer: SETUP submit + COMPLETE carrying response bytes.
  control(setup: SetupPacket, responseBytes: number[] = [], gapMs = 1) {
    const dir = setup.bmRequestType & 0x80 ? "IN" : "OUT";
    this.advance(gapMs);
    this.packets.push({
      index: this.idx++,
      timestamp: this.t,
      busId: this.bus,
      deviceAddress: this.addr,
      endpoint: 0,
      direction: dir,
      transferType: "CONTROL",
      urbType: "SUBMIT",
      setup,
      dataHex: "",
      status: -115,
    });
    this.advance(0.3);
    this.packets.push({
      index: this.idx++,
      timestamp: this.t,
      busId: this.bus,
      deviceAddress: this.addr,
      endpoint: 0,
      direction: dir,
      transferType: "CONTROL",
      urbType: "COMPLETE",
      setup: null,
      dataHex: responseBytes.length ? bytesToHex(Uint8Array.from(responseBytes)) : "",
      status: 0,
    });
  }

  // A data transfer on an endpoint (interrupt/bulk), submit + complete.
  dataIn(endpoint: number, type: TransferType, bytes: number[], gapMs = 8) {
    this.advance(gapMs);
    const common = {
      busId: this.bus,
      deviceAddress: this.addr,
      endpoint,
      direction: "IN" as const,
      transferType: type,
      setup: null,
    };
    this.packets.push({
      ...common,
      index: this.idx++,
      timestamp: this.t,
      urbType: "SUBMIT",
      dataHex: "",
      status: -115,
    });
    this.advance(0.2);
    this.packets.push({
      ...common,
      index: this.idx++,
      timestamp: this.t,
      urbType: "COMPLETE",
      dataHex: bytesToHex(Uint8Array.from(bytes)),
      status: 0,
    });
  }

  dataOut(endpoint: number, type: TransferType, bytes: number[], gapMs = 8) {
    this.advance(gapMs);
    const common = {
      busId: this.bus,
      deviceAddress: this.addr,
      endpoint,
      direction: "OUT" as const,
      transferType: type,
      setup: null,
    };
    this.packets.push({
      ...common,
      index: this.idx++,
      timestamp: this.t,
      urbType: "SUBMIT",
      dataHex: bytesToHex(Uint8Array.from(bytes)),
      status: -115,
    });
    this.advance(0.2);
    this.packets.push({
      ...common,
      index: this.idx++,
      timestamp: this.t,
      urbType: "COMPLETE",
      dataHex: "",
      status: 0,
    });
  }

  build(source: string) {
    return {
      meta: { source, packetCount: this.packets.length, generatedBy: "sample-builder" },
      packets: this.packets,
    };
  }
}

// Standard GET_DESCRIPTOR setup packet.
export function getDescriptor(descType: number, index: number, length: number): SetupPacket {
  return {
    bmRequestType: 0x80,
    bRequest: 6,
    wValue: (descType << 8) | index,
    wIndex: 0,
    wLength: length,
  };
}

// Encode an ASCII string as a USB STRING descriptor (UTF-16LE).
export function stringDescriptor(s: string): number[] {
  const bytes = [0, 0x03];
  for (const ch of s) {
    bytes.push(ch.charCodeAt(0) & 0xff, (ch.charCodeAt(0) >> 8) & 0xff);
  }
  bytes[0] = bytes.length;
  return bytes;
}
