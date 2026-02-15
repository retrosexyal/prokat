import clientPromise from "@/lib/mongodb"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return new Response("Invalid token", { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()

  const user = await db.collection("users").findOne({ verifyToken: token })

  if (!user) {
    return new Response("Token not found", { status: 400 })
  }

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: { verified: true },
      $unset: { verifyToken: "" }
    }
  )

  return Response.redirect(`${process.env.NEXTAUTH_URL}/login`)
}
