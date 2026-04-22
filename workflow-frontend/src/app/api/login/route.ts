import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // 🔐 simple check (replace later with DB)
  if (email === "admin@test.com" && password === "1234") {
    const res = NextResponse.json({ ok: true, user: { email } });

    // 🍪 set auth cookie (HTTP only)
    res.cookies.set("auth", "true", {
      httpOnly: true,
      path: "/",
    });

    return res;
  }

  return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
}