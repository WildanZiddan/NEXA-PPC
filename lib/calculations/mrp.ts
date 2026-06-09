import prisma from "@/lib/prisma";

// Map item codes to lead times (days)
export function getLeadTimeDays(itemCode: string): number {
  if (itemCode === "MTB-200") return 1;
  if (itemCode === "FRM-01") return 2;
  if (itemCode === "WHL-02") return 1;
  if (itemCode === "ALT-03") return 5;
  if (itemCode === "RIM-06") return 3;
  if (itemCode === "SPK-04") return 3;
  if (itemCode === "HUB-05") return 3;
  if (itemCode === "TIR-07") return 3;
  return 1; // Default fallback
}

// Map item codes to safety stock
export function getSafetyStock(itemCode: string): number {
  // Kita set default safety stock ke 0 sesuai spesifikasi awal, dapat disesuaikan jika perlu
  return 0; 
}

export interface MrpResultNode {
  mps_id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  item_type: string;
  unit: string;
  gross_requirement: number;
  net_requirement: number;
  safety_stock: number;
  due_date: Date;
  order_release_date: Date;
  status: string;
}

export async function explodeBOM(
  mpsId: string,
  itemId: string,
  grossRequirement: number,
  dueDate: Date,
  results: MrpResultNode[] = []
): Promise<MrpResultNode[]> {
  // 1. Get Item details
  const item = await prisma.mstIte.findUnique({
    where: { item_id: itemId }
  });
  if (!item) return results;

  // 2. Get current stock level from latest inventory ledger
  const latestInv = await prisma.trxInv.findFirst({
    where: { item_id: itemId },
    orderBy: { created_at: "desc" }
  });
  const currentStock = latestInv ? latestInv.current_stock : 0;

  // 3. Calculate netting
  const safetyStock = getSafetyStock(item.item_code);
  const netRequirement = Math.max(0, grossRequirement - currentStock + safetyStock);

  // 4. Calculate lead time and offsetting (subtracting days from due date)
  const leadTime = getLeadTimeDays(item.item_code);
  const orderReleaseDate = new Date(dueDate.getTime() - leadTime * 24 * 60 * 60 * 1000);

  // 5. Add to results list
  results.push({
    mps_id: mpsId,
    item_id: itemId,
    item_code: item.item_code,
    item_name: item.item_name,
    item_type: item.item_type,
    unit: item.unit,
    gross_requirement: grossRequirement,
    net_requirement: netRequirement,
    safety_stock: safetyStock,
    due_date: dueDate,
    order_release_date: orderReleaseDate,
    status: "PLANNED"
  });

  // Jika net requirement adalah 0, maka tidak perlu meledakkan (explode) anak-anaknya
  if (netRequirement <= 0) {
    return results;
  }

  // 6. Temukan anak-anaknya di tabel MST_BOM
  const boms = await prisma.mstBom.findMany({
    where: { parent_item_id: itemId }
  });

  for (const bom of boms) {
    const childGross = netRequirement * bom.quantity_needed;
    // Tanggal jatuh tempo (due_date) anak adalah tanggal rilis pesanan (order_release_date) induknya
    await explodeBOM(mpsId, bom.child_item_id, childGross, orderReleaseDate, results);
  }

  return results;
}
