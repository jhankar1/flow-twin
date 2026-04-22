"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notifications.store";
import {
  Factory,
  LayoutDashboard,
  GitBranch,
  Workflow,
  LogOut,
  Layers,
  ShieldCheck,
  Bell,
  Send,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Flows", icon: GitBranch },
  { href: "/builder", label: "Builder", icon: Workflow },
  { href: "/approvals", label: "Approvals", icon: Bell },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-5 shrink-0">

      {/* ── Left: Brand ── */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
          <Factory className="w-4 h-4 text-white" />
        </div>
        <div className="leading-none">
          <div className="text-sm font-bold text-white">Digital Twin</div>
          <div className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Platform</div>
        </div>
      </Link>

      {/* ── Center: Nav ── */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Right: Bell + Logout ── */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Link
          href="/approvals"
          onClick={markAllRead}
          className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <button
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
