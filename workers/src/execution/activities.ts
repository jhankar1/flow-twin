export interface FlowNode {
  id: string;
  data: {
    meta: { Nodeid: string; label?: string };
    config: Record<string, unknown>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

// ─── Activity: Fetch published flow JSON from the API ─────────────────────────
export async function loadFlow(flowId: string): Promise<{
  nodes: FlowNode[];
  edges: FlowEdge[];
}> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/api/flows/${flowId}`);
  if (!res.ok) throw new Error(`loadFlow: Flow ${flowId} not found (${res.status})`);
  const flow = await res.json() as { nodes: FlowNode[]; edges: FlowEdge[] };
  return { nodes: flow.nodes, edges: flow.edges };
}
