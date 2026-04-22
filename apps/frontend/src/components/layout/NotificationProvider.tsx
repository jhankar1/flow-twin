"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notifications.store";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { X, Bell } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: string;
}

const TYPE_COLORS: Record<string, string> = {
  "approval.pending":  "border-amber-500/40 bg-amber-500/5",
  "approval.approved": "border-emerald-500/40 bg-emerald-500/5",
  "approval.rejected": "border-red-500/40 bg-red-500/5",
  "flow.published":    "border-indigo-500/40 bg-indigo-500/5",
  "user.created":      "border-teal-500/40 bg-teal-500/5",
};

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.add);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = (id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  const addToast = (notif: any) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-4), { id, title: notif.title, message: notif.message, type: notif.type }]);
    const timer = setTimeout(() => removeToast(id), 5000);
    timers.current.set(id, timer);
  };

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket(user.id);

    socket.on('notification', (notif: any) => {
      addNotification(notif);
      addToast(notif);
    });

    return () => {
      socket.off('notification');
      disconnectSocket();
    };
  }, [user?.id]);

  return (
    <>
      {children}

      {/* Toast stack — bottom right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((toast) => {
          const colorCls = TYPE_COLORS[toast.type] ?? "border-zinc-700 bg-zinc-900";
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 border rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm ${colorCls} animate-in slide-in-from-right-5 duration-300`}
            >
              <Bell className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">{toast.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.message}</div>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
