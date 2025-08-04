import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch unique brands from database
    const brands = await prisma.product.findMany({
      select: {
        brand: true,
      },
      where: {
        isActive: true,
      },
      distinct: ["brand"],
      orderBy: {
        brand: "asc",
      },
    });

    // Extract brand names and filter out empty/null values
    const brandNames = brands
      .map((item: { brand: string }) => item.brand)
      .filter((brand: string) => brand && brand.trim() !== "")
      .sort();

    return NextResponse.json({
      success: true,
      brands: brandNames,
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch brands",
      },
      { status: 500 },
    );
  }
}
