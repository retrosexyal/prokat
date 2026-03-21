import crypto from "crypto";
import { Resend } from "resend";
import clientPromise from "@/lib/mongodb";
import { UserType } from "@/types";

export async function sendVerifyEmail(user: UserType, callbackUrl:string) {
  const client = await clientPromise;
  const db = client.db();

  const now = Date.now();
  const last = user.verifySentAt?.getTime?.() || 0;

  if (now - last < 60_000) {
    return { cooldown: true };
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        verifyToken,
        verifySentAt: new Date(),
      },
    },
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: user.email,
    subject: "Verify your email",
    html: `
      <a href="${process.env.NEXTAUTH_URL}/api/verify?token=${verifyToken}&callbackUrl=${encodeURIComponent(callbackUrl)}">
      Verify account
      </a>
    `,
  });

  return { sent: true };
}
