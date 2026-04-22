"use client";

import { Factory } from "lucide-react";

export default function Footer() {
  return (
    <footer className="h-10 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <Factory className="w-3 h-3 text-indigo-500/60" />
        <span>Digital Twin Platform</span>
        <span className="text-zinc-700">·</span>
        <span>Industrial Process Orchestration</span>
      </div>
      <span className="text-xs text-zinc-700">© 2026 ELB</span>
    </footer>
  );
}
