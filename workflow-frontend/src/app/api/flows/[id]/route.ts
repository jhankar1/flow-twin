import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "flows");

function findFileById(id: string): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const files = fs.readdirSync(DATA_DIR);
  for (const file of files) {
    if (file.includes(id)) return path.join(DATA_DIR, file);
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const file = findFileById(id);

  if (!file) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const raw = fs.readFileSync(file, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}
