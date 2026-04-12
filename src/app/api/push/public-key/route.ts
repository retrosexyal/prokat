import { NextResponse } from "next/server";
import { getPublicVapidKey } from "@/lib/push";

export async function GET() {
  try {
    return NextResponse.json({
      publicKey: getPublicVapidKey(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "VAPID public key is not configured" },
      { status: 500 },
    );
  }
}