import { prisma } from "@/lib/prisma";
import readline from "readline";

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

// 🔒 Extra Beveiliging met veiligheidsvraag
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Weet je zeker dat je ALLE producten wilt verwijderen? (ja/nee): ",
  async (antwoord) => {
    if (antwoord.toLowerCase() === "ja") {
      await deleteAllProducts();
    } else {
      console.log("⛔ Actie geannuleerd.");
    }
    rl.close();
  },
);
