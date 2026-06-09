import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processReceivedPO } from "@/lib/services/inventory";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const po = await prisma.trxPur.findUnique({
      where: { po_id: id }
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase Order tidak ditemukan." }, { status: 404 });
    }

    if (status === "RECEIVED") {
      // Panggil ledger automation service yang telah kita buat di Langkah 5!
      await processReceivedPO(id);
      
      const updatedPo = await prisma.trxPur.findUnique({
        where: { po_id: id },
        include: {
          supplier: true,
          purchaseOrderDetails: {
            include: { item: true }
          }
        }
      });

      return NextResponse.json({
        message: "Barang PO sukses diterima. Kartu stok terupdate!",
        data: updatedPo
      });
    }

    // Update status biasa (misal admin mau update ke SHIPPED secara manual)
    const updatedPo = await prisma.trxPur.update({
      where: { po_id: id },
      data: { status },
      include: {
        supplier: true,
        purchaseOrderDetails: {
          include: { item: true }
        }
      }
    });

    return NextResponse.json({
      message: `Status PO berhasil diubah menjadi ${status}.`,
      data: updatedPo
    });

  } catch (error: any) {
    console.error("Admin PO PUT Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status PO: " + error.message },
      { status: 500 }
    );
  }
}
