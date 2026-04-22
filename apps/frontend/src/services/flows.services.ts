import { apiFetch } from "@/lib/api";
import { FlowSummary } from "@/store/flows.store";

export async function fetchFlowList(): Promise<FlowSummary[]> {
  const res = await apiFetch("/flows");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchFlowById(id: string) {
  const res = await apiFetch(`/flows/${id}`);
  if (!res.ok) throw new Error("Flow not found");
  return res.json();
}
