import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("nexa_token")?.value;
  const { pathname } = request.nextUrl;

  // Let public and API routes pass (except protected API routes if necessary)
  // For now, let's protect /admin and /supplier routes.
  const isAdminPath = pathname.startsWith("/admin");
  const isSupplierPath = pathname.startsWith("/supplier");
  const isLoginPath = pathname === "/login";

  if (!token) {
    if (isAdminPath || isSupplierPath) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    // Invalid token, clear cookie and redirect
    if (isAdminPath || isSupplierPath) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("nexa_token");
      return response;
    }
    return NextResponse.next();
  }

  // User is authenticated
  if (isLoginPath) {
    if (payload.role_name === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (payload.role_name === "SUPPLIER") {
      return NextResponse.redirect(new URL("/supplier/portal", request.url));
    }
  }

  // Verify Role for internal paths
  if (isAdminPath && payload.role_name !== "ADMIN") {
    // Admin path access by non-admin: redirect to supplier portal or login
    if (payload.role_name === "SUPPLIER") {
      return NextResponse.redirect(new URL("/supplier/portal", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isSupplierPath && payload.role_name !== "SUPPLIER") {
    // Supplier path access by non-supplier: redirect to admin dashboard
    if (payload.role_name === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect /api/admin/* and /api/supplier/* routes
  if (pathname.startsWith("/api/admin") && payload.role_name !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
  }

  if (pathname.startsWith("/api/supplier") && payload.role_name !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden: Supplier access only" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/supplier/:path*",
    "/login",
    "/api/admin/:path*",
    "/api/supplier/:path*",
  ],
};
