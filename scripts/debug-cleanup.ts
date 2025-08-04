import { prisma } from "@/lib/prisma";

interface DatabaseResult {
  current_database: string;
}

interface ProductInfo {
  id: string;
  name: string;
  ean: string;
  brand: string;
  createdAt: Date;
}

async function runDebugAndCleanup() {
  try {
    console.log("🔍 Database Debug & Cleanup gestart...\n");

    // ✅ Toon actieve database
    const dbNameResult = (await prisma.$queryRawUnsafe(
      `SELECT current_database();`,
    )) as DatabaseResult[];
    const dbName = dbNameResult[0]?.current_database;
    console.log(`📍 Verbonden met database: ${dbName}`);

    // ✅ Controleer database type
    const isTestDb =
      dbName?.toLowerCase().includes("test") ||
      dbName?.includes("localhost") ||
      dbName?.includes("dev") ||
      dbName?.includes("development");

    console.log(`🔒 Database type: ${isTestDb ? "🧪 Test/Development" : "🚨 Production"}`);

    // ✅ Toon alle producten
    const producten = await prisma.product.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        ean: true,
        brand: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`\n🧾 Aantal producten gevonden: ${producten.length}`);

    if (producten.length > 0) {
      console.log("📋 Producten overzicht:");
      producten.forEach((p: ProductInfo, i: number) => {
        console.log(`  ${i + 1}. ${p.name} (${p.brand})`);
        console.log(`     EAN: ${p.ean} | ID: ${p.id}`);
        console.log(`     Aangemaakt: ${p.createdAt.toLocaleString("nl-NL")}`);
        console.log("");
      });
    } else {
      console.log("✅ Geen producten gevonden in database.");
    }

    // ✅ Optioneel: wis alle producten alleen als testdatabase
    if (!isTestDb) {
      console.warn("⚠️  Geen testdatabase gedetecteerd. Producten worden NIET verwijderd.");
      console.warn(
        "💡 Voor productie databases, gebruik handmatige cleanup of specifieke scripts.",
      );
    } else {
      console.log("\n🧹 Testdatabase bevestigd. Producten worden verwijderd...");

      // Extra veiligheidscheck voor test databases
      const totalCount = await prisma.product.count();
      console.log(`📊 Totaal aantal producten dat verwijderd wordt: ${totalCount}`);

      if (totalCount > 0) {
        const deleted = await prisma.product.deleteMany({});
        console.log(`✅ ${deleted.count} producten succesvol verwijderd.`);
      } else {
        console.log("✅ Geen producten om te verwijderen.");
      }
    }

    // ✅ Toon resultaat na verwijdering
    const resterend = await prisma.product.count();
    console.log(`\n📦 Resterende producten in database: ${resterend}`);

    // ✅ Database status samenvatting
    console.log("\n📊 Database Status Samenvatting:");
    console.log(`   Database: ${dbName}`);
    console.log(`   Type: ${isTestDb ? "Test/Development" : "Production"}`);
    console.log(`   Producten: ${resterend}`);
    console.log(`   Cleanup uitgevoerd: ${isTestDb ? "Ja" : "Nee"}`);
  } catch (error: unknown) {
    console.error("❌ Fout tijdens debug/cleanup:", error);
    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database verbinding gesloten.");
  }
}

runDebugAndCleanup();
