"use client";

import { useSnackbarStore } from "@/store/sanckbar.store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function SnackbarContainer() {
  const snackbars = useSnackbarStore((s) => s.snackbars);
  const remove = useSnackbarStore((s) => s.remove);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
      {snackbars.map((snack, index) => (
        <div
          key={snack.id}
          className={cn(
            "group flex items-center justify-between gap-3",
            "min-w-[260px] max-w-[320px]",
            "px-4 py-2 rounded-lg shadow-lg border",
            "transition-all duration-300 ease-out",
            "animate-in slide-in-from-bottom-5 fade-in",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out",

            // 🔥 snake stacking effect
            "translate-y-0 opacity-100",
            index > 0 && "scale-[0.98] opacity-90",

            snack.type === "error" &&
              "bg-red-500/90 border-red-400 text-white",
            snack.type === "success" &&
              "bg-green-500/90 border-green-400 text-white",
            snack.type === "info" &&
              "bg-zinc-900 border-zinc-700 text-white"
          )}
          style={{
            transform: `translateY(-${index * 6}px) scale(${1 - index * 0.02})`,
            zIndex: 50 - index,
          }}
        >
          {/* 🔹 Message */}
          <span className="text-sm">{snack.message}</span>

          {/* 🔹 Close button */}
          <button
            onClick={() => remove(snack.id)}
            className="opacity-0 group-hover:opacity-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}