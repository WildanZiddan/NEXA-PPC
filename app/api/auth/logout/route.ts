import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logout berhasil" });
    
    // Delete the token cookie by setting maxAge to 0
    response.cookies.set("nexa_token", "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("Auth Logout Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses logout: " + error.message },
      { status: 500 }
    );
  }
}
