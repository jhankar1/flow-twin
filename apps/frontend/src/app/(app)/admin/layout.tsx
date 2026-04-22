"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Shield, ScrollText, Server } from "lucide-react";

const TABS = [
  { href: "/admin/users",    label: "Users",     icon: Users },
  { href: "/admin/roles",    label: "Roles",     icon: Shield },
  { href: "/admin/logs",     label: "Audit Logs",icon: ScrollText },
  { href: "/admin/services", label: "Services",  icon: Server },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-4 mr-6">
          <h1 className="text-sm font-semibold text-white">Admin</h1>
        </div>
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
