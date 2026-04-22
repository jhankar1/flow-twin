import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // routes to protect
  const protectedRoutes = ["/dashboard", "/workflows"];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // read cookie
  const isLoggedIn = request.cookies.get("auth")?.value === "true";

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}