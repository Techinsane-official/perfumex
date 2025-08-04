import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-utils";

// DELETE /api/admin/reviews/[id]/delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireAdmin();
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ message: "Review deleted" });
}
