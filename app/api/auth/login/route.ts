import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Query user and include role details
    const user = await prisma.mstUsr.findUnique({
      where: { username },
      include: {
        role: true,
        supplier: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    // Sign JWT
    const payload = {
      user_id: user.user_id,
      username: user.username,
      role_name: user.role.role_name,
      supplier_id: user.supplier_id,
      full_name: user.full_name,
    };

    const token = await signJWT(payload);

    // Set cookie response
    const response = NextResponse.json({
      message: "Login sukses",
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role.role_name,
        full_name: user.full_name,
        supplier_name: user.supplier?.supplier_name || null,
      },
      redirectTo: user.role.role_name === "ADMIN" ? "/admin/dashboard" : "/supplier/portal",
    });

    response.cookies.set("nexa_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Auth Login Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses login: " + error.message },
      { status: 500 }
    );
  }
}
