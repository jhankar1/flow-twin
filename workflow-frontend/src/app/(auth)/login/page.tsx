"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Layers, Cpu, UserCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  const handleLogin = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      await fetchUser();
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">

      {/* ── Brand ── */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="text-xl font-bold text-white leading-tight">Digital Twin</div>
            <div className="text-xs text-indigo-400 font-medium tracking-wider uppercase">Industrial Platform</div>
          </div>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Build your factory process once.<br />
          Your workers execute it. You see everything.
        </p>
      </div>

      {/* ── Three roles ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Layers, label: "Designer", sub: "Build flows", color: "indigo" },
          { icon: Cpu, label: "Worker", sub: "Execute steps", color: "emerald" },
          { icon: UserCheck, label: "Supervisor", sub: "Approve & watch", color: "amber" },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-400`} />
            </div>
            <div className="text-xs font-semibold text-white">{label}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Form ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <p className="text-sm font-medium text-zinc-300">Sign in to your workspace</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Username</label>
            <input
              type="text"
              placeholder="your-username"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
