import { prisma } from "@/lib/prisma";

async function deleteAllProducts() {
  try {
    const count = await prisma.product.count();
    console.log(`⚠️ Er zijn momenteel ${count} producten in de database.`);

    if (count === 0) {
      console.log("✅ Geen producten om te verwijderen.");
      return;
    }

    const deleted = await prisma.product.deleteMany({});
    console.log(`🗑️ ${deleted.count} producten succesvol verwijderd.`);
  } catch (error) {
    console.error("❌ Fout bij verwijderen van producten:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Direct uitvoeren zonder veiligheidsvraag
deleteAllProducts();
