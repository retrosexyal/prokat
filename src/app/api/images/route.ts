import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { cloudinary } from "@/lib/cloudinary";

type CloudinaryUploadResult = {
  secure_url?: string;
  public_id?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
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
        resource_type: "image",
        transformation: [
          {
            width: 600,
            height: 600,
            crop: "limit",
            fetch_format: "webp",
            quality: "auto",
          },
        ],
      },
      (
        error: unknown,
        result: CloudinaryUploadResult | undefined,
      ) => {
        if (error || !result?.secure_url || !result.public_id) {
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

  if (!session?.user?.email) {
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