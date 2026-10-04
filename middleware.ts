import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_TARGET = process.env.API_BACKEND_URL || "https://pharma-suite-sever.onrender.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only proxy /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rewrite the URL to point to the backend
  const backendUrl = new URL(pathname + request.nextUrl.search, API_TARGET);

  // Copy headers
  const headers = new Headers(request.headers);
  // Remove host header to avoid conflicts
  headers.delete("host");

  // Forward the request to the backend
  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    redirect: "manual",
  });

  // Create response with backend response
  const responseHeaders = new Headers(response.headers);
  // Remove problematic headers
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const config = {
  matcher: "/api/:path*",
};