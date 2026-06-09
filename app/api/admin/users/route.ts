import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.mstUsr.findMany({
      include: {
        role: true,
        supplier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const roles = await prisma.mstRol.findMany();
    const suppliers = await prisma.mstSup.findMany();

    return NextResponse.json({
      users,
      roles,
      suppliers,
    });
  } catch (error: any) {
    console.error("Users API GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data user: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, full_name, role_id, supplier_id } = body;

    if (!username || !password || !full_name || !role_id) {
      return NextResponse.json(
        { error: "Username, password, nama lengkap, dan role wajib diisi." },
        { status: 400 }
      );
    }

    // Cek apakah username sudah terdaftar
    const existingUser = await prisma.mstUsr.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username sudah digunakan." },
        { status: 400 }
      );
    }

    // Verifikasi role
    const role = await prisma.mstRol.findUnique({
      where: { role_id }
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role tidak valid." },
        { status: 400 }
      );
    }

    // Validasi kondisional: jika SUPPLIER wajib memilih supplier_id
    let resolvedSupplierId = null;
    if (role.role_name === "SUPPLIER") {
      if (!supplier_id) {
        return NextResponse.json(
          { error: "Untuk role SUPPLIER, akun wajib dihubungkan ke salah satu Pemasok." },
          { status: 400 }
        );
      }
      resolvedSupplierId = supplier_id;
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.mstUsr.create({
      data: {
        username,
        password: hashedPassword,
        full_name,
        role_id,
        supplier_id: resolvedSupplierId,
      },
      include: {
        role: true,
        supplier: true,
      }
    });

    return NextResponse.json(
      { message: "User berhasil dibuat.", user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Users API POST Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat user baru: " + error.message },
      { status: 500 }
    );
  }
}
