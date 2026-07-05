// Lab 4: side-by-side diff of two captures. Aligns transfers by index and
// highlights differing SETUP fields / payloads — the core of reversing a
// vendor protocol by comparing "action A" vs "action B".

import { useMemo, useState } from "react";
import { SAMPLES } from "@/samples";
import { groupTransfers, type Transfer } from "@/lib/usb/transfers";
import { useCapture } from "@/state/CaptureContext";
import type { Capture } from "@/lib/usb/types";

function rowLabel(t: Transfer | undefined): string {
  if (!t) return "—";
  if (t.setup) return t.setup.summary;
  if (t.byteCount > 0) return `${t.transferType} ${t.byteCount}B`;
  return t.transferType;
}

function transferSignature(t: Transfer | undefined): string {
  if (!t) return "";
  return `${t.transferType}|${t.setup?.summary ?? ""}|${t.dataHex}`;
}

export function DiffView() {
  const { capture } = useCapture();

  const options = useMemo(() => {
    const opts = SAMPLES.map((s) => ({ id: s.id, label: s.label, capture: s.capture }));
    if (capture) {
      opts.unshift({ id: "__current", label: `current (${capture.meta.source})`, capture });
    }
    return opts;
  }, [capture]);

  const [aId, setAId] = useState("vendor-red");
  const [bId, setBId] = useState("vendor-blue");

  const capA = options.find((o) => o.id === aId)?.capture as Capture | undefined;
  const capB = options.find((o) => o.id === bId)?.capture as Capture | undefined;

  const tA = useMemo(() => (capA ? groupTransfers(capA) : []), [capA]);
  const tB = useMemo(() => (capB ? groupTransfers(capB) : []), [capB]);

  const rows = Math.max(tA.length, tB.length);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { val: aId, set: setAId },
          { val: bId, set: setBId },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.val}
            onChange={(e) => sel.set(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="overflow-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              <th className="px-2 py-1.5">#</th>
              <th className="px-2 py-1.5">Capture A</th>
              <th className="px-2 py-1.5">Capture B</th>
              <th className="px-2 py-1.5">Δ</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => {
              const a = tA[i];
              const b = tB[i];
              const differs = transferSignature(a) !== transferSignature(b);
              return (
                <tr
                  key={i}
                  className={`border-t border-slate-800/50 ${
                    differs ? "bg-rose-500/10" : ""
                  }`}
                >
                  <td className="px-2 py-1 font-mono text-slate-500">{i}</td>
                  <td className="px-2 py-1 text-slate-200">
                    {rowLabel(a)}
                    {a?.dataHex ? (
                      <div className="font-mono text-[10px] text-slate-500">
                        {a.dataHex}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-1 text-slate-200">
                    {rowLabel(b)}
                    {b?.dataHex ? (
                      <div className="font-mono text-[10px] text-slate-500">
                        {b.dataHex}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-1">
                    {differs ? (
                      <span className="text-rose-300">differs</span>
                    ) : (
                      <span className="text-emerald-400/70">same</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        Rows highlighted in red differ between the two captures — these are the
        transfers that encode the action you changed. Isolate them, then vary one
        thing at a time to map fields to behavior.
      </p>
    </div>
  );
}
