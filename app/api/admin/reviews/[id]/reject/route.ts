import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-utils";
import { auth } from "@/lib/auth";
import { z } from "zod";

const rejectSchema = z.object({ reason: z.string().min(3).max(255) });

// POST /api/admin/reviews/[id]/reject
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  let parsed;
  try {
    parsed = rejectSchema.parse(body);
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", details: err }, { status: 400 });
  }
  const review = await prisma.review.update({
    where: { id },
    data: {
      status: "REJECTED",
      moderatedBy: session.user.id,
      moderatedAt: new Date(),
      rejectionReason: parsed.reason,
    },
  });
  return NextResponse.json({ message: "Review rejected", review });
}
