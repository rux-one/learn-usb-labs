// Detail pane for the selected transfer: decoded SETUP fields (control) with
// byte-offset highlighting into a synchronized hex view of the payload.

import { useMemo } from "react";
import { useCapture } from "@/state/CaptureContext";
import { HexView, type HexHighlight } from "./HexView";
import { TypeBadge, DirBadge, EmptyState } from "./ui";
import { bytesToHex, hex } from "@/lib/usb/hex";

const FIELD_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#38bdf8"];

export function TransferDetail() {
  const { transfers, selectedId } = useCapture();
  const t = useMemo(
    () => transfers.find((x) => x.id === selectedId) ?? null,
    [transfers, selectedId],
  );

  if (!t) {
    return <EmptyState>Select a transfer to inspect its fields.</EmptyState>;
  }

  // Build a hex string of the SETUP packet (8 bytes) for control transfers.
  const setupHex = t.setup
    ? bytesToHex(
        Uint8Array.from([
          Number(t.setup.fields[0].raw),
          Number(t.setup.fields[1].raw),
          Number(t.setup.fields[2].raw) & 0xff,
          (Number(t.setup.fields[2].raw) >> 8) & 0xff,
          Number(t.setup.fields[3].raw) & 0xff,
          (Number(t.setup.fields[3].raw) >> 8) & 0xff,
          Number(t.setup.fields[4].raw) & 0xff,
          (Number(t.setup.fields[4].raw) >> 8) & 0xff,
        ]),
      )
    : "";

  const setupHighlights: HexHighlight[] =
    t.setup?.fields.map((f, i) => ({
      start: f.offset,
      length: f.length,
      color: FIELD_COLORS[i % FIELD_COLORS.length],
      label: f.name,
    })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <TypeBadge type={t.transferType} />
        <DirBadge dir={t.direction} />
        <span className="text-slate-400">
          device {t.deviceAddress}, EP {t.endpoint}
        </span>
        <span className="ml-auto font-mono text-xs text-slate-500">
          transfer #{t.id} · {t.startTime.toFixed(4)}s
        </span>
      </div>

      {t.setup && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            SETUP packet — {t.setup.summary}
          </h4>
          <div className="mb-3 rounded bg-slate-950 p-2">
            <HexView hex={setupHex} highlights={setupHighlights} />
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              {t.setup.fields.map((f, i) => (
                <tr key={f.name} className="border-t border-slate-800/50">
                  <td className="py-1 pr-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: FIELD_COLORS[i % FIELD_COLORS.length] }}
                    />
                  </td>
                  <td className="py-1 pr-3 font-mono text-slate-300">{f.name}</td>
                  <td className="py-1 pr-3 font-mono text-slate-500">
                    {typeof f.raw === "number" ? hex(f.raw, f.length * 2) : f.raw}
                  </td>
                  <td className="py-1 text-slate-200">{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Payload ({t.byteCount} bytes)
        </h4>
        <div className="rounded bg-slate-950 p-2">
          <HexView hex={t.dataHex} />
        </div>
      </div>
    </div>
  );
}
