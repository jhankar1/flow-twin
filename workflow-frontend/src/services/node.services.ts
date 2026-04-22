
import { CATEGORY_ICONS } from "@/lib/nodesIcon";
import {CATEGORY_COLORS} from "@/lib/nodeColor"
export type NodeMeta = {
  Nodeid: string;
  label: string;
  category: string;
  icon: string;
  color: string;
};

// 🔥 main service
export async function fetchNodeList(): Promise<NodeMeta[]> {
  const res = await fetch("/api/nodes");
  const data = await res.json();

  // 🔥 flatten categories → nodes[]
  return data.categories.flatMap((cat: any) =>
    cat.nodes.map((n: any) => ({
      Nodeid: n.Nodeid,
      label: n.label,
      category: n.category,
      icon: CATEGORY_ICONS[n.category],
      color:CATEGORY_COLORS[n.category] ,
    }))
  );
}
export async function fetchNodeConfig(nodeId: string) {
  const res = await fetch(`/api/nodes?NodeId=${nodeId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch node config");
  }

  return res.json();
}