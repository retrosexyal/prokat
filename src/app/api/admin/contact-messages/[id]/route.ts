import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { isAdminEmail } from "@/lib/auth";
import {
  deleteContactMessage,
  updateContactMessageViewed,
} from "@/lib/contact-messages";
import { toContactMessageView } from "@/lib/contact-message-mappers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid message id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    isViewed?: boolean;
  };

  const updated = await updateContactMessageViewed(
    id,
    Boolean(body.isViewed),
    session?.user?.email ?? undefined,
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Сообщение не найдено" },
      { status: 404 },
    );
  }

  return NextResponse.json(toContactMessageView(updated));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid message id" }, { status: 400 });
  }

  const deleted = await deleteContactMessage(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Сообщение не найдено" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}