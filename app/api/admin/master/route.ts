import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [itemsRaw, boms, workCenters] = await Promise.all([
      prisma.mstIte.findMany({ orderBy: { item_code: "asc" } }),
      prisma.mstBom.findMany({
        include: {
          parentItem: true,
          childItem: true,
        },
        orderBy: {
          parentItem: {
            item_code: "asc",
          },
        },
      }),
      prisma.mstWor.findMany({ orderBy: { work_center_name: "asc" } }),
    ]);

    // Ambil stok terbaru untuk masing-masing item dari ledger inventory
    const items = await Promise.all(
      itemsRaw.map(async (item) => {
        const latestLedger = await prisma.trxInv.findFirst({
          where: { item_id: item.item_id },
          orderBy: { created_at: "desc" },
          select: { current_stock: true }
        });
        return {
          ...item,
          current_stock: latestLedger ? latestLedger.current_stock : 0,
        };
      })
    );

    return NextResponse.json({
      items,
      boms,
      workCenters,
    });
  } catch (error: any) {
    console.error("Master Data API GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data master: " + error.message },
      { status: 500 }
    );
  }
}
