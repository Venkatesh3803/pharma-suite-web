import { NextResponse, type NextRequest } from "next/server";

const API_TARGET =
  process.env.API_BACKEND_URL || "https://pharma-suite-sever.onrender.com";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

async function proxyApi(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const backendUrl = new URL(pathname + search, API_TARGET);

  const headers = new Headers(request.headers);
  headers.delete("host");
  // Let fetch recompute these for the new body/destination.
  headers.delete("content-length");

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });
  } catch (err) {
    console.error(`[proxy] backend unreachable ${backendUrl}:`, err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Backend service unavailable. Please try again later.",
        code: "BAD_GATEWAY",
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(backendRes.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API requests are proxied to the backend, which performs its own auth.
  // This keeps cookies first-party (same-origin) so HttpOnly session
  // cookies work across Cloudflare Workers + Render.
  if (pathname.startsWith("/api/")) {
    return proxyApi(request);
  }

  const hasSessionCookie = request.cookies.get("pharmasuite_refresh") !== undefined;
  const hasOnboardedCookie = request.cookies.get("pharmasuite_onboarded") !== undefined;

  // NOTE: cookie presence is NOT proof of authentication (it is unsigned
  // client state). Absence means definitely logged out -> fail closed.
  // Presence means "maybe authenticated" -> let through and defer the real
  // check to the backend (/api/auth/me) via AuthBootstrap + API guards.

  if (hasOnboardedCookie && pathname.startsWith("/onboarding")) {
    const dashUrl = new URL("/dashboard/purchase-dashboard", request.url);
    return NextResponse.redirect(dashUrl);
  }

  const isPublicRoute =
    AUTH_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/onboarding");
  if (!isPublicRoute && !hasSessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude Next.js internals, static files, and asset pipelines
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
