import { NextResponse, type NextRequest } from "next/server";

// Declare authorization routes open to the public domain
const PUBLIC_ROUTES = ["/sign-in", "/sign-up", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname.startsWith(route),
  );

  // NextAuth (JWT) session cookies are set on successful sign-in
  const hasSessionCookie = request.cookies
    .getAll()
    .some(cookie => cookie.name.includes("authjs.session-token"));

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
