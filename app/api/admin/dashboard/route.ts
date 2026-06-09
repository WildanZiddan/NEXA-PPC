import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [usersCount, itemsCount, forecastsCount, workOrdersCount] = await Promise.all([
      prisma.mstUsr.count(),
      prisma.mstIte.count(),
      prisma.trxFor.count(),
      prisma.trxWoo.count(),
    ]);

    // Ambil beberapa data work order terbaru
    const recentWorkOrders = await prisma.trxWoo.findMany({
      take: 5,
      orderBy: { start_date: "desc" },
      include: {
        item: true,
        workCenter: true,
      }
    });

    // Ambil histori mutasi stok terbaru
    const recentInventory = await prisma.trxInv.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        item: true
      }
    });

    // Ambil histori mutasi 6 bulan terakhir untuk grafik
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const inventoryTransactions = await prisma.trxInv.findMany({
      where: {
        created_at: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        created_at: "asc"
      }
    });

    // Kelompokkan per bulan (Format: YYYY-MM)
    const monthlyDataMap = new Map<string, { month: string; incoming: number; outgoing: number }>();
    
    // Inisialisasi 6 bulan terakhir agar grafik tidak kosong meskipun tidak ada transaksi
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyDataMap.set(yearMonth, { month: yearMonth, incoming: 0, outgoing: 0 });
    }

    inventoryTransactions.forEach(tx => {
      const date = new Date(tx.created_at);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyDataMap.has(yearMonth)) {
        monthlyDataMap.set(yearMonth, { month: yearMonth, incoming: 0, outgoing: 0 });
      }
      
      const val = monthlyDataMap.get(yearMonth)!;
      if (tx.transaction_type === "IN_PO" || (tx.transaction_type === "ADJUSTMENT" && tx.quantity > 0)) {
        val.incoming += tx.quantity;
      } else if (tx.transaction_type === "OUT_WO" || (tx.transaction_type === "ADJUSTMENT" && tx.quantity < 0)) {
        val.outgoing += Math.abs(tx.quantity);
      }
    });

    const chartData = Array.from(monthlyDataMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      stats: {
        usersCount,
        itemsCount,
        forecastsCount,
        workOrdersCount,
      },
      recentWorkOrders,
      recentInventory,
      chartData
    });
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik: " + error.message },
      { status: 500 }
    );
  }
}

