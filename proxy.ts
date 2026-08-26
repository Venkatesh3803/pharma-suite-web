import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API requests are proxied to the backend, which performs its own auth.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.get("pharmasuite_refresh") !== undefined;
  const hasOnboardedCookie = request.cookies.get("pharmasuite_onboarded") !== undefined;

  // A signed-in user has no business on the auth pages.
  if (hasSessionCookie && AUTH_ROUTES.some(route => pathname === route)) {
    const dashUrl = new URL("/dashboard/purchase-dashboard", request.url);
    return NextResponse.redirect(dashUrl);
  }

  // Onboarding is only for a freshly provisioned workspace; once completed
  // (or if a workspace already onboarded) the user goes straight to the app.
  if (hasOnboardedCookie && pathname.startsWith("/onboarding")) {
    const dashUrl = new URL("/dashboard/purchase-dashboard", request.url);
    return NextResponse.redirect(dashUrl);
  }

  // Protect everything else unless a session exists.
  const isPublicRoute = AUTH_ROUTES.some(route => pathname.startsWith(route)) ||
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