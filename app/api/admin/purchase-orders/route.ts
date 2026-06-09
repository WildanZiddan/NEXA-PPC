import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pos = await prisma.trxPur.findMany({
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
    return NextResponse.json({ data: pos });
  } catch (error: any) {
    console.error("Admin PO GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data PO: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier_id, items } = body; // items: Array of { item_id, quantity }

    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Parameter supplier_id dan daftar items wajib disertakan." },
        { status: 400 }
      );
    }

    const newPO = await prisma.$transaction(async (tx) => {
      // 1. Buat header PO
      const header = await tx.trxPur.create({
        data: {
          supplier_id,
          po_date: new Date(),
          status: "PENDING",
        },
      });

      // 2. Buat detail items
      for (const item of items) {
        await tx.trxPod.create({
          data: {
            po_id: header.po_id,
            item_id: item.item_id,
            quantity_ordered: parseFloat(item.quantity),
          },
        });
      }

      return tx.trxPur.findUnique({
        where: { po_id: header.po_id },
        include: {
          supplier: true,
          purchaseOrderDetails: {
            include: {
              item: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      { message: "Purchase Order berhasil dirilis ke Supplier.", data: newPO },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Admin PO POST Error:", error);
    return NextResponse.json(
      { error: "Gagal merilis PO: " + error.message },
      { status: 500 }
    );
  }
}
