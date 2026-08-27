import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "session";

/**
 * Tokens are 32 random bytes encoded as hex = 64 hex characters.
 * Anything shorter or with invalid characters is definitely not a
 * valid token and we can reject early without a DB round-trip.
 *
 * This is only a first-pass fast reject. The actual session validation
 * happens in requireAdmin() / getCurrentUser() which hits the database.
 */
function isValidTokenFormat(token: string): boolean {
  return /^[0-9a-f]{64}$/i.test(token);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token || !isValidTokenFormat(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
