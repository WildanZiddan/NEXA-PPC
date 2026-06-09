import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Ambil token dari cookie
    const token = request.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("nexa_token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user || user.role_name !== "SUPPLIER" || !user.supplier_id) {
      return NextResponse.json({ error: "Akses ditolak. Hanya untuk Supplier." }, { status: 403 });
    }

    // 2. Query PO dan pastikan terikat ke supplier_id user tersebut
    const po = await prisma.trxPur.findUnique({
      where: { po_id: id }
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase Order tidak ditemukan." }, { status: 404 });
    }

    if (po.supplier_id !== user.supplier_id) {
      return NextResponse.json({ error: "Akses ditolak. PO ini bukan milik Anda." }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    // Supplier HANYA boleh mengubah status dari PENDING ke SHIPPED
    if (status !== "SHIPPED") {
      return NextResponse.json(
        { error: "Supplier hanya diizinkan mengubah status PO menjadi 'SHIPPED'." },
        { status: 400 }
      );
    }

    if (po.status !== "PENDING") {
      return NextResponse.json(
        { error: `Tidak bisa mengirim PO. Status saat ini: ${po.status}` },
        { status: 400 }
      );
    }

    // 3. Update status ke SHIPPED
    const updatedPo = await prisma.trxPur.update({
      where: { po_id: id },
      data: { status: "SHIPPED" },
      include: {
        purchaseOrderDetails: {
          include: {
            item: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Status Purchase Order berhasil diubah menjadi SHIPPED.",
      data: updatedPo
    });
  } catch (error: any) {
    console.error("Supplier PO PUT Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status PO: " + error.message },
      { status: 500 }
    );
  }
}
