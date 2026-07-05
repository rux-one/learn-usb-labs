// USB spec constants: standard request codes, descriptor types, class codes.

export const STANDARD_REQUESTS: Record<number, string> = {
  0: "GET_STATUS",
  1: "CLEAR_FEATURE",
  3: "SET_FEATURE",
  5: "SET_ADDRESS",
  6: "GET_DESCRIPTOR",
  7: "SET_DESCRIPTOR",
  8: "GET_CONFIGURATION",
  9: "SET_CONFIGURATION",
  10: "GET_INTERFACE",
  11: "SET_INTERFACE",
  12: "SYNCH_FRAME",
};

export const DESCRIPTOR_TYPES: Record<number, string> = {
  1: "DEVICE",
  2: "CONFIGURATION",
  3: "STRING",
  4: "INTERFACE",
  5: "ENDPOINT",
  6: "DEVICE_QUALIFIER",
  7: "OTHER_SPEED_CONFIG",
  8: "INTERFACE_POWER",
  9: "OTG",
  10: "DEBUG",
  11: "INTERFACE_ASSOCIATION",
  33: "HID",
  34: "HID_REPORT",
  36: "CS_INTERFACE",
  37: "CS_ENDPOINT",
};

export const CLASS_CODES: Record<number, string> = {
  0x00: "Per-interface",
  0x01: "Audio",
  0x02: "CDC Communications",
  0x03: "HID",
  0x05: "Physical",
  0x06: "Image (PTP)",
  0x07: "Printer",
  0x08: "Mass Storage",
  0x09: "Hub",
  0x0a: "CDC Data",
  0x0b: "Smart Card",
  0x0d: "Content Security",
  0x0e: "Video",
  0x0f: "Personal Healthcare",
  0xdc: "Diagnostic",
  0xe0: "Wireless Controller",
  0xef: "Miscellaneous",
  0xfe: "Application Specific",
  0xff: "Vendor Specific",
};

// bmRequestType bitfields
export const REQUEST_DIRECTION = ["Host-to-Device (OUT)", "Device-to-Host (IN)"];
export const REQUEST_TYPE = ["Standard", "Class", "Vendor", "Reserved"];
export const REQUEST_RECIPIENT = ["Device", "Interface", "Endpoint", "Other"];

export const ENDPOINT_TRANSFER_TYPE = ["Control", "Isochronous", "Bulk", "Interrupt"];

// Color per transfer type — keep in sync with tailwind.config.js
export const TRANSFER_COLORS: Record<string, string> = {
  CONTROL: "#6366f1",
  BULK: "#10b981",
  INTERRUPT: "#f59e0b",
  ISOCHRONOUS: "#ec4899",
  UNKNOWN: "#64748b",
};
