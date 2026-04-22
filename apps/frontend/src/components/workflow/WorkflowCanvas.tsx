"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "@/components/ui/node";
import EditEdge from "@/components/ui/editEdge";
import NodeConfigDrawer from "@/components/workflow/NodeConfigDrawer";

const edgeTypes = {
  editable: EditEdge,
};
import { useFlowStore } from "@/store/flow.store";
const nodeTypes = {
  custom: CustomNode,
};
function CanvasInner() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const addNode = useFlowStore((s) => s.addNode);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const raw = e.dataTransfer.getData("application/reactflow");


      if (!raw) return;

      const nodeMeta = JSON.parse(raw);



      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      addNode(nodeMeta, position);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={edgeTypes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onNodeClick={(_, node) => setSelectedNode(node.id)}
      fitView
      className="bg-zinc-950"
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} color="#27272a" />
      <Controls />
      <MiniMap
        className="!bg-zinc-900 border border-zinc-800 rounded-md"
        nodeColor={(node) => node.data?.definition?.color || "#52525b"}
        nodeStrokeWidth={2}
        maskColor="rgba(0,0,0,0.6)"
        pannable
        zoomable
      />
    </ReactFlow>
    <NodeConfigDrawer />
    </>
  );
}

export default function WorkflowCanvas() {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  );
}