// Global capture state: the loaded capture, derived transfers/descriptors, and
// the currently selected transfer. Shared across all lab pages.

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Capture } from "@/lib/usb/types";
import {
  collectDescriptors,
  enumerationSequence,
  groupTransfers,
  summarizeDevices,
} from "@/lib/usb/transfers";
import { getSample } from "@/samples";

interface CaptureState {
  capture: Capture | null;
  setCapture: (c: Capture) => void;
  loadSample: (id: string) => void;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  transfers: ReturnType<typeof groupTransfers>;
  descriptors: ReturnType<typeof collectDescriptors>;
  enumeration: ReturnType<typeof enumerationSequence>;
  devices: ReturnType<typeof summarizeDevices>;
}

const Ctx = createContext<CaptureState | null>(null);

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [capture, setCaptureState] = useState<Capture | null>(
    () => getSample("keyboard") ?? null,
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const setCapture = (c: Capture) => {
    setCaptureState(c);
    setSelectedId(null);
  };

  const loadSample = (id: string) => {
    const s = getSample(id);
    if (s) setCapture(s);
  };

  const transfers = useMemo(
    () => (capture ? groupTransfers(capture) : []),
    [capture],
  );
  const descriptors = useMemo(() => collectDescriptors(transfers), [transfers]);
  const enumeration = useMemo(() => enumerationSequence(transfers), [transfers]);
  const devices = useMemo(() => summarizeDevices(transfers), [transfers]);

  const value: CaptureState = {
    capture,
    setCapture,
    loadSample,
    selectedId,
    setSelectedId,
    transfers,
    descriptors,
    enumeration,
    devices,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCapture(): CaptureState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCapture must be used within CaptureProvider");
  return v;
}
