import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-utils";
import { auth } from "@/lib/auth";

// POST /api/admin/reviews/[id]/approve
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const review = await prisma.review.update({
    where: { id },
    data: {
      status: "APPROVED",
      moderatedBy: session.user.id,
      moderatedAt: new Date(),
      rejectionReason: null,
    },
  });
  return NextResponse.json({ message: "Review approved", review });
}
