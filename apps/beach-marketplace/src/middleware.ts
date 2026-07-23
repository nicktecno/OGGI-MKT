import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dashboardPathForRole, roleForPainelSegment } from "@/lib/auth-types";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/auth-token";
import { safeInternalPath } from "@/lib/safe-redirect";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  let session: SessionPayload | null = null;
  if (token) {
    session = await verifySessionToken(token);
  }

  if (pathname.startsWith("/registrar")) {
    if (session) {
      const target = dashboardPathForRole(session.role);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/entrar")) {
    if (session) {
      const next = request.nextUrl.searchParams.get("next");
      const fallback = dashboardPathForRole(session.role);
      const target = safeInternalPath(next, fallback);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/painel")) {
    if (!session) {
      const login = new URL("/entrar", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }

    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "painel" && parts.length === 1) {
      return NextResponse.redirect(new URL(dashboardPathForRole(session.role), request.url));
    }

    const segment = parts[1];
    if (segment === "conta") {
      // Qualquer papel autenticado pode ver páginas de estado da conta.
    } else {
      const required = roleForPainelSegment(segment ?? "");
      if (!required || session.role !== required) {
        const allowed = dashboardPathForRole(session.role);
        return NextResponse.redirect(new URL(allowed, request.url));
      }
    }

    const roleNeedsModeration =
      session.role === "SUPPLIER" || session.role === "EXECUTOR";
    const status = session.accountStatus ?? "ACTIVE";

    if (roleNeedsModeration && status === "PENDING_ADMIN_REVIEW") {
      if (!pathname.startsWith("/painel/conta/pendente")) {
        return NextResponse.redirect(new URL("/painel/conta/pendente", request.url));
      }
      return NextResponse.next();
    }

    if (roleNeedsModeration && status === "REJECTED") {
      if (!pathname.startsWith("/painel/conta/recusado")) {
        return NextResponse.redirect(new URL("/painel/conta/recusado", request.url));
      }
      return NextResponse.next();
    }

    if (
      roleNeedsModeration &&
      status === "ACTIVE" &&
      (pathname.startsWith("/painel/conta/pendente") ||
        pathname.startsWith("/painel/conta/recusado"))
    ) {
      return NextResponse.redirect(new URL(dashboardPathForRole(session.role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/entrar", "/registrar", "/painel/:path*"],
};
