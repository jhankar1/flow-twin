import { apiFetch } from "@/lib/api";

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  fieldValues: Record<string, unknown>;
  submittedBy: string;
  submitterName: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  deciderName?: string;
  reason?: string;
  createdAt: string;
  decidedAt?: string;
}

export async function submitApproval(data: {
  title: string;
  description: string;
  fieldValues: Record<string, unknown>;
}): Promise<ApprovalRequest> {
  const res = await apiFetch("/approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to submit");
  return json;
}

export async function fetchApprovals(): Promise<ApprovalRequest[]> {
  const res = await apiFetch("/approvals");
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
}

export async function fetchPendingCount(): Promise<number> {
  const res = await apiFetch("/approvals/pending/count");
  if (!res.ok) return 0;
  const { count } = await res.json();
  return count;
}

export async function decideApproval(
  id: string,
  decision: "approved" | "rejected",
  reason?: string
): Promise<ApprovalRequest> {
  const res = await apiFetch(`/approvals/${id}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reason }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to decide");
  return json;
}
