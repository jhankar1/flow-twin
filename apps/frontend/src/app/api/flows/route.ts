import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── Config ─────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), "data", "flows");

// ── Utils ──────────────────────────────────────────────

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Convert flow name → safe filename
function toFileName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

// Build file path
function getFilePath(name: string, id: string) {
  const safeName = toFileName(name);
  return path.join(DATA_DIR, `${safeName}-${id}.json`);
}

// Find existing file by ID
function findFileById(id: string): string | null {
  ensureDir();

  const files = fs.readdirSync(DATA_DIR);

  for (const file of files) {
    if (file.includes(id)) {
      return path.join(DATA_DIR, file);
    }
  }

  return null;
}

// Read all flows
function readAllFlows(): any[] {
  try {
    ensureDir();

    const files = fs.readdirSync(DATA_DIR);

    return files.map((file) => {
      const filePath = path.join(DATA_DIR, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    });
  } catch (err) {
    console.error("Read error:", err);
    return [];
  }
}

// Save flow (create/update/rename-safe)
function saveFlow(name: string, id: string, data: any) {
  ensureDir();

  const existingFile = findFileById(id);
  const newFilePath = getFilePath(name, id);

  try {
    // If exists & name changed → rename file
    if (existingFile && existingFile !== newFilePath) {
      fs.renameSync(existingFile, newFilePath);
    }

    // Write (create or overwrite)
    fs.writeFileSync(newFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Save error:", err);
  }
}

// ── GET /api/flows ─────────────────────────────────────
// Returns summaries only

export async function GET() {
  const flows = readAllFlows();

  const summaries = flows.map(
    ({ id, name, category, status, nodeCount, savedAt, publishedAt }) => ({
      id,
      name,
      category,
      status,
      nodeCount,
      savedAt,
      publishedAt,
    })
  );

  return NextResponse.json(summaries);
}

// ── POST /api/flows ────────────────────────────────────
// Create or update a flow

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, status, nodes, edges } = body;

    // ── Validation ──
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Flow name is required" },
        { status: 400 }
      );
    }

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "Nodes must be an array" },
        { status: 400 }
      );
    }

    // Validate publish rules
    if (status === "published") {
      const hasStart = nodes.some(
        (n: any) => n.data?.meta?.Nodeid === "flow-start"
      );
      const hasEnd = nodes.some(
        (n: any) => n.data?.meta?.Nodeid === "flow-end"
      );

      if (!hasStart || !hasEnd) {
        return NextResponse.json(
          { error: "Flow must have Start & End node" },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    // 🔑 CORE FIX: stable identity
    const flowId = id ?? crypto.randomUUID();

    const record = {
      id: flowId,
      name: name.trim(),
      category,
      status,
      nodeCount: nodes.length,
      nodes,
      edges,
      savedAt: now,
      publishedAt: status === "published" ? now : null,
    };

    // ✅ Save (handles create/update/rename)
    saveFlow(name, flowId, record);

    return NextResponse.json({
      success: true,
      id: flowId,
      savedAt: now,
    });

  } catch (err) {
    console.error("POST error:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}