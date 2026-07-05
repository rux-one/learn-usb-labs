// Drag-and-drop / file-picker loader for .pcapng, .pcap, and .json captures,
// plus quick buttons for the bundled samples.

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { parseCaptureFile, parseJsonCapture } from "@/lib/usb/pcapng";
import { useCapture } from "@/state/CaptureContext";
import { SAMPLES } from "@/samples";

export function CaptureLoader() {
  const { setCapture, capture } = useCapture();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        if (file.name.endsWith(".json")) {
          const text = await file.text();
          setCapture(parseJsonCapture(file.name, text));
        } else {
          const buf = await file.arrayBuffer();
          const cap = parseCaptureFile(file.name, buf);
          if (cap.packets.length === 0) {
            setError(
              "No usbmon packets found. Is this a USB capture (LINKTYPE_USB_LINUX)?",
            );
          }
          setCapture(cap);
        }
      } catch (e) {
        setError(`Failed to parse: ${(e as Error).message}`);
      }
    },
    [setCapture],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-slate-700 hover:border-slate-500"
        }`}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
        <p className="text-sm text-slate-300">
          Drop a <span className="font-mono">.pcapng</span> /{" "}
          <span className="font-mono">.pcap</span> /{" "}
          <span className="font-mono">.json</span> capture here
        </p>
        <p className="text-xs text-slate-500">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pcapng,.pcap,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded bg-red-500/10 p-2 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
          Bundled samples
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setCapture(s.capture)}
              title={s.description}
              className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {capture && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5" />
          <span className="font-mono">{capture.meta.source}</span>
          <span>· {capture.meta.packetCount} packets</span>
        </div>
      )}
    </div>
  );
}
