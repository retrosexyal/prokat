import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/contact-messages";
import { toContactMessageView } from "@/lib/contact-message-mappers";
import { notifyAdmin } from "@/lib/admin-notifications";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Заполните имя, email и сообщение" },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Введите корректный email" },
      { status: 400 },
    );
  }

  if (name.length > 120) {
    return NextResponse.json(
      { error: "Имя слишком длинное" },
      { status: 400 },
    );
  }

  if (email.length > 160) {
    return NextResponse.json(
      { error: "Email слишком длинный" },
      { status: 400 },
    );
  }

  if (subject.length > 180) {
    return NextResponse.json(
      { error: "Тема слишком длинная" },
      { status: 400 },
    );
  }

  if (message.length > 3000) {
    return NextResponse.json(
      { error: "Сообщение слишком длинное" },
      { status: 400 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const created = await createContactMessage({
    name,
    email,
    subject: subject || undefined,
    message,
    ip,
    userAgent,
  });

  await notifyAdmin({
    title: "Новое сообщение",
    body: `${name}: ${subject || message.slice(0, 80)}`,
    url: "/admin",
  });

  return NextResponse.json(toContactMessageView(created), { status: 201 });
}