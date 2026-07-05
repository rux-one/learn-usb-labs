// Lab 3: decode interrupt-IN HID reports (keyboard/mouse boot protocol),
// mapping raw report bytes to their meaning.

import { useMemo, useState } from "react";
import { useCapture } from "@/state/CaptureContext";
import { hexToBytes } from "@/lib/usb/hex";
import { decodeHidReport, guessHidProfile, type HidProfile } from "@/lib/usb/hid";
import { HexView } from "./HexView";
import { EmptyState } from "./ui";

export function HidReportView() {
  const { transfers } = useCapture();
  const [profile, setProfile] = useState<HidProfile | "auto">("auto");

  const reports = useMemo(
    () =>
      transfers.filter(
        (t) => t.transferType === "INTERRUPT" && t.direction === "IN" && t.byteCount > 0,
      ),
    [transfers],
  );

  if (reports.length === 0) {
    return (
      <EmptyState>
        No interrupt-IN reports found. Load the Keyboard sample or a capture of a
        HID device.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">Decode as:</span>
        {(["auto", "keyboard", "mouse"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProfile(p)}
            className={`rounded px-2 py-0.5 ${
              profile === p ? "bg-indigo-500/20 text-indigo-200" : "bg-slate-800 text-slate-300"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {reports.map((t) => {
        const bytes = hexToBytes(t.dataHex);
        const prof = profile === "auto" ? guessHidProfile(bytes) : profile;
        const fields = decodeHidReport(bytes, prof);
        return (
          <div key={t.id} className="rounded-lg border border-slate-800 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">#{t.id}</span>
              <span>{t.startTime.toFixed(4)}s</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                {prof}
              </span>
            </div>
            <div className="mb-2 rounded bg-slate-950 p-2">
              <HexView hex={t.dataHex} />
            </div>
            <table className="text-left text-xs">
              <tbody>
                {fields.map((f) => (
                  <tr key={f.name}>
                    <td className="py-0.5 pr-2 font-mono text-slate-500">
                      byte {f.offset}
                    </td>
                    <td className="py-0.5 pr-3 font-mono text-slate-400">{f.name}</td>
                    <td className="py-0.5 text-slate-200">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
