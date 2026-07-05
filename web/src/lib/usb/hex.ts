// Hex / byte helpers used throughout the decoders and UI.

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const len = Math.floor(clean.length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array | number[], sep = ""): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(sep);
}

export function byteToBits(b: number): string {
  return b.toString(2).padStart(8, "0");
}

export function u16le(bytes: Uint8Array, off: number): number {
  return bytes[off] | (bytes[off + 1] << 8);
}

export function hex(n: number, width = 2): string {
  return "0x" + (n >>> 0).toString(16).padStart(width, "0");
}

// Printable ASCII rendering for the hex view's char column.
export function toAscii(b: number): string {
  return b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".";
}
