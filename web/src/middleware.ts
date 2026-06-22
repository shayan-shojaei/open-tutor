import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isHosted = process.env.NEXT_PUBLIC_APP_MODE === "hosted";

const PUBLIC_PREFIXES = ["/landing", "/auth", "/api/auth", "/_next", "/favicon.ico", "/api/asset"];

function hasSession(req: NextRequest): boolean {
  return !!(
    req.cookies.get("next-auth.session-token") ??
    req.cookies.get("__Secure-next-auth.session-token")
  );
}

export function middleware(req: NextRequest) {
  if (!isHosted) return NextResponse.next();

  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/landing") && hasSession(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!hasSession(req)) {
    return NextResponse.redirect(new URL("/landing", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
