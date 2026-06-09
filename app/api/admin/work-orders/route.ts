import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const wos = await prisma.trxWoo.findMany({
      include: {
        item: true,
        workCenter: true,
      },
      orderBy: {
        start_date: "desc",
      },
    });
    return NextResponse.json({ data: wos });
  } catch (error: any) {
    console.error("Admin WO GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data WO: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { item_id, work_center_id, quantity_to_produce, start_date, end_date } = body;

    if (!item_id || !work_center_id || !quantity_to_produce || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Semua parameter WO wajib diisi." },
        { status: 400 }
      );
    }

    const newWO = await prisma.trxWoo.create({
      data: {
        item_id,
        work_center_id,
        quantity_to_produce: parseFloat(quantity_to_produce),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: "PLANNED",
      },
      include: {
        item: true,
        workCenter: true,
      }
    });

    return NextResponse.json(
      { message: "Work Order perakitan berhasil dibuat.", data: newWO },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Admin WO POST Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat WO baru: " + error.message },
      { status: 500 }
    );
  }
}
