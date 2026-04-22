import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const isLoggedIn = cookie.includes("auth=true");

  if (!isLoggedIn) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: { email: "admin@test.com" },
  });
}