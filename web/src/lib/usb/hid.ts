// Minimal HID boot-protocol decoders (keyboard + mouse) for Lab 3. These map
// raw interrupt-IN report bytes to meaning. Full HID uses a report descriptor;
// boot protocol has a fixed layout that covers most keyboards/mice.

import { byteToBits } from "./hex";

// USB HID Usage IDs (keyboard/keypad page) -> label, abbreviated common set.
const KEYCODES: Record<number, string> = {
  0x04: "a", 0x05: "b", 0x06: "c", 0x07: "d", 0x08: "e", 0x09: "f",
  0x0a: "g", 0x0b: "h", 0x0c: "i", 0x0d: "j", 0x0e: "k", 0x0f: "l",
  0x10: "m", 0x11: "n", 0x12: "o", 0x13: "p", 0x14: "q", 0x15: "r",
  0x16: "s", 0x17: "t", 0x18: "u", 0x19: "v", 0x1a: "w", 0x1b: "x",
  0x1c: "y", 0x1d: "z",
  0x1e: "1", 0x1f: "2", 0x20: "3", 0x21: "4", 0x22: "5", 0x23: "6",
  0x24: "7", 0x25: "8", 0x26: "9", 0x27: "0",
  0x28: "Enter", 0x29: "Esc", 0x2a: "Backspace", 0x2b: "Tab", 0x2c: "Space",
  0x2d: "-", 0x2e: "=", 0x2f: "[", 0x30: "]", 0x31: "\\",
  0x33: ";", 0x34: "'", 0x36: ",", 0x37: ".", 0x38: "/",
  0x39: "CapsLock",
  0x4f: "Right", 0x50: "Left", 0x51: "Down", 0x52: "Up",
};

const MODIFIERS = [
  "LeftCtrl", "LeftShift", "LeftAlt", "LeftGUI",
  "RightCtrl", "RightShift", "RightAlt", "RightGUI",
];

export interface HidField {
  name: string;
  offset: number;
  value: string;
}

export function decodeKeyboardReport(b: Uint8Array): HidField[] {
  if (b.length < 3) return [];
  const mods = b[0];
  const active = MODIFIERS.filter((_, i) => mods & (1 << i));
  const keys: string[] = [];
  for (let i = 2; i < Math.min(b.length, 8); i++) {
    if (b[i] !== 0) keys.push(KEYCODES[b[i]] ?? `0x${b[i].toString(16)}`);
  }
  return [
    { name: "modifiers", offset: 0, value: active.length ? active.join("+") : `none (${byteToBits(mods)})` },
    { name: "reserved", offset: 1, value: `0x${b[1].toString(16).padStart(2, "0")}` },
    { name: "keys", offset: 2, value: keys.length ? keys.join(", ") : "(none pressed)" },
  ];
}

function signed8(n: number): number {
  return n > 127 ? n - 256 : n;
}

export function decodeMouseReport(b: Uint8Array): HidField[] {
  if (b.length < 3) return [];
  const buttons = b[0];
  const names = ["Left", "Right", "Middle"];
  const pressed = names.filter((_, i) => buttons & (1 << i));
  const fields: HidField[] = [
    { name: "buttons", offset: 0, value: pressed.length ? pressed.join("+") : "none" },
    { name: "dX", offset: 1, value: `${signed8(b[1])}` },
    { name: "dY", offset: 2, value: `${signed8(b[2])}` },
  ];
  if (b.length > 3) fields.push({ name: "wheel", offset: 3, value: `${signed8(b[3])}` });
  return fields;
}

export type HidProfile = "keyboard" | "mouse";

export function decodeHidReport(b: Uint8Array, profile: HidProfile): HidField[] {
  return profile === "keyboard" ? decodeKeyboardReport(b) : decodeMouseReport(b);
}

// Heuristic: 8-byte reports with a zero second byte look like keyboards.
export function guessHidProfile(b: Uint8Array): HidProfile {
  if (b.length >= 8 && b[1] === 0) return "keyboard";
  return "mouse";
}
