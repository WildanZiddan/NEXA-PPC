import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodDateParam = searchParams.get("period_date");

    if (!periodDateParam) {
      return NextResponse.json({ data: [] });
    }

    const targetDate = new Date(periodDateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
    }

    // Set ke awal bulan target (tanggal 1 pukul 00:00:00 UTC)
    const startOfMonth = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1)
    );

    // Cari forecast tersimpan di TRX_FOR
    const forecasts = await prisma.trxFor.findMany({
      where: {
        period_date: startOfMonth
      },
      include: {
        item: true
      }
    });

    return NextResponse.json({ data: forecasts });
  } catch (error: any) {
    console.error("Aggregate Forecasts GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data peramalan: " + error.message },
      { status: 500 }
    );
  }
}
