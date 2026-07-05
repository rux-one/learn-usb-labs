// App shell: sidebar navigation over the lab pages + a persistent capture bar.

import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Usb } from "lucide-react";
import { useCapture } from "./state/CaptureContext";
import { LABS } from "./labs/registry";

function Sidebar() {
  const { capture } = useCapture();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/60">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <Usb className="h-5 w-5 text-indigo-400" />
        <div>
          <div className="text-sm font-bold text-slate-100">USB Labs</div>
          <div className="text-[10px] text-slate-500">RE mini-lab series</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {LABS.map((lab) => (
          <NavLink
            key={lab.path}
            to={lab.path}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-200"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`
            }
          >
            <span className="mr-2 font-mono text-xs text-slate-600">
              {lab.num}
            </span>
            {lab.title}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 px-4 py-3 text-[10px] text-slate-500">
        {capture ? (
          <>
            <div className="truncate font-mono text-slate-400">
              {capture.meta.source}
            </div>
            <div>{capture.meta.packetCount} packets loaded</div>
          </>
        ) : (
          "No capture loaded"
        )}
      </div>
    </aside>
  );
}

export function App() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to={LABS[0].path} replace />} />
            {LABS.map((lab) => (
              <Route key={lab.path} path={lab.path} element={<lab.component />} />
            ))}
            <Route path="*" element={<Navigate to={LABS[0].path} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
