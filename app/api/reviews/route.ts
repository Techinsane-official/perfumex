import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

// Zod schema voor review input
const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10).max(1000),
});

// GET /api/reviews?productId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  // Fetch approved reviews for this product
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      status: "APPROVED",
    },
    include: {
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregation: average, count, distribution
  const aggregation = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: "APPROVED" },
    _count: { rating: true },
  });
  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) {
    distribution[i] = aggregation.find((a) => a.rating === i)?._count.rating || 0;
  }

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      customerName: r.customer?.name || "",
      createdAt: r.createdAt,
    })),
    stats: {
      total,
      average,
      distribution,
    },
  });
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const customerId = session.user.customerId;
  if (!customerId) {
    return NextResponse.json({ error: "No customer profile" }, { status: 403 });
  }
  const body = await request.json();
  let parsed;
  try {
    parsed = reviewSchema.parse(body);
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", details: err }, { status: 400 });
  }

  // Prevent duplicate review per customer-product
  const existing = await prisma.review.findFirst({
    where: {
      productId: parsed.productId,
      customerId,
    },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });
  }

  // Create review (PENDING)
  await prisma.review.create({
    data: {
      productId: parsed.productId,
      customerId,
      rating: parsed.rating,
      title: parsed.title,
      comment: parsed.comment,
      status: "PENDING",
    },
  });

  return NextResponse.json({ message: "Review submitted for moderation." });
}
