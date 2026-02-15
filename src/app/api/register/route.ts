import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const e = String(email || "")
    .toLowerCase()
    .trim();
  const p = String(password || "");

  if (!e || p.length < 6) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
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
  await users.insertOne({
    email: e,
    password: hash,
    createdAt: new Date(),
    verified: false,
    verifyToken,
    verifySentAt: new Date(),
  });

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: e,
    subject: "Verify your email",
    html: `
    Click here:
    <a href="${process.env.NEXTAUTH_URL}/api/verify?token=${verifyToken}">
      Verify account
    </a>
  `,
  });

  return Response.json({ ok: true });
}
