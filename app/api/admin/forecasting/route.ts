import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to format Date to YYYY-MM
function toYearMonth(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// Helper to subtract months from a date
function subMonths(date: Date, months: number): Date {
  const newDate = new Date(date.getTime());
  newDate.setUTCMonth(newDate.getUTCMonth() - months);
  return newDate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("item_id");
    const targetDateParam = searchParams.get("target_date");

    if (!itemId) {
      return NextResponse.json(
        { error: "Parameter item_id wajib disertakan." },
        { status: 400 }
      );
    }

    if (!targetDateParam) {
      return NextResponse.json(
        { error: "Parameter target_date wajib disertakan (Format: YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    const targetDate = new Date(targetDateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Format target_date tidak valid." },
        { status: 400 }
      );
    }

    // Awal bulan target peramalan (diset ke tanggal 1 pukul 00:00:00 UTC)
    const targetStartOfMonth = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1)
    );

    // 1. Ambil seluruh transaksi inventory untuk item tersebut
    const transactions = await prisma.trxInv.findMany({
      where: {
        item_id: itemId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // 2. Kelompokkan actual demand (mutasi keluar, quantity < 0) per bulan
    // Simpan dalam Map: "YYYY-MM" -> total_demand (absolut)
    const monthlyDemandMap = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.quantity < 0) {
        const key = toYearMonth(new Date(tx.created_at));
        const val = Math.abs(tx.quantity);
        monthlyDemandMap.set(key, (monthlyDemandMap.get(key) || 0) + val);
      }
    });

    // Dapatkan data historis yang diurutkan secara kronologis
    const sortedPeriods: { period: string; demand: number }[] = [];
    
    // Temukan range bulan dari transaksi pertama hingga bulan sebelum target
    if (transactions.length > 0) {
      const firstTxDate = new Date(transactions[0].created_at);
      let currentPeriod = new Date(
        Date.UTC(firstTxDate.getUTCFullYear(), firstTxDate.getUTCMonth(), 1)
      );

      while (currentPeriod < targetStartOfMonth) {
        const key = toYearMonth(currentPeriod);
        sortedPeriods.push({
          period: key,
          demand: monthlyDemandMap.get(key) || 0,
        });
        currentPeriod.setUTCMonth(currentPeriod.getUTCMonth() + 1);
      }
    }

    // 3. Hitung 3-Month Moving Average (MA-3)
    // Butuh demand dari 3 bulan persis sebelum targetStartOfMonth:
    // M-1, M-2, M-3
    let ma3Value = 0;
    const m1Key = toYearMonth(subMonths(targetStartOfMonth, 1));
    const m2Key = toYearMonth(subMonths(targetStartOfMonth, 2));
    const m3Key = toYearMonth(subMonths(targetStartOfMonth, 3));

    const d1 = monthlyDemandMap.get(m1Key) || 0;
    const d2 = monthlyDemandMap.get(m2Key) || 0;
    const d3 = monthlyDemandMap.get(m3Key) || 0;

    ma3Value = (d1 + d2 + d3) / 3;

    // 4. Hitung Exponential Smoothing (alpha = 0.3)
    // Rumus: F_t = alpha * D_{t-1} + (1 - alpha) * F_{t-1}
    const alpha = 0.3;
    let esValue = 0;

    if (sortedPeriods.length > 0) {
      // Inisialisasi peramalan pertama (F_1) = demand pertama (D_1)
      let currentForecast = sortedPeriods[0].demand;
      
      // Hitung berantai untuk bulan-bulan berikutnya
      for (let i = 1; i < sortedPeriods.length; i++) {
        const prevDemand = sortedPeriods[i - 1].demand;
        currentForecast = alpha * prevDemand + (1 - alpha) * currentForecast;
      }
      
      // Untuk bulan target (F_target), gunakan demand bulan terakhir di history
      const lastDemand = sortedPeriods[sortedPeriods.length - 1].demand;
      esValue = alpha * lastDemand + (1 - alpha) * currentForecast;
    }

    return NextResponse.json({
      item_id: itemId,
      target_period: toYearMonth(targetStartOfMonth),
      historical_demands: sortedPeriods,
      forecasts: {
        moving_average_3: parseFloat(ma3Value.toFixed(2)),
        exponential_smoothing: parseFloat(esValue.toFixed(2)),
      },
      source_details: {
        [m1Key]: d1,
        [m2Key]: d2,
        [m3Key]: d3,
      }
    });
  } catch (error: any) {
    console.error("Forecasting GET Error:", error);
    return NextResponse.json(
      { error: "Gagal menghitung peramalan: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { item_id, period_date, quantity_forecast } = body;

    if (!item_id || !period_date || quantity_forecast === undefined) {
      return NextResponse.json(
        { error: "Data item_id, period_date, dan quantity_forecast wajib diisi." },
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

    // Simpan ke tabel TRX_FOR
    const forecast = await prisma.trxFor.create({
      data: {
        item_id,
        period_date: parsedDate,
        quantity_forecast: Math.round(parseFloat(quantity_forecast)),
      },
    });

    return NextResponse.json(
      { message: "Peramalan berhasil disimpan.", data: forecast },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Forecasting POST Error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan peramalan: " + error.message },
      { status: 500 }
    );
  }
}
