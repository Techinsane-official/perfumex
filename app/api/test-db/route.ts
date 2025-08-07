import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("🔍 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // Test a simple query
    const result = await prisma.product.count();
    console.log("✅ Database query successful, product count:", result);
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      productCount: result 
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      },
      { status: 500 }
    );
  }
} 