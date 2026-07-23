import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROUTE_ROLE_GROUP_MAP, getRoleGroup } from "@/lib/permissions";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session?.user && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const match = ROUTE_ROLE_GROUP_MAP.find((r) => pathname.startsWith(r.prefix));
  if (match) {
    const allowedRoles = await getRoleGroup(match.group);
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
