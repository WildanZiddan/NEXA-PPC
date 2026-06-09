import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { explodeBOM } from "@/lib/calculations/mrp";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mpsId = searchParams.get("mps_id");

    const whereClause: any = {};
    if (mpsId) {
      whereClause.mps_id = mpsId;
    }

    const mrpRecords = await prisma.trxMrp.findMany({
      where: whereClause,
      include: {
        item: true,
        mps: {
          include: {
            item: true,
          }
        }
      },
      orderBy: [
        {
          order_release_date: "asc",
        },
      ],
    });

    return NextResponse.json({ data: mrpRecords });
  } catch (error: any) {
    console.error("MRP GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data MRP: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mps_id } = body;

    if (!mps_id) {
      return NextResponse.json(
        { error: "Parameter mps_id wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Dapatkan detail MPS
    const mpsEntry = await prisma.trxMps.findUnique({
      where: { mps_id },
      include: { item: true }
    });

    if (!mpsEntry) {
      return NextResponse.json(
        { error: "Master Production Schedule (MPS) tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Hapus data MRP lama untuk mps_id ini
    await prisma.trxMrp.deleteMany({
      where: { mps_id }
    });

    // 3. Jalankan BOM Explosion
    const rawResults = await explodeBOM(
      mpsEntry.mps_id,
      mpsEntry.item_id,
      mpsEntry.quantity_demanded,
      mpsEntry.due_date
    );

    // 4. Simpan ke database
    const savedRecords = [];
    for (const record of rawResults) {
      const saved = await prisma.trxMrp.create({
        data: {
          mps_id: record.mps_id,
          item_id: record.item_id,
          gross_requirement: record.gross_requirement,
          net_requirement: record.net_requirement,
          safety_stock: record.safety_stock,
          order_release_date: record.order_release_date,
          due_date: record.due_date,
          status: record.status,
        },
        include: {
          item: true,
        }
      });
      savedRecords.push(saved);
    }

    return NextResponse.json(
      { message: "Perhitungan MRP berhasil dijalankan.", data: savedRecords },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("MRP POST Error:", error);
    return NextResponse.json(
      { error: "Gagal menjalankan perhitungan MRP: " + error.message },
      { status: 500 }
    );
  }
}
