// Decode a USB SETUP packet (the 8-byte control-transfer request) into
// human-readable fields, each annotated with its byte offset for the hex view.

import {
  DESCRIPTOR_TYPES,
  REQUEST_DIRECTION,
  REQUEST_RECIPIENT,
  REQUEST_TYPE,
  STANDARD_REQUESTS,
} from "./constants";
import { hex } from "./hex";
import type { SetupPacket } from "./types";

export interface DecodedField {
  name: string;
  offset: number; // byte offset within the 8-byte setup packet
  length: number;
  raw: number;
  value: string; // human-readable interpretation
}

export interface DecodedSetup {
  summary: string;
  requestType: "Standard" | "Class" | "Vendor" | "Reserved";
  fields: DecodedField[];
}

export function decodeBmRequestType(bm: number) {
  const dir = (bm >> 7) & 0x01;
  const type = (bm >> 5) & 0x03;
  const recipient = bm & 0x1f;
  return {
    direction: REQUEST_DIRECTION[dir],
    type: REQUEST_TYPE[type] as DecodedSetup["requestType"],
    recipient: REQUEST_RECIPIENT[recipient] ?? `Reserved(${recipient})`,
    isIn: dir === 1,
  };
}

function describeRequest(bm: number, bRequest: number): string {
  const { type } = decodeBmRequestType(bm);
  if (type === "Standard") {
    return STANDARD_REQUESTS[bRequest] ?? `Unknown(${hex(bRequest)})`;
  }
  return `${type} request ${hex(bRequest)}`;
}

// For a standard GET_DESCRIPTOR, wValue high byte = descriptor type, low = index
function describeWValue(bm: number, bRequest: number, wValue: number): string {
  const { type } = decodeBmRequestType(bm);
  if (type === "Standard" && bRequest === 6) {
    const descType = (wValue >> 8) & 0xff;
    const idx = wValue & 0xff;
    const name = DESCRIPTOR_TYPES[descType] ?? `Type ${descType}`;
    return `${name} descriptor, index ${idx}`;
  }
  if (type === "Standard" && bRequest === 5) {
    return `address ${wValue}`;
  }
  if (type === "Standard" && bRequest === 9) {
    return `configuration ${wValue}`;
  }
  return hex(wValue, 4);
}

export function decodeSetup(s: SetupPacket): DecodedSetup {
  const bm = decodeBmRequestType(s.bmRequestType);
  const reqName = describeRequest(s.bmRequestType, s.bRequest);

  const fields: DecodedField[] = [
    {
      name: "bmRequestType",
      offset: 0,
      length: 1,
      raw: s.bmRequestType,
      value: `${bm.direction} | ${bm.type} | ${bm.recipient}`,
    },
    {
      name: "bRequest",
      offset: 1,
      length: 1,
      raw: s.bRequest,
      value: reqName,
    },
    {
      name: "wValue",
      offset: 2,
      length: 2,
      raw: s.wValue,
      value: describeWValue(s.bmRequestType, s.bRequest, s.wValue),
    },
    {
      name: "wIndex",
      offset: 4,
      length: 2,
      raw: s.wIndex,
      value: hex(s.wIndex, 4),
    },
    {
      name: "wLength",
      offset: 6,
      length: 2,
      raw: s.wLength,
      value: `${s.wLength} bytes`,
    },
  ];

  const arrow = bm.isIn ? "←" : "→";
  return {
    summary: `${reqName} ${arrow} ${describeWValue(
      s.bmRequestType,
      s.bRequest,
      s.wValue,
    )}`,
    requestType: bm.type,
    fields,
  };
}
