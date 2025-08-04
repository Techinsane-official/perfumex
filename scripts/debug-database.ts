import { prisma } from "@/lib/prisma";

interface DatabaseResult {
  current_database: string;
}

interface DatabaseListResult {
  datname: string;
}

interface ProductInfo {
  id: string;
  name: string;
  brand: string;
  ean: string;
  createdAt: Date;
}

async function debugDatabaseConnection() {
  console.log("🔍 Database Debug gestart...\n");

  try {
    // ✅ Toon de waarde van DATABASE_URL
    console.log("📦 DATABASE_URL uit process.env:");
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Mask sensitive parts of the URL
      const maskedUrl = dbUrl.replace(/(:\/\/[^:]+:)[^@]+(@)/, "$1***$2");
      console.log(`✅ ${maskedUrl}`);
    } else {
      console.log("❌ Niet ingesteld");
    }
    console.log();

    // ✅ Query: actieve database
    const dbNameResult = (await prisma.$queryRawUnsafe(
      `SELECT current_database();`,
    )) as DatabaseResult[];
    const dbName = dbNameResult[0]?.current_database;
    console.log(`📍 Actieve database volgens query: ${dbName}`);

    // ✅ Query: toon alle databases op server
    const allDbs = (await prisma.$queryRawUnsafe(
      `SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;`,
    )) as DatabaseListResult[];

    console.log("🗂️ Alle databases op deze server:");
    allDbs.forEach((db) => {
      const isActive = db.datname === dbName;
      const marker = isActive ? "📍" : "  ";
      console.log(`${marker} ${db.datname}`);
    });
    console.log();

    // ✅ Toon aantal producten en eerste 5
    const allProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        brand: true,
        ean: true,
        createdAt: true,
      },
    });

    const total = await prisma.product.count();
    console.log(`🧾 Aantal producten in database: ${total}`);

    if (allProducts.length > 0) {
      console.log("📋 Voorbeeldproducten:");
      allProducts.forEach((p: ProductInfo, i: number) => {
        console.log(`  ${i + 1}. ${p.name} (${p.brand}) – EAN: ${p.ean}`);
        console.log(`     ID: ${p.id} | Aangemaakt: ${p.createdAt.toLocaleString("nl-NL")}`);
      });
    } else {
      console.log("📭 Geen producten gevonden.");
    }

    // ✅ Detectie: is dit een test-/devdatabase?
    const lower = dbName?.toLowerCase() ?? "";
    const isTestDb =
      lower.includes("test") ||
      lower.includes("localhost") ||
      lower.includes("dev") ||
      lower.includes("development") ||
      lower.includes("local");

    console.log("\n🔐 Database Type Detectie:");
    if (isTestDb) {
      console.log("✅ Je werkt in een TEST/DEV database. Verwijderen is veilig.");
      console.log(
        `   Database naam bevat: ${lower.includes("test") ? "test" : ""}${lower.includes("dev") ? "dev" : ""}${lower.includes("localhost") ? "localhost" : ""}`,
      );
    } else {
      console.log("❗ Waarschuwing: Je zit NIET in een testdatabase. Verwijder hier GEEN data.");
      console.log(
        "💡 Voor veilige cleanup, gebruik een database met 'test', 'dev', 'localhost' in de naam.",
      );
    }

    // ✅ Extra veiligheidscontroles
    console.log("\n🛡️ Veiligheidscontroles:");
    console.log(`   Database naam: ${dbName}`);
    console.log(`   Is test database: ${isTestDb ? "Ja" : "Nee"}`);
    console.log(`   Aantal databases op server: ${allDbs.length}`);
    console.log(`   Producten in database: ${total}`);

    // ✅ Aanbevelingen
    console.log("\n💡 Aanbevelingen:");
    if (total > 0 && !isTestDb) {
      console.log("⚠️  Je hebt producten in een productie-achtige database.");
      console.log("   Overweeg om te werken met een test database voor development.");
    } else if (total === 0 && isTestDb) {
      console.log("✅ Test database is leeg. Klaar voor development.");
    } else if (total > 0 && isTestDb) {
      console.log("✅ Test database heeft data. Veilig om te testen.");
    }
  } catch (error: unknown) {
    console.error("❌ Fout tijdens database-debug:", error);
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

debugDatabaseConnection();
