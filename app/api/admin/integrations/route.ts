import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for integration
const integrationSchema = z.object({
  platform: z.enum(["shopify", "bol", "amazon"]),
  isActive: z.boolean(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integrations = await prisma.integration.findMany({
      orderBy: { platform: "asc" },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
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
    const validatedData = integrationSchema.parse(body);

    // Check if integration already exists for this platform
    const existingIntegration = await prisma.integration.findUnique({
      where: { platform: validatedData.platform },
    });

    if (existingIntegration) {
      return NextResponse.json(
        { error: "Integration already exists for this platform" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.create({
      data: {
        platform: validatedData.platform,
        isActive: validatedData.isActive,
        apiKey: validatedData.apiKey,
        apiSecret: validatedData.apiSecret,
        webhookUrl: validatedData.webhookUrl,
        settings: validatedData.settings,
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Error creating integration:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
} 