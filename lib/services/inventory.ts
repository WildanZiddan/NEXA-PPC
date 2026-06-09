import prisma from "@/lib/prisma";

/**
 * Memproses penerimaan Purchase Order (PO).
 * Menambahkan stok ke kartu persediaan untuk setiap item yang dipesan.
 */
export async function processReceivedPO(poId: string) {
  // Gunakan transaksi prisma agar atomik
  return await prisma.$transaction(async (tx) => {
    // 1. Get the PO details
    const po = await tx.trxPur.findUnique({
      where: { po_id: poId },
      include: {
        purchaseOrderDetails: true
      }
    });

    if (!po) {
      throw new Error("Purchase Order tidak ditemukan.");
    }

    // Hanya proses jika belum RECEIVED
    if (po.status === "RECEIVED") {
      return { message: "PO sudah berstatus RECEIVED sebelumnya." };
    }

    // 2. Update status PO menjadi RECEIVED jika belum diupdate
    await tx.trxPur.update({
      where: { po_id: poId },
      data: { status: "RECEIVED" }
    });

    // 3. Tambahkan stok (IN_PO) untuk setiap item
    for (const detail of po.purchaseOrderDetails) {
      const latestLedger = await tx.trxInv.findFirst({
        where: { item_id: detail.item_id },
        orderBy: { created_at: "desc" }
      });

      const previousStock = latestLedger ? latestLedger.current_stock : 0;
      const newStock = previousStock + detail.quantity_ordered;

      await tx.trxInv.create({
        data: {
          item_id: detail.item_id,
          transaction_type: "IN_PO",
          quantity: detail.quantity_ordered,
          current_stock: newStock
        }
      });
    }

    return { message: "Proses penerimaan PO dan mutasi stok selesai." };
  });
}

/**
 * Memproses penyelesaian Work Order (WO).
 * 1. Mengurangi stok komponen yang digunakan (OUT_WO).
 * 2. Menambahkan stok barang jadi yang dirakit (ADJUSTMENT).
 */
export async function processCompletedWO(woId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Dapatkan detail Work Order
    const wo = await tx.trxWoo.findUnique({
      where: { wo_id: woId }
    });

    if (!wo) {
      throw new Error("Work Order tidak ditemukan.");
    }

    // Hanya proses jika belum COMPLETED
    if (wo.status === "COMPLETED") {
      return { message: "WO sudah berstatus COMPLETED sebelumnya." };
    }

    // 2. Update status WO menjadi COMPLETED
    await tx.trxWoo.update({
      where: { wo_id: woId },
      data: { status: "COMPLETED" }
    });

    // 3. Konsumsi Komponen/Raw Material dari BOM Level 1 (OUT_WO)
    const boms = await tx.mstBom.findMany({
      where: { parent_item_id: wo.item_id },
      include: {
        childItem: true
      }
    });

    const insufficientItems = [];

    for (const bom of boms) {
      const qtyNeeded = wo.quantity_to_produce * bom.quantity_needed;

      const latestLedger = await tx.trxInv.findFirst({
        where: { item_id: bom.child_item_id },
        orderBy: { created_at: "desc" }
      });

      const previousStock = latestLedger ? latestLedger.current_stock : 0;
      
      if (previousStock < qtyNeeded) {
        insufficientItems.push({
          name: bom.childItem.item_name,
          code: bom.childItem.item_code,
          unit: bom.childItem.unit,
          current: previousStock,
          needed: qtyNeeded,
          deficit: qtyNeeded - previousStock
        });
      }
    }

    if (insufficientItems.length > 0) {
      const details = insufficientItems
        .map(
          (item) =>
            `• ${item.name} (${item.code}): Stok ${item.current} ${item.unit}, Butuh ${item.needed} ${item.unit} (Kurang ${item.deficit} ${item.unit})`
        )
        .join("\n");
      throw new Error(
        `Stok material tidak mencukupi untuk memproduksi. Silakan memesan/merakit komponen berikut terlebih dahulu:\n${details}`
      );
    }

    // Konsumsi komponen setelah divalidasi aman semuanya
    for (const bom of boms) {
      const qtyNeeded = wo.quantity_to_produce * bom.quantity_needed;

      const latestLedger = await tx.trxInv.findFirst({
        where: { item_id: bom.child_item_id },
        orderBy: { created_at: "desc" }
      });

      const previousStock = latestLedger ? latestLedger.current_stock : 0;
      const newStock = previousStock - qtyNeeded;

      await tx.trxInv.create({
        data: {
          item_id: bom.child_item_id,
          transaction_type: "OUT_WO",
          quantity: -qtyNeeded, // Bernilai negatif untuk pengurangan stok
          current_stock: newStock
        }
      });
    }

    // 4. Tambah Stok Item Hasil Produksi (ADJUSTMENT)
    const latestParentLedger = await tx.trxInv.findFirst({
      where: { item_id: wo.item_id },
      orderBy: { created_at: "desc" }
    });

    const previousParentStock = latestParentLedger ? latestParentLedger.current_stock : 0;
    const newParentStock = previousParentStock + wo.quantity_to_produce;

    await tx.trxInv.create({
      data: {
        item_id: wo.item_id,
        transaction_type: "ADJUSTMENT",
        quantity: wo.quantity_to_produce, // Bernilai positif untuk penambahan stok
        current_stock: newParentStock
      }
    });

    return { message: "Proses penyelesaian WO, konsumsi bahan baku, dan mutasi barang jadi selesai." };
  });
}
