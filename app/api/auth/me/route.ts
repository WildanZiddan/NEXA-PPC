import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("nexa_token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid atau kedaluwarsa" }, { status: 401 });
    }

    return NextResponse.json({ user: payload });
  } catch (error: any) {
    console.error("Auth Me GET Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses profil: " + error.message },
      { status: 500 }
    );
  }
}
