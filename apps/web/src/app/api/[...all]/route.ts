import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL || "http://localhost:3001";
const TRUSTED_ORIGIN = process.env.TRUSTED_ORIGIN || "http://localhost:3005";

async function proxyRequest(request: NextRequest, path: string) {
  const url = new URL(request.url);
  const apiUrl = new URL(`/api/${path}`, API_BASE);
  apiUrl.search = url.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() === "host") return;
    headers.set(key, value);
  });

  if (!headers.has("Origin")) {
    headers.set("Origin", TRUSTED_ORIGIN);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const apiRes = await fetch(apiUrl.href, init);
  const resBody = await apiRes.arrayBuffer();

  const response = new NextResponse(resBody, {
    status: apiRes.status,
    statusText: apiRes.statusText,
  });

  apiRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding" || lower === "connection" || lower === "set-cookie") return;
    response.headers.set(key, value);
  });

  // Forward Set-Cookie headers (Headers.forEach skips them in Node.js)
  // Rewrite SameSite=None to SameSite=Lax for HTTP localhost (Chrome rejects SameSite=None without Secure)
  const setCookies = apiRes.headers.getSetCookie?.() || [];
  for (const cookie of setCookies) {
    const rewritten = cookie
      .replace(/SameSite=None/gi, "SameSite=Lax");
    response.headers.append("Set-Cookie", rewritten);
  }

  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  return proxyRequest(request, all.join("/"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  return proxyRequest(request, all.join("/"));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  return proxyRequest(request, all.join("/"));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  return proxyRequest(request, all.join("/"));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  return proxyRequest(request, all.join("/"));
}
