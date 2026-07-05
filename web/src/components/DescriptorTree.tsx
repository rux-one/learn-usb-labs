// Interactive, collapsible descriptor tree for captured GET_DESCRIPTOR responses
// (device -> configuration -> interface -> endpoint), with field-level decoding.

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useCapture } from "@/state/CaptureContext";
import { DESCRIPTOR_TYPES } from "@/lib/usb/constants";
import type { DescNode } from "@/lib/usb/descriptors";
import { EmptyState } from "./ui";

const TYPE_COLORS: Record<number, string> = {
  1: "#6366f1", // device
  2: "#10b981", // config
  4: "#f59e0b", // interface
  5: "#ec4899", // endpoint
};

function Node({ node, depth }: { node: DescNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const color = TYPE_COLORS[node.type] ?? "#64748b";

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        className="flex cursor-pointer items-center gap-1 py-1"
        onClick={() => setOpen((o) => !o)}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
          style={{ backgroundColor: color + "22", color }}
        >
          {node.typeName}
        </span>
        <span className="font-mono text-[10px] text-slate-600">
          @{node.offset} len {node.length}
        </span>
      </div>

      {open && (
        <>
          <table className="ml-5 mb-1 text-left text-xs">
            <tbody>
              {node.fields.map((f) => (
                <tr key={f.name} className="align-top">
                  <td className="py-0.5 pr-3 font-mono text-slate-400">{f.name}</td>
                  <td className="py-0.5 text-slate-200">{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {node.children.map((c, i) => (
            <Node key={i} node={c} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  );
}

export function DescriptorTree() {
  const { descriptors } = useCapture();

  if (descriptors.length === 0) {
    return (
      <EmptyState>
        No descriptors captured. Load a capture containing GET_DESCRIPTOR
        responses (try the Keyboard or Flash Drive sample).
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {descriptors.map((d) => (
        <div key={d.transferId} className="rounded-lg border border-slate-800 p-3">
          <div className="mb-2 text-xs text-slate-500">
            from transfer #{d.transferId} · device {d.deviceAddress} ·{" "}
            {DESCRIPTOR_TYPES[d.descriptorType] ?? "descriptor"} · {d.bytes.length} bytes
          </div>
          {d.tree.map((n, i) => (
            <Node key={i} node={n} depth={0} />
          ))}
        </div>
      ))}
    </div>
  );
}
