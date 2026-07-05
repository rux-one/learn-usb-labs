// Scrollable list of transfers with type/direction/endpoint/summary columns.
// Selecting a row drives the shared selectedId state used by detail panes.

import { useCapture } from "@/state/CaptureContext";
import { TypeBadge, DirBadge, EmptyState } from "./ui";
import type { Transfer } from "@/lib/usb/transfers";

function summary(t: Transfer): string {
  if (t.setup) return t.setup.summary;
  if (t.byteCount > 0) return `${t.byteCount} bytes`;
  return "(no data)";
}

export function PacketList({ filterType }: { filterType?: string }) {
  const { transfers, selectedId, setSelectedId } = useCapture();

  const rows = filterType
    ? transfers.filter((t) => t.transferType === filterType)
    : transfers;

  if (rows.length === 0) {
    return <EmptyState>No transfers. Load a capture to begin.</EmptyState>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-900 text-slate-500">
          <tr>
            <th className="px-2 py-1.5 font-medium">#</th>
            <th className="px-2 py-1.5 font-medium">Time</th>
            <th className="px-2 py-1.5 font-medium">Dev</th>
            <th className="px-2 py-1.5 font-medium">EP</th>
            <th className="px-2 py-1.5 font-medium">Type</th>
            <th className="px-2 py-1.5 font-medium">Dir</th>
            <th className="px-2 py-1.5 font-medium">Summary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`cursor-pointer border-t border-slate-800/50 hover:bg-slate-800/50 ${
                selectedId === t.id ? "bg-indigo-500/10" : ""
              }`}
            >
              <td className="px-2 py-1 font-mono text-slate-500">{t.id}</td>
              <td className="px-2 py-1 font-mono text-slate-400">
                {t.startTime.toFixed(4)}
              </td>
              <td className="px-2 py-1 font-mono text-slate-400">
                {t.deviceAddress ?? "-"}
              </td>
              <td className="px-2 py-1 font-mono text-slate-400">
                {t.endpoint ?? "-"}
              </td>
              <td className="px-2 py-1">
                <TypeBadge type={t.transferType} />
              </td>
              <td className="px-2 py-1">
                <DirBadge dir={t.direction} />
              </td>
              <td className="px-2 py-1 text-slate-300">{summary(t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
