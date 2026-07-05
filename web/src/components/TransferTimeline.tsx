// Timeline of transfers laid out on endpoint lanes, colored by transfer type.
// Clicking a block selects the transfer. Includes a control-stage breakdown for
// the selected control transfer.

import { useMemo } from "react";
import { useCapture } from "@/state/CaptureContext";
import { TRANSFER_COLORS } from "@/lib/usb/constants";
import { controlStages, type Transfer } from "@/lib/usb/transfers";
import { EmptyState, TypeBadge } from "./ui";

export function TransferTimeline() {
  const { transfers, selectedId, setSelectedId } = useCapture();

  const { lanes, tMin, tMax } = useMemo(() => {
    const laneMap = new Map<string, Transfer[]>();
    let tMin = Infinity;
    let tMax = -Infinity;
    for (const t of transfers) {
      const key = `${t.deviceAddress}·EP${t.endpoint}·${t.direction ?? ""}`;
      if (!laneMap.has(key)) laneMap.set(key, []);
      laneMap.get(key)!.push(t);
      tMin = Math.min(tMin, t.startTime);
      tMax = Math.max(tMax, t.endTime);
    }
    return { lanes: Array.from(laneMap.entries()), tMin, tMax };
  }, [transfers]);

  if (transfers.length === 0) {
    return <EmptyState>Load a capture to see the transfer timeline.</EmptyState>;
  }

  const span = Math.max(tMax - tMin, 1e-6);
  const pct = (t: number) => ((t - tMin) / span) * 100;

  const selected = transfers.find((t) => t.id === selectedId) ?? null;
  const stages = selected ? controlStages(selected) : [];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {lanes.map(([lane, items]) => (
          <div key={lane} className="flex items-center gap-2">
            <div className="w-40 shrink-0 truncate font-mono text-[10px] text-slate-400">
              {lane}
            </div>
            <div className="relative h-6 flex-1 rounded bg-slate-900">
              {items.map((t) => {
                const left = pct(t.startTime);
                const width = Math.max(pct(t.endTime) - left, 0.8);
                const color = TRANSFER_COLORS[t.transferType];
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    title={`#${t.id} ${t.transferType} ${t.byteCount}B`}
                    className="absolute top-0.5 h-5 rounded-sm"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: 4,
                      backgroundColor: color,
                      outline:
                        selectedId === t.id ? "2px solid white" : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span>{tMin.toFixed(4)}s</span>
        <div className="h-px flex-1 bg-slate-800" />
        <span>{tMax.toFixed(4)}s</span>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px]">
        {Object.entries(TRANSFER_COLORS)
          .filter(([k]) => k !== "UNKNOWN")
          .map(([k, c]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
              {k}
            </span>
          ))}
      </div>

      {selected && stages.length > 0 && (
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <TypeBadge type={selected.transferType} />
            <span className="text-slate-300">Control transfer stages</span>
            <span className="ml-auto font-mono text-xs text-slate-500">
              #{selected.id}
            </span>
          </div>
          <div className="flex gap-2">
            {stages.map((s, i) => (
              <div
                key={i}
                className="flex-1 rounded border border-slate-700 bg-slate-900 p-2"
              >
                <div className="text-xs font-semibold text-indigo-300">
                  {s.stage}
                </div>
                <div className="text-[11px] text-slate-400">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
