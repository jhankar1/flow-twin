import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/workflows", "/builder", "/admin", "/run", "/submit", "/approvals"];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isLoggedIn = request.cookies.has("access_token");

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
