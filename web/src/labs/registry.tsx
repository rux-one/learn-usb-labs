// Registry of lab pages — drives the sidebar nav and the router.

import type { ComponentType } from "react";
import { Lab0 } from "./Lab0";
import { Lab1 } from "./Lab1";
import { Lab2 } from "./Lab2";
import { Lab3 } from "./Lab3";
import { Lab4 } from "./Lab4";
import { Lab5 } from "./Lab5";

export interface LabDef {
  num: string;
  path: string;
  title: string;
  component: ComponentType;
}

export const LABS: LabDef[] = [
  { num: "0", path: "/lab0", title: "Setup & first capture", component: Lab0 },
  { num: "1", path: "/lab1", title: "Enumeration & descriptors", component: Lab1 },
  { num: "2", path: "/lab2", title: "Transfer types & packets", component: Lab2 },
  { num: "3", path: "/lab3", title: "Decoding HID class", component: Lab3 },
  { num: "4", path: "/lab4", title: "RE workflow: diffing", component: Lab4 },
  { num: "5", path: "/lab5", title: "Replay & fuzzing", component: Lab5 },
];
