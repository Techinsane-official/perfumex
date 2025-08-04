import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema for export template
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  exportType: z.enum(["PRODUCT", "ORDER", "CUSTOMER"]),
  exportFormat: z.enum(["CSV", "EXCEL", "PDF"]),
  parameters: z.record(z.unknown()),
  isDefault: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get("exportType");
    const exportFormat = searchParams.get("exportFormat");

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (exportType) {
      where.exportType = exportType;
    }

    if (exportFormat) {
      where.exportFormat = exportFormat;
    }

    // Fetch templates
    const templates = await prisma.exportTemplate.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching export templates:", error);
    return NextResponse.json({ error: "Failed to fetch export templates" }, { status: 500 });
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
    const validatedData = templateSchema.parse(body);

    // If this is a default template, unset other defaults for the same type
    if (validatedData.isDefault) {
      await prisma.exportTemplate.updateMany({
        where: {
          userId: session.user.id,
          exportType: validatedData.exportType,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create template
    const template = await prisma.exportTemplate.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description ?? null,
        exportType: validatedData.exportType,
        exportFormat: validatedData.exportFormat,
        parameters: validatedData.parameters as unknown as Prisma.InputJsonValue,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating export template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid template data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create export template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Validate the template belongs to the user
    const existingTemplate = await prisma.exportTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // If this is being set as default, unset other defaults for the same type
    if (updateData.isDefault) {
      await prisma.exportTemplate.updateMany({
        where: {
          userId: session.user.id,
          exportType: existingTemplate.exportType,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update template
    const template = await prisma.exportTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating export template:", error);
    return NextResponse.json({ error: "Failed to update export template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Validate the template belongs to the user
    const existingTemplate = await prisma.exportTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Delete template
    await prisma.exportTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting export template:", error);
    return NextResponse.json({ error: "Failed to delete export template" }, { status: 500 });
  }
}
