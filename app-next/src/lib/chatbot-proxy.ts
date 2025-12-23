import { NextRequest, NextResponse } from "next/server";

const chatbotBase = (process.env.CHATBOT_BASE_URL || "http://localhost:4000").replace(/\/+$/, "");

export async function proxyToChatbot(request: NextRequest) {
  if (!process.env.CHATBOT_BASE_URL && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "CHATBOT_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const targetUrl = `${chatbotBase}${request.nextUrl.pathname}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
  });

  const respHeaders = new Headers(upstream.headers);
  respHeaders.delete("content-encoding");
  respHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

