import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.mstIte.findMany({
      orderBy: {
        item_code: "asc",
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Items API GET Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data items: " + error.message },
      { status: 500 }
    );
  }
}
