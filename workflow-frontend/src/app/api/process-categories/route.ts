import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS CATEGORIES
// The three high-level flow domains supported by the platform.
// Each category determines which node sets are available and how flows execute.
// ─────────────────────────────────────────────────────────────────────────────

export const processCategories = [
  {
    value: "Industrial",
    label: "Industrial",
    description: "Factory floor. Workers + sensors + machines + QA approvals.",
    color: "#ef4444",
    iconName: "Factory",
    lotPrefix: "IND",
  },
  {
    value: "Customer",
    label: "Customer",
    description: "Public-facing. Customer is the actor. Self-serve.",
    color: "#f97316",
    iconName: "ShoppingCart",
    lotPrefix: "CST",
  },
  {
    value: "Business",
    label: "Business",
    description: "Internal operations. Employee executes. Manager approves.",
    color: "#14b8a6",
    iconName: "Briefcase",
    lotPrefix: "BIZ",
  },
];

export async function GET() {
  return NextResponse.json(processCategories);
}
