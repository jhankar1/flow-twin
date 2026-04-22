"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";

interface DynamicSelectProps {
  flowId: string;               // published flow to call for options
  inputValue?: string;          // value from parent field (triggers re-fetch)
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function DynamicSelect({
  flowId,
  inputValue,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
}: DynamicSelectProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOptions([]);
    onChange("");   // reset value when parent changes

    const params = new URLSearchParams();
    if (inputValue) params.set("input", inputValue);

    apiFetch(`/flows/${flowId}/resolve?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) { setError(data.error); return; }
        setOptions(data.options ?? []);
      })
      .catch(() => { if (!cancelled) setError("Failed to load options"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [flowId, inputValue]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
        <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
        <span className="text-sm text-zinc-500">Loading options…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || options.length === 0}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition disabled:opacity-40"
    >
      <option value="">
        {options.length === 0 && inputValue !== undefined
          ? "No options for this selection"
          : placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
