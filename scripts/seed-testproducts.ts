import { prisma } from "@/lib/prisma";

interface DatabaseResult {
  current_database: string;
}

async function seedTestProducts() {
  console.log("🌱 Testproduct seeding gestart...\n");

  try {
    // 1. Database detectie
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
      console.error("❌ STOP: Geen testdatabase. Seeding afgebroken.");
      console.error(
        "💡 Veilige databases bevatten: 'test', 'localhost', 'dev', 'development', 'local'",
      );
      console.error(`   Huidige database: ${dbName}`);
      return;
    }

    // 3. Controleer bestaande producten
    const existingCount = await prisma.product.count();
    console.log(`📊 Bestaande producten in database: ${existingCount}`);

    // 4. Testproducten definiëren
    const testProducts = [
      {
        name: "Testproduct 1",
        brand: "Demo Merk A",
        content: "100ml",
        ean: "9990000000001",
        purchasePrice: 5.0,
        retailPrice: 9.95,
        stockQuantity: 50,
        description: "Dit is een testproduct 1 voor development en testing.",
        isActive: true,
      },
      {
        name: "Testproduct 2",
        brand: "Demo Merk B",
        content: "250ml",
        ean: "9990000000002",
        purchasePrice: 8.5,
        retailPrice: 14.99,
        stockQuantity: 30,
        description: "Dit is een testproduct 2 voor development en testing.",
        isActive: true,
      },
      {
        name: "Testproduct 3",
        brand: "Demo Merk C",
        content: "50ml",
        ean: "9990000000003",
        purchasePrice: 3.25,
        retailPrice: 7.5,
        stockQuantity: 100,
        description: "Dit is een testproduct 3 voor development en testing.",
        isActive: true,
      },
    ];

    console.log("📋 Testproducten die worden toegevoegd:");
    testProducts.forEach((product, i) => {
      console.log(`  ${i + 1}. ${product.name} (${product.brand})`);
      console.log(`     EAN: ${product.ean} | Inhoud: ${product.content}`);
      console.log(
        `     Inkoopprijs: €${product.purchasePrice} | Verkoopprijs: €${product.retailPrice}`,
      );
      console.log(`     Voorraad: ${product.stockQuantity} stuks`);
      console.log("");
    });

    // 5. Controleer voor duplicaten
    const existingEans = await prisma.product.findMany({
      where: {
        ean: {
          in: testProducts.map((p) => p.ean),
        },
      },
      select: { ean: true },
    });

    if (existingEans.length > 0) {
      console.warn("⚠️  Waarschuwing: De volgende EAN's bestaan al:");
      existingEans.forEach((ean: { ean: string }) => console.log(`   - ${ean.ean}`));
      console.log("💡 Bestaande producten worden NIET overschreven.");
    }

    // 6. Voeg testproducten toe
    console.log("🌱 Testproducten toevoegen...");
    const created = await prisma.product.createMany({
      data: testProducts,
      skipDuplicates: true, // Skip als EAN al bestaat
    });

    console.log(`✅ ${created.count} testproducten succesvol toegevoegd.`);

    // 7. Verificatie
    const newCount = await prisma.product.count();
    console.log(`📦 Totaal aantal producten in database: ${newCount}`);
    console.log(`📈 Nieuwe producten toegevoegd: ${newCount - existingCount}`);

    if (created.count === testProducts.length) {
      console.log("🎉 Alle testproducten succesvol toegevoegd!");
    } else if (created.count > 0) {
      console.log("✅ Sommige testproducten toegevoegd (sommige bestonden al).");
    } else {
      console.log("ℹ️  Geen nieuwe producten toegevoegd (alleen bestaande EAN's).");
    }
  } catch (error: unknown) {
    console.error("❌ Fout tijdens seeding:", error);
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

seedTestProducts();
