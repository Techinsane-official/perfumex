#!/usr/bin/env tsx

import { execSync } from "child_process";
import { env } from "../lib/env";

console.log("🧪 Test Build Script gestart...\n");

// Check environment variables
console.log("📦 Environment Variables Check:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   DATABASE_URL: ${env.DATABASE_URL ? "✅ Aanwezig" : "❌ Ontbreekt"}`);
console.log(`   NEXTAUTH_SECRET: ${env.NEXTAUTH_SECRET ? "✅ Aanwezig" : "❌ Ontbreekt"}`);
console.log(`   SUPABASE_URL: ${env.SUPABASE_URL ? "✅ Aanwezig" : "❌ Ontbreekt"}`);
console.log();

// Test Prisma generate
console.log("🔧 Testing Prisma generate...");
try {
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✅ Prisma generate successful\n");
} catch (error) {
  console.error("❌ Prisma generate failed:", error);
  process.exit(1);
}

// Test Next.js build (type check only)
console.log("🏗️ Testing Next.js type checking...");
try {
  execSync("npx tsc --noEmit", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✅ Next.js type check successful\n");
} catch (error) {
  console.error("❌ Next.js type check failed:", error);
  process.exit(1);
}

console.log("🎉 All build tests passed! Ready for Netlify deployment.");
