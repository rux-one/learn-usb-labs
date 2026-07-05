// Parse a concatenated USB descriptor blob (as returned by GET_DESCRIPTOR) into
// a tree of decoded descriptors. Handles DEVICE and CONFIGURATION responses
// (config responses contain interface/endpoint/class descriptors inline).

import { CLASS_CODES, DESCRIPTOR_TYPES, ENDPOINT_TRANSFER_TYPE } from "./constants";
import { hex, u16le } from "./hex";

export interface DescField {
  name: string;
  offset: number; // offset within the whole blob
  length: number;
  raw: number | string;
  value: string;
}

export interface DescNode {
  type: number;
  typeName: string;
  offset: number;
  length: number;
  fields: DescField[];
  children: DescNode[];
}

function decodeDevice(b: Uint8Array, base: number): DescField[] {
  const f = (name: string, off: number, len: number, value: string, raw: number): DescField => ({
    name,
    offset: base + off,
    length: len,
    raw,
    value,
  });
  const bcdUSB = u16le(b, 2);
  const cls = b[4];
  return [
    f("bcdUSB", 2, 2, `USB ${(bcdUSB >> 8).toString(16)}.${((bcdUSB & 0xff) >> 4).toString(16)}`, bcdUSB),
    f("bDeviceClass", 4, 1, CLASS_CODES[cls] ?? hex(cls), cls),
    f("bDeviceSubClass", 5, 1, hex(b[5]), b[5]),
    f("bDeviceProtocol", 6, 1, hex(b[6]), b[6]),
    f("bMaxPacketSize0", 7, 1, `${b[7]} bytes`, b[7]),
    f("idVendor", 8, 2, hex(u16le(b, 8), 4), u16le(b, 8)),
    f("idProduct", 10, 2, hex(u16le(b, 10), 4), u16le(b, 10)),
    f("bcdDevice", 12, 2, hex(u16le(b, 12), 4), u16le(b, 12)),
    f("iManufacturer", 14, 1, `string index ${b[14]}`, b[14]),
    f("iProduct", 15, 1, `string index ${b[15]}`, b[15]),
    f("iSerialNumber", 16, 1, `string index ${b[16]}`, b[16]),
    f("bNumConfigurations", 17, 1, `${b[17]}`, b[17]),
  ];
}

function decodeConfig(b: Uint8Array, base: number): DescField[] {
  const total = u16le(b, 2);
  const attr = b[7];
  return [
    { name: "wTotalLength", offset: base + 2, length: 2, raw: total, value: `${total} bytes` },
    { name: "bNumInterfaces", offset: base + 4, length: 1, raw: b[4], value: `${b[4]}` },
    { name: "bConfigurationValue", offset: base + 5, length: 1, raw: b[5], value: `${b[5]}` },
    { name: "iConfiguration", offset: base + 6, length: 1, raw: b[6], value: `string index ${b[6]}` },
    {
      name: "bmAttributes",
      offset: base + 7,
      length: 1,
      raw: attr,
      value: `${attr & 0x40 ? "Self-powered" : "Bus-powered"}${attr & 0x20 ? ", Remote-wakeup" : ""}`,
    },
    { name: "bMaxPower", offset: base + 8, length: 1, raw: b[8], value: `${b[8] * 2} mA` },
  ];
}

function decodeInterface(b: Uint8Array, base: number): DescField[] {
  const cls = b[5];
  return [
    { name: "bInterfaceNumber", offset: base + 2, length: 1, raw: b[2], value: `${b[2]}` },
    { name: "bAlternateSetting", offset: base + 3, length: 1, raw: b[3], value: `${b[3]}` },
    { name: "bNumEndpoints", offset: base + 4, length: 1, raw: b[4], value: `${b[4]}` },
    { name: "bInterfaceClass", offset: base + 5, length: 1, raw: cls, value: CLASS_CODES[cls] ?? hex(cls) },
    { name: "bInterfaceSubClass", offset: base + 6, length: 1, raw: b[6], value: hex(b[6]) },
    { name: "bInterfaceProtocol", offset: base + 7, length: 1, raw: b[7], value: hex(b[7]) },
    { name: "iInterface", offset: base + 8, length: 1, raw: b[8], value: `string index ${b[8]}` },
  ];
}

function decodeEndpoint(b: Uint8Array, base: number): DescField[] {
  const addr = b[2];
  const attr = b[3];
  const mps = u16le(b, 4);
  const dir = addr & 0x80 ? "IN" : "OUT";
  const ttype = ENDPOINT_TRANSFER_TYPE[attr & 0x03];
  return [
    {
      name: "bEndpointAddress",
      offset: base + 2,
      length: 1,
      raw: addr,
      value: `EP ${addr & 0x0f} ${dir} (${hex(addr)})`,
    },
    { name: "bmAttributes", offset: base + 3, length: 1, raw: attr, value: `${ttype} transfer` },
    { name: "wMaxPacketSize", offset: base + 4, length: 2, raw: mps, value: `${mps & 0x7ff} bytes` },
    { name: "bInterval", offset: base + 6, length: 1, raw: b[6], value: `${b[6]}` },
  ];
}

function decodeGeneric(b: Uint8Array, base: number, len: number): DescField[] {
  const bytes = Array.from(b.slice(2, len))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join(" ");
  return [{ name: "data", offset: base + 2, length: len - 2, raw: bytes, value: bytes }];
}

// Parse one blob into a flat list of descriptors, then nest them (config >
// interface > endpoint). Unknown/class descriptors attach to the current parent.
export function parseDescriptorBlob(bytes: Uint8Array): DescNode[] {
  const flat: DescNode[] = [];
  let i = 0;
  while (i + 1 < bytes.length) {
    const len = bytes[i];
    if (len < 2 || i + len > bytes.length) break; // malformed / truncated
    const type = bytes[i + 1];
    const view = bytes.slice(i, i + len);
    let fields: DescField[] = [];
    switch (type) {
      case 1: fields = decodeDevice(view, i); break;
      case 2:
      case 7: fields = decodeConfig(view, i); break;
      case 4: fields = decodeInterface(view, i); break;
      case 5: fields = decodeEndpoint(view, i); break;
      default: fields = decodeGeneric(view, i, len); break;
    }
    flat.push({
      type,
      typeName: DESCRIPTOR_TYPES[type] ?? `Unknown(${hex(type)})`,
      offset: i,
      length: len,
      fields,
      children: [],
    });
    i += len;
  }
  return nest(flat);
}

function nest(flat: DescNode[]): DescNode[] {
  const roots: DescNode[] = [];
  let currentConfig: DescNode | null = null;
  let currentIface: DescNode | null = null;
  for (const node of flat) {
    if (node.type === 2 || node.type === 7) {
      currentConfig = node;
      currentIface = null;
      roots.push(node);
    } else if (node.type === 4) {
      currentIface = node;
      (currentConfig ?? { children: roots }).children.push(node);
    } else if (currentIface) {
      currentIface.children.push(node);
    } else if (currentConfig) {
      currentConfig.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
