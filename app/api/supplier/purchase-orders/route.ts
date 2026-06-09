import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
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

    // 2. Query PO khusus milik supplier_id ini
    const purchaseOrders = await prisma.trxPur.findMany({
      where: {
        supplier_id: user.supplier_id,
      },
      include: {
        supplier: true,
        purchaseOrderDetails: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        po_date: "desc",
      },
    });

    return NextResponse.json({ data: purchaseOrders });
  } catch (error: any) {
    console.error("Supplier PO GET Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses data PO: " + error.message },
      { status: 500 }
    );
  }
}
