import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/supabase";
import { z } from "zod";

// Schema for image operations
const imageOperationSchema = z.object({
  productId: z.string().min(1),
  imageUrl: z.string().url(),
});

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, imageUrl } = imageOperationSchema.parse(body);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Find the image in the database
    const image = product.images.find((img) => img.url === imageUrl);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from Supabase Storage
    const deleteResult = await deleteImage(imageUrl);
    if (!deleteResult.success) {
      console.error("Failed to delete image from storage:", deleteResult.error);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.productImage.delete({
      where: { id: image.id },
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete image",
      },
      { status: 500 },
    );
  }
}

// Get product images
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Get product images
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isMain: "desc" }, { order: "asc" }],
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching product images:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch images",
      },
      { status: 500 },
    );
  }
}
