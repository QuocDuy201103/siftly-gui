import { proxyToChatbot } from "@/lib/chatbot-proxy";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return proxyToChatbot(request);
}

