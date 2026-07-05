// A classic hex dump with offset column, hex bytes, and ASCII gutter.
// Supports highlighting byte ranges (used to link decoded fields to raw bytes).

import { useMemo } from "react";
import { hexToBytes, toAscii } from "@/lib/usb/hex";

export interface HexHighlight {
  start: number;
  length: number;
  color?: string;
  label?: string;
}

interface Props {
  hex: string;
  highlights?: HexHighlight[];
  bytesPerRow?: number;
}

export function HexView({ hex, highlights = [], bytesPerRow = 16 }: Props) {
  const bytes = useMemo(() => hexToBytes(hex), [hex]);

  const colorAt = (i: number): string | undefined => {
    for (const h of highlights) {
      if (i >= h.start && i < h.start + h.length) return h.color ?? "#6366f1";
    }
    return undefined;
  };

  if (bytes.length === 0) {
    return <div className="text-slate-500 text-sm italic">no payload bytes</div>;
  }

  const rows: number[][] = [];
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    rows.push(Array.from(bytes.slice(i, i + bytesPerRow)));
  }

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto">
      {rows.map((row, r) => {
        const base = r * bytesPerRow;
        return (
          <div key={r} className="flex gap-4 whitespace-pre">
            <span className="text-slate-600 select-none">
              {base.toString(16).padStart(4, "0")}
            </span>
            <span className="flex gap-1">
              {row.map((b, c) => {
                const idx = base + c;
                const color = colorAt(idx);
                return (
                  <span
                    key={c}
                    style={color ? { backgroundColor: color + "33", color } : undefined}
                    className="px-0.5 rounded"
                  >
                    {b.toString(16).padStart(2, "0")}
                  </span>
                );
              })}
            </span>
            <span className="text-slate-400">
              {row.map((b, c) => {
                const idx = base + c;
                const color = colorAt(idx);
                return (
                  <span key={c} style={color ? { color } : undefined}>
                    {toAscii(b)}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
