import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.trxAgg.findMany({
      include: {
        details: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        period_date: "desc",
      },
    });

    return NextResponse.json({ data: plans });
  } catch (error: any) {
    console.error("Aggregate GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data aggregate plan: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period_date, total_demand, production_target, strategy_used, allocations } = body;

    if (!period_date || !total_demand || !production_target || !strategy_used) {
      return NextResponse.json(
        { error: "Parameter period_date, total_demand, production_target, dan strategy_used wajib diisi." },
        { status: 400 }
      );
    }

    const parsedDate = new Date(period_date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Format period_date tidak valid." },
        { status: 400 }
      );
    }

    // Gunakan transaksi database agar tersimpan aman beserta alokasinya
    const aggregatePlan = await prisma.$transaction(async (tx) => {
      // 1. Buat header
      const header = await tx.trxAgg.create({
        data: {
          period_date: parsedDate,
          total_demand: parseFloat(total_demand),
          production_target: parseFloat(production_target),
          strategy_used,
        },
      });

      // 2. Buat detail alokasi (allocations adalah array { item_id, allocated_quantity })
      if (allocations && Array.isArray(allocations)) {
        for (const alloc of allocations) {
          await tx.trxAgd.create({
            data: {
              aggregate_id: header.aggregate_id,
              item_id: alloc.item_id,
              allocated_quantity: parseFloat(alloc.allocated_quantity),
            },
          });
        }
      }

      return tx.trxAgg.findUnique({
        where: { aggregate_id: header.aggregate_id },
        include: {
          details: {
            include: {
              item: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      { message: "Aggregate Plan berhasil dibuat.", data: aggregatePlan },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Aggregate POST Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat aggregate plan: " + error.message },
      { status: 500 }
    );
  }
}
