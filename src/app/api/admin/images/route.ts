import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { cloudinary } from "@/lib/cloudinary";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email?.toLowerCase() === adminEmail.toLowerCase();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadResult = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "prokat-products",
      },
      (error: unknown, result: { secure_url?: string; public_id?: string } | undefined) => {
        if (error || !result || !result.secure_url || !result.public_id) {
          return reject(error ?? new Error("Upload failed"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });

  return NextResponse.json(
    {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const publicId = searchParams.get("publicId");

  if (!publicId) {
    return NextResponse.json(
      { error: "publicId query param required" },
      { status: 400 },
    );
  }

  await cloudinary.uploader.destroy(publicId);

  return NextResponse.json({ ok: true });
}

