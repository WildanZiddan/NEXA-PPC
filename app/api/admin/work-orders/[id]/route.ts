import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processCompletedWO } from "@/lib/services/inventory";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const wo = await prisma.trxWoo.findUnique({
      where: { wo_id: id }
    });

    if (!wo) {
      return NextResponse.json({ error: "Work Order tidak ditemukan." }, { status: 404 });
    }

    if (status === "COMPLETED") {
      // Panggil ledger automation service yang telah kita buat di Langkah 5!
      await processCompletedWO(id);

      const updatedWo = await prisma.trxWoo.findUnique({
        where: { wo_id: id },
        include: {
          item: true,
          workCenter: true,
        }
      });

      return NextResponse.json({
        message: "Work Order selesai rakit. Komponen telah dikonsumsi dan barang jadi bertambah!",
        data: updatedWo
      });
    }

    const updatedWo = await prisma.trxWoo.update({
      where: { wo_id: id },
      data: { status },
      include: {
        item: true,
        workCenter: true,
      }
    });

    return NextResponse.json({
      message: `Status WO berhasil diubah menjadi ${status}.`,
      data: updatedWo
    });

  } catch (error: any) {
    console.error("Admin WO PUT Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status WO: " + error.message },
      { status: 500 }
    );
  }
}
