import { prisma } from "@/lib/prisma";

interface DatabaseResult {
  current_database: string;
}

interface ProductSample {
  id: string;
  name: string;
  brand: string;
  ean: string;
}

async function safeCleanup() {
  console.log("🧹 Safe Cleanup gestart...\n");

  try {
    // 1. Actieve database ophalen
    const dbNameResult = (await prisma.$queryRawUnsafe(
      `SELECT current_database();`,
    )) as DatabaseResult[];
    const dbName = dbNameResult[0]?.current_database;
    console.log(`📍 Verbonden met database: ${dbName}`);

    // 2. Veiligheidscontrole
    const lower = dbName?.toLowerCase() ?? "";
    const isSafe =
      lower.includes("test") ||
      lower.includes("localhost") ||
      lower.includes("dev") ||
      lower.includes("development") ||
      lower.includes("local");

    console.log(`🔒 Database type detectie: ${isSafe ? "🧪 Test/Development" : "🚨 Production"}`);

    if (!isSafe) {
      console.error("❌ STOP: Dit is géén testdatabase. Cleanup afgebroken.");
      console.error(
        "💡 Veilige databases bevatten: 'test', 'localhost', 'dev', 'development', 'local'",
      );
      console.error(`   Huidige database: ${dbName}`);
      return;
    }

    // 3. Toon aantal producten voor verwijdering
    const productCount = await prisma.product.count();
    console.log(`📊 Aantal producten dat verwijderd wordt: ${productCount}`);

    if (productCount === 0) {
      console.log("✅ Geen producten om te verwijderen. Database is al leeg.");
      return;
    }

    // 4. Laatste veiligheidscheck - toon voorbeeldproducten
    const sampleProducts = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        brand: true,
        ean: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("📋 Voorbeeldproducten die verwijderd worden:");
    sampleProducts.forEach((p: ProductSample, i: number) => {
      console.log(`  ${i + 1}. ${p.name} (${p.brand}) - EAN: ${p.ean}`);
    });

    // 5. Verwijder producten
    console.log("\n🧹 Producten verwijderen...");
    const deleted = await prisma.product.deleteMany({});
    console.log(`✅ ${deleted.count} producten succesvol verwijderd.`);

    // 6. Verificatie
    const remainingCount = await prisma.product.count();
    console.log(`📦 Resterende producten in database: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log("🎉 Cleanup succesvol voltooid! Database is nu leeg.");
    } else {
      console.warn(
        "⚠️  Er zijn nog producten in de database. Mogelijk zijn er constraints of errors.",
      );
    }
  } catch (error: unknown) {
    console.error("❌ Fout tijdens cleanup:", error);
    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Verbinding gesloten.");
  }
}

safeCleanup();
