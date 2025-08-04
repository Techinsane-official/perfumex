import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Check if this is a secure request (you can add authentication here)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.NEXTAUTH_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting database seed...");
    
    // Run the seed command
    const { stdout, stderr } = await execAsync("npx prisma db seed");
    
    console.log("Seed output:", stdout);
    if (stderr) {
      console.error("Seed errors:", stderr);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database seeded successfully",
      output: stdout 
    });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ 
      error: "Failed to seed database", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Use POST method to trigger database seed",
    endpoint: "/api/seed"
  });
} 