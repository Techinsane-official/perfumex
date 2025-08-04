import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "BUYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      customerId: customerId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalReviews = await prisma.review.count({ where });
    const totalPages = Math.ceil(totalReviews / limit);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        totalReviews,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "BUYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.user.id;
    const { reviewId, title, content, rating } = await request.json();

    // Verify the review belongs to this customer and is still pending
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        customerId: customerId,
        status: "PENDING",
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found or cannot be edited" }, { status: 404 });
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        title,
        content,
        rating,
        updatedAt: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
          },
        },
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("Error updating customer review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "BUYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    // Verify the review belongs to this customer and is still pending
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        customerId: customerId,
        status: "PENDING",
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found or cannot be deleted" }, { status: 404 });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
