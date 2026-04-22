"use client";

import { useState } from "react";
import { useFlowStore } from "@/store/flow.store";
import { ShieldCheck, ChevronDown, ChevronUp, Check } from "lucide-react";

const ALL_ROLES = ["Designer", "Worker", "QA Supervisor", "Manager", "IIoT Admin", "Org Admin"];

export interface NodePermissionConfig {
  view:  string[];   // who can see this node's result
  edit:  string[];   // who can edit the node config (in builder)
  entry: string[];   // who can submit data for this node (in ENB)
}

const DEFAULT_PERMISSIONS: NodePermissionConfig = {
  view:  ["Designer", "Manager", "QA Supervisor"],
  edit:  ["Designer"],
  entry: ["Worker"],
};

const PERMISSION_LABELS: Record<keyof NodePermissionConfig, { label: string; desc: string; color: string }> = {
  view:  { label: "View",  desc: "Can see this node and its results",      color: "indigo" },
  edit:  { label: "Edit",  desc: "Can modify this node's configuration",   color: "amber"  },
  entry: { label: "Entry", desc: "Can submit data for this node in ENB",   color: "emerald"},
};

function RoleToggle({
  role,
  selected,
  onToggle,
  color,
}: {
  role: string;
  selected: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
        selected
          ? `bg-${color}-600 border-${color}-500 text-white`
          : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
      }`}
    >
      {selected && <Check className="w-2.5 h-2.5" />}
      {role}
    </button>
  );
}

export default function NodePermissions({ node }: { node: any }) {
  const updateNodeConfig = useFlowStore((s) => s.updateNodeConfig);
  const [open, setOpen] = useState(false);

  const permissions: NodePermissionConfig =
    node.data.config?.__permissions ?? DEFAULT_PERMISSIONS;

  const toggle = (type: keyof NodePermissionConfig, role: string) => {
    const current = permissions[type] ?? [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    updateNodeConfig(node.id, "__permissions", { ...permissions, [type]: updated });
  };

  return (
    <div className="border-t border-zinc-800 pt-3 mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Node Permissions</span>
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {(Object.keys(PERMISSION_LABELS) as (keyof NodePermissionConfig)[]).map((type) => {
            const { label, desc, color } = PERMISSION_LABELS[type];
            return (
              <div key={type}>
                <div className="mb-1.5">
                  <span className="text-[11px] font-semibold text-zinc-300">{label}</span>
                  <span className="text-[10px] text-zinc-600 ml-1.5">{desc}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((role) => (
                    <RoleToggle
                      key={role}
                      role={role}
                      selected={permissions[type].includes(role)}
                      onToggle={() => toggle(type, role)}
                      color={color}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Permissions are stored in the flow. The backend enforces <strong className="text-zinc-500">entry</strong> on every step submission.
          </p>
        </div>
      )}
    </div>
  );
}
