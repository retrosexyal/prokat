import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { Resend } from "resend";

const LEGAL_DOCUMENTS_VERSION = "2026-05-03";

export async function POST(req: Request) {
  const {
    email,
    password,
    callbackUrl,
    acceptedUserAgreement,
    acceptedPrivacyPolicy,
  } = await req.json();

  const e = String(email || "")
    .toLowerCase()
    .trim();
  const p = String(password || "");

  if (!e || p.length < 6) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  if (!acceptedUserAgreement || !acceptedPrivacyPolicy) {
    return Response.json(
      {
        error:
          "Необходимо подтвердить ознакомление с Пользовательским соглашением и Политикой обработки персональных данных",
      },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");

  const exists = await users.findOne({ email: e });
  if (exists) {
    return Response.json({ error: "User already exists" }, { status: 400 });
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");

  const hash = await bcrypt.hash(p, 10);
  const now = new Date();

  await users.insertOne({
    email: e,
    password: hash,
    createdAt: now,
    updatedAt: now,
    verified: false,
    verifyToken,
    verifySentAt: now,

    acceptedUserAgreement: true,
    acceptedPrivacyPolicy: true,
    legalDocumentsVersion: LEGAL_DOCUMENTS_VERSION,
    legalAcceptedAt: now,
    legalAcceptedIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? undefined,
  });

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
    subject: "Verify your email",
    html: `
    Click here:
    <a href="${process.env.NEXTAUTH_URL}/api/verify?token=${verifyToken}&callbackUrl=${encodeURIComponent(safeCallbackUrl)}">
      Verify account
    </a>
  `,
  });

  return Response.json({ ok: true });
}