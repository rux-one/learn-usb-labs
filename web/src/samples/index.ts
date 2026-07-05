// Bundled sample captures, synthesized with realistic byte layouts so every lab
// is usable before you record your own traffic. Replace/augment by dropping your
// own .pcapng or .json into the Capture Loader.

import type { Capture } from "@/lib/usb/types";
import { CaptureBuilder, getDescriptor, stringDescriptor } from "./builder";

// ---- HID keyboard: enumeration + typing "hi" ------------------------------

function keyboardSample(): Capture {
  const b = new CaptureBuilder(1, 0);

  const deviceDesc = [
    0x12, 0x01, 0x00, 0x02, 0x00, 0x00, 0x00, 0x08,
    0x6a, 0x04, 0x36, 0x00, 0x00, 0x01, 0x01, 0x02, 0x00, 0x01,
  ];
  const configBlob = [
    // configuration
    0x09, 0x02, 0x22, 0x00, 0x01, 0x01, 0x00, 0xa0, 0x32,
    // interface (HID, boot, keyboard)
    0x09, 0x04, 0x00, 0x00, 0x01, 0x03, 0x01, 0x01, 0x00,
    // HID descriptor
    0x09, 0x21, 0x11, 0x01, 0x00, 0x01, 0x22, 0x3f, 0x00,
    // endpoint 1 IN, interrupt
    0x07, 0x05, 0x81, 0x03, 0x08, 0x00, 0x0a,
  ];

  // Enumeration handshake
  b.control(getDescriptor(1, 0, 8), deviceDesc.slice(0, 8)); // first 8 bytes
  b.control({ bmRequestType: 0x00, bRequest: 5, wValue: 7, wIndex: 0, wLength: 0 }); // SET_ADDRESS 7
  b.setAddress(7);
  b.control(getDescriptor(1, 0, 18), deviceDesc); // full device descriptor
  b.control(getDescriptor(2, 0, 9), configBlob.slice(0, 9)); // config header
  b.control(getDescriptor(2, 0, 34), configBlob); // full config
  b.control(getDescriptor(3, 0, 4), [0x04, 0x03, 0x09, 0x04]); // langid
  b.control(getDescriptor(3, 2, 26), stringDescriptor("USB Keyboard")); // product
  b.control({ bmRequestType: 0x00, bRequest: 9, wValue: 1, wIndex: 0, wLength: 0 }); // SET_CONFIGURATION
  b.control({ bmRequestType: 0x21, bRequest: 0x0a, wValue: 0, wIndex: 0, wLength: 0 }); // SET_IDLE (class)

  // Typing "hi": press h, release, press i, release (boot keyboard reports)
  b.dataIn(1, "INTERRUPT", [0x00, 0x00, 0x0b, 0, 0, 0, 0, 0]); // h
  b.dataIn(1, "INTERRUPT", [0x00, 0x00, 0x00, 0, 0, 0, 0, 0]); // release
  b.dataIn(1, "INTERRUPT", [0x00, 0x00, 0x0c, 0, 0, 0, 0, 0]); // i
  b.dataIn(1, "INTERRUPT", [0x00, 0x00, 0x00, 0, 0, 0, 0, 0]); // release

  return b.build("sample: HID keyboard");
}

// ---- USB Mass Storage: enumeration + SCSI INQUIRY over BOT ----------------

function flashDriveSample(): Capture {
  const b = new CaptureBuilder(1, 0);

  const deviceDesc = [
    0x12, 0x01, 0x00, 0x02, 0x00, 0x00, 0x00, 0x40,
    0x81, 0x07, 0x58, 0x55, 0x00, 0x11, 0x01, 0x02, 0x03, 0x01,
  ];
  const configBlob = [
    0x09, 0x02, 0x20, 0x00, 0x01, 0x01, 0x00, 0x80, 0x32,
    0x09, 0x04, 0x00, 0x00, 0x02, 0x08, 0x06, 0x50, 0x00, // MSC / SCSI / BOT
    0x07, 0x05, 0x81, 0x02, 0x00, 0x02, 0x00, // EP1 IN bulk 512
    0x07, 0x05, 0x02, 0x02, 0x00, 0x02, 0x00, // EP2 OUT bulk 512
  ];

  b.control(getDescriptor(1, 0, 8), deviceDesc.slice(0, 8));
  b.control({ bmRequestType: 0x00, bRequest: 5, wValue: 9, wIndex: 0, wLength: 0 });
  b.setAddress(9);
  b.control(getDescriptor(1, 0, 18), deviceDesc);
  b.control(getDescriptor(2, 0, 32), configBlob);
  b.control({ bmRequestType: 0x00, bRequest: 9, wValue: 1, wIndex: 0, wLength: 0 });
  b.control({ bmRequestType: 0xa1, bRequest: 0xfe, wValue: 0, wIndex: 0, wLength: 1 }, [0x00]); // GET_MAX_LUN

  // SCSI INQUIRY over Bulk-Only Transport
  const cbw = [
    0x55, 0x53, 0x42, 0x43, // "USBC"
    0x01, 0x00, 0x00, 0x00, // tag
    0x24, 0x00, 0x00, 0x00, // dCBWDataTransferLength = 36
    0x80, 0x00, 0x06,       // flags IN, LUN 0, cbLength 6
    0x12, 0x00, 0x00, 0x00, 0x24, 0x00, // INQUIRY CDB
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // padding to 31 bytes
  ];
  const inquiryData = [
    0x00, 0x80, 0x02, 0x02, 0x1f, 0x00, 0x00, 0x00,
    // "SanDisk " "Cruzer          " vendor/product ids
    0x53, 0x61, 0x6e, 0x44, 0x69, 0x73, 0x6b, 0x20,
    0x43, 0x72, 0x75, 0x7a, 0x65, 0x72, 0x20, 0x20,
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
    0x31, 0x2e, 0x30, 0x30,
  ];
  const csw = [0x55, 0x53, 0x42, 0x53, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

  b.dataOut(2, "BULK", cbw);     // CBW out
  b.dataIn(1, "BULK", inquiryData); // data in
  b.dataIn(1, "BULK", csw);      // CSW in

  return b.build("sample: USB flash drive (Mass Storage)");
}

// ---- Vendor device: two near-identical captures for the RE diff lab --------

function vendorLedSample(color: "red" | "blue"): Capture {
  const b = new CaptureBuilder(1, 0);
  const deviceDesc = [
    0x12, 0x01, 0x00, 0x02, 0xff, 0x00, 0x00, 0x40,
    0x83, 0x1d, 0x01, 0x00, 0x00, 0x01, 0x01, 0x02, 0x00, 0x01,
  ];
  b.control(getDescriptor(1, 0, 18), deviceDesc);
  b.control({ bmRequestType: 0x00, bRequest: 5, wValue: 12, wIndex: 0, wLength: 0 });
  b.setAddress(12);
  b.control({ bmRequestType: 0x00, bRequest: 9, wValue: 1, wIndex: 0, wLength: 0 });

  // Vendor command: set LED color. Only wValue + payload differ between captures.
  const colorCode = color === "red" ? 0x0001 : 0x0002;
  const brightness = color === "red" ? 0xff : 0x80;
  b.control({ bmRequestType: 0x40, bRequest: 0x01, wValue: colorCode, wIndex: 0, wLength: 2 });
  b.control({ bmRequestType: 0x40, bRequest: 0x02, wValue: 0x0000, wIndex: 0, wLength: 1 });
  // heartbeat interrupt reports
  b.dataIn(3, "INTERRUPT", [0x01, brightness]);
  b.dataIn(3, "INTERRUPT", [0x01, brightness]);

  return b.build(`sample: vendor LED device (${color})`);
}

export interface SampleEntry {
  id: string;
  label: string;
  description: string;
  capture: Capture;
}

export const SAMPLES: SampleEntry[] = [
  {
    id: "keyboard",
    label: "HID Keyboard",
    description: "Enumeration + typing 'hi' on a boot-protocol keyboard.",
    capture: keyboardSample(),
  },
  {
    id: "flashdrive",
    label: "USB Flash Drive",
    description: "Mass Storage enumeration + SCSI INQUIRY over Bulk-Only Transport.",
    capture: flashDriveSample(),
  },
  {
    id: "vendor-red",
    label: "Vendor LED (red)",
    description: "Vendor-specific control commands — capture A for the diff lab.",
    capture: vendorLedSample("red"),
  },
  {
    id: "vendor-blue",
    label: "Vendor LED (blue)",
    description: "Same device, different action — capture B for the diff lab.",
    capture: vendorLedSample("blue"),
  },
];

export function getSample(id: string): Capture | undefined {
  return SAMPLES.find((s) => s.id === id)?.capture;
}
