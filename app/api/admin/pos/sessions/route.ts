import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for POS session
const posSessionSchema = z.object({
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const operatorId = searchParams.get("operatorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (operatorId) where.operatorId = operatorId;

    const sessions = await prisma.pOSSession.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            username: true,
          },
        },
        transactions: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.pOSSession.count({ where });

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching POS sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch POS sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = posSessionSchema.parse(body);

    // Generate unique session ID
    const sessionId = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new POS session
    const posSession = await prisma.pOSSession.create({
      data: {
        sessionId,
        operatorId: session.user.id,
        location: validatedData.location,
        notes: validatedData.notes,
      },
      include: {
        operator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ session: posSession }, { status: 201 });
  } catch (error) {
    console.error("Error creating POS session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid session data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create POS session" },
      { status: 500 }
    );
  }
} 