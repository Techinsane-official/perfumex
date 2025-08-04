import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for client role
const clientRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = await prisma.clientRole.findMany({
      include: {
        users: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching client roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch client roles" },
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
    const validatedData = clientRoleSchema.parse(body);

    // Check if role already exists
    const existingRole = await prisma.clientRole.findUnique({
      where: { name: validatedData.name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role already exists with this name" },
        { status: 400 }
      );
    }

    const role = await prisma.clientRole.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        permissions: validatedData.permissions,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Error creating client role:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create client role" },
      { status: 500 }
    );
  }
} 