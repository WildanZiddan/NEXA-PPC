import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const ledgers = await prisma.trxInv.findMany({
      include: {
        item: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({ data: ledgers });
  } catch (error: any) {
    console.error("Inventory Ledger GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kartu stok: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { item_id, transaction_type, quantity } = body;

    if (!item_id || !transaction_type || quantity === undefined) {
      return NextResponse.json(
        { error: "Parameter item_id, transaction_type, dan quantity wajib diisi." },
        { status: 400 }
      );
    }

    if (!["IN_PO", "OUT_WO", "ADJUSTMENT"].includes(transaction_type)) {
      return NextResponse.json(
        { error: "Tipe transaksi harus salah satu dari: IN_PO, OUT_WO, ADJUSTMENT." },
        { status: 400 }
      );
    }

    // Gunakan transaksi agar perhitungan stok berjalan akurat
    const ledger = await prisma.$transaction(async (tx) => {
      const latestLedger = await tx.trxInv.findFirst({
        where: { item_id },
        orderBy: { created_at: "desc" }
      });

      const previousStock = latestLedger ? latestLedger.current_stock : 0;
      const parsedQty = parseFloat(quantity);
      const newStock = previousStock + parsedQty;

      return tx.trxInv.create({
        data: {
          item_id,
          transaction_type,
          quantity: parsedQty,
          current_stock: newStock,
        },
        include: {
          item: true,
        }
      });
    });

    return NextResponse.json(
      { message: "Penyesuaian stok berhasil disimpan.", data: ledger },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Inventory Ledger POST Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses penyesuaian stok: " + error.message },
      { status: 500 }
    );
  }
}
