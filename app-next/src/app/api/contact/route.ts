import { NextRequest, NextResponse } from "next/server";
import { insertContactSchema } from "@/shared/schema";
import { storage } from "@/lib/storage";
import { sendSlackNotification } from "@/lib/slack";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = insertContactSchema.parse(body);
        const contact = await storage.createContact(validatedData);

        // Async Slack notification
        sendSlackNotification(contact).catch(console.error);

        return NextResponse.json({ success: true, contact }, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
