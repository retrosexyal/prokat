import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(req: Request) {
  const { email, callbackUrl } = await req.json();

  const e = String(email || "").toLowerCase().trim();

  // Не палим, существует ли пользователь
  if (!e) {
    return Response.json({ ok: true });
  }

  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");

  const user = await users.findOne({ email: e });

  if (!user) {
    return Response.json({ ok: true });
  }

  // если аккаунт только через Google и без пароля
  if (!user.password) {
    return Response.json({ ok: true });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        resetToken,
        resetTokenExpires,
        updatedAt: new Date(),
      },
    },
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeCallbackUrl =
    typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  await resend.emails.send({
    from: "Prokatik <noreply@mail.prokatik.by>",
    to: e,
    subject: "Reset your password",
    html: `
      <p>Нажмите на ссылку для сброса пароля:</p>
      <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&callbackUrl=${encodeURIComponent(safeCallbackUrl)}">
        Сбросить пароль
      </a>
    `,
  });

  return Response.json({ ok: true });
}