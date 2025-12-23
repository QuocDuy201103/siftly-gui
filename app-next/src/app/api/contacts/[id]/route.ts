import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await storage.deleteContact(params.id);
  if (deleted) {
    return NextResponse.json({ success: true, message: "Contact deleted" });
  }

  return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
}

