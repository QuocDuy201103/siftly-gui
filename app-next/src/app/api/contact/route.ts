import { NextRequest, NextResponse } from "next/server";
import { insertContactSchema } from "@shared/schema";
import { storage } from "@/lib/storage";
import { sendSlackNotification } from "@/lib/slack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = insertContactSchema.parse(body);
    const contact = await storage.createContact(validated);

    sendSlackNotification(contact).catch(console.error);

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

