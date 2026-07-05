// Sequence diagram of the enumeration handshake: Host <-> Device standard
// control requests in time order. Clicking a step selects its transfer.

import { useCapture } from "@/state/CaptureContext";
import { EmptyState } from "./ui";

export function EnumerationSequence() {
  const { enumeration, setSelectedId, selectedId } = useCapture();

  if (enumeration.length === 0) {
    return (
      <EmptyState>
        No standard control requests found. Load a capture that includes device
        enumeration (try the Keyboard sample).
      </EmptyState>
    );
  }

  return (
    <div className="relative">
      {/* lifelines */}
      <div className="mb-2 flex justify-between px-8 text-xs font-semibold text-slate-300">
        <span>HOST</span>
        <span>DEVICE</span>
      </div>
      <div className="relative">
        <div className="absolute left-8 top-0 h-full w-px bg-slate-700" />
        <div className="absolute right-8 top-0 h-full w-px bg-slate-700" />

        <div className="space-y-1 py-2">
          {enumeration.map((step) => {
            const isIn = step.direction === "IN";
            const active = selectedId === step.transferId;
            return (
              <div
                key={step.transferId}
                onClick={() => setSelectedId(step.transferId)}
                className={`group cursor-pointer rounded px-8 py-1.5 ${
                  active ? "bg-indigo-500/10" : "hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-600">
                    {step.time.toFixed(4)}s
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {step.request}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    dev {step.deviceAddress}
                  </span>
                </div>
                {/* arrow */}
                <div className="relative mt-0.5 flex items-center">
                  <div
                    className={`h-px flex-1 ${
                      isIn ? "bg-sky-500/50" : "bg-amber-500/50"
                    }`}
                  />
                  <span
                    className={`px-2 text-[10px] ${
                      isIn ? "text-sky-300" : "text-amber-300"
                    }`}
                  >
                    {isIn ? "◀ " : "▶ "}
                    {step.detail}
                  </span>
                  <div
                    className={`h-px flex-1 ${
                      isIn ? "bg-sky-500/50" : "bg-amber-500/50"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 px-8 text-[10px] text-slate-500">
        <span className="text-amber-300">▶ OUT</span> = host to device ·{" "}
        <span className="text-sky-300">◀ IN</span> = device to host
      </p>
    </div>
  );
}
