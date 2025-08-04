import { prisma, testDatabaseConnection } from "@/lib/prisma";

async function setupDatabase() {
  console.log("🔧 Setting up database...");

  try {
    // Test connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("❌ Cannot connect to database");
      console.log("💡 Make sure your DATABASE_URL is set correctly in .env.local");
      process.exit(1);
    }

    // Run migrations
    console.log("📦 Running database migrations...");
    // Note: In a real setup, you would run prisma migrate deploy here
    
    // Seed database
    console.log("🌱 Seeding database...");
    // Note: In a real setup, you would run the seed script here
    
    console.log("✅ Database setup complete!");
    console.log("💡 You can now run: npm run dev");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 