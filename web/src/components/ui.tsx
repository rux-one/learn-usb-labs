// Small shared presentational helpers.

import type { ReactNode } from "react";
import { TRANSFER_COLORS } from "@/lib/usb/constants";
import type { TransferType } from "@/lib/usb/types";

export function TypeBadge({ type }: { type: TransferType }) {
  const color = TRANSFER_COLORS[type] ?? "#64748b";
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: color + "22", color }}
    >
      {type}
    </span>
  );
}

export function DirBadge({ dir }: { dir: "IN" | "OUT" | null }) {
  if (!dir) return null;
  const isIn = dir === "IN";
  return (
    <span
      className={`rounded px-1 text-[10px] font-mono ${
        isIn ? "bg-sky-500/20 text-sky-300" : "bg-amber-500/20 text-amber-300"
      }`}
    >
      {isIn ? "IN ←" : "OUT →"}
    </span>
  );
}

export function Card({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900/50 ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
