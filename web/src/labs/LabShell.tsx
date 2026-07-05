// Shared presentational scaffolding for lab pages: header, teaching callouts,
// and section wrappers.

import type { ReactNode } from "react";
import { Lightbulb, Terminal } from "lucide-react";

export function LabHeader({
  num,
  title,
  intro,
}: {
  num: string;
  title: string;
  intro: string;
}) {
  return (
    <header className="mb-6">
      <div className="mb-1 font-mono text-xs text-indigo-400">LAB {num}</div>
      <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
        {intro}
      </p>
    </header>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Concept({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
      <Lightbulb className="h-4 w-4 shrink-0 text-indigo-400" />
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export function Cmd({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
      <Terminal className="h-4 w-4 shrink-0 text-emerald-400" />
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-slate-300">
        {children}
      </pre>
    </div>
  );
}
