import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const mpsList = await prisma.trxMps.findMany({
      include: {
        item: true,
        aggregatePlan: true,
      },
      orderBy: {
        due_date: "asc",
      },
    });

    return NextResponse.json({ data: mpsList });
  } catch (error: any) {
    console.error("MPS GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data MPS: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aggregate_id, item_id, due_date, quantity_demanded } = body;

    if (!aggregate_id || !item_id || !due_date || quantity_demanded === undefined) {
      return NextResponse.json(
        { error: "Parameter aggregate_id, item_id, due_date, dan quantity_demanded wajib diisi." },
        { status: 400 }
      );
    }

    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Format due_date tidak valid." },
        { status: 400 }
      );
    }

    const mps = await prisma.trxMps.create({
      data: {
        aggregate_id,
        item_id,
        due_date: parsedDate,
        quantity_demanded: parseFloat(quantity_demanded),
      },
      include: {
        item: true,
        aggregatePlan: true,
      }
    });

    return NextResponse.json(
      { message: "Master Production Schedule (MPS) berhasil dibuat.", data: mps },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("MPS POST Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat MPS: " + error.message },
      { status: 500 }
    );
  }
}
