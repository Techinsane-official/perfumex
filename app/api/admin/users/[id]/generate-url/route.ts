import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate unique access token
    const accessToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create or update access URL record
    const accessUrl = await prisma.userAccessUrl.upsert({
      where: { userId: id },
      update: {
        accessToken,
        expiresAt,
        isUsed: false,
      },
      create: {
        userId: id,
        accessToken,
        expiresAt,
        isUsed: false,
      },
    });

    // Generate the full URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const accessUrlString = `${baseUrl}/access/${accessToken}`;

    return NextResponse.json({
      accessUrl: accessUrlString,
      expiresAt: accessUrl.expiresAt,
      userId: id,
      username: existingUser.username,
    });
  } catch (error) {
    console.error("Error generating access URL:", error);
    return NextResponse.json({ error: "Failed to generate access URL" }, { status: 500 });
  }
}
