import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-utils";

// GET /api/admin/reviews?status=&rating=&productId=&customerId=&search=
export async function GET(request: NextRequest) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const rating = searchParams.get("rating");
  const productId = searchParams.get("productId");
  const customerId = searchParams.get("customerId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (rating) where.rating = Number(rating);
  if (productId) where.productId = productId;
  if (customerId) where.customerId = customerId;
  if (search) {
    where.OR = [
      { comment: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { product: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true } },
      product: { select: { name: true } },
      moderator: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}
