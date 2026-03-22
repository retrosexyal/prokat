import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const t = String(token || "");
  const p = String(password || "");

  if (!t || p.length < 6) {
    return Response.json(
      { error: "Invalid token or password" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");

  const user = await users.findOne({
    resetToken: t,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return Response.json({ error: "Token is invalid or expired" }, { status: 400 });
  }

  const hash = await bcrypt.hash(p, 10);

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hash,
        verified: true,
        provider: user.provider ?? "credentials",
        updatedAt: new Date(),
      },
      $unset: {
        resetToken: "",
        resetTokenExpires: "",
      },
    },
  );

  return Response.json({ ok: true });
}