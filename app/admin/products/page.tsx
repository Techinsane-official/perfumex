// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProductList } from "@/components/admin/ProductList";

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        brand: true,
        content: true,
        ean: true,
        purchasePrice: true,
        retailPrice: true,
        stockQuantity: true,
        maxOrderableQuantity: true,
        starRating: true,
        category: true,
        subcategory: true,
        status: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!products || products.length === 0) {
      console.warn("⚠️ Geen producten gevonden.");
    }

    // Transform data to match expected format and convert Decimal to number
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      content: product.content,
      ean: product.ean,
      purchasePrice: Number(product.purchasePrice),
      retailPrice: Number(product.retailPrice),
      stock: product.stockQuantity,
      maxOrderQuantity: product.maxOrderableQuantity || 0,
      rating: product.starRating || 0,
      category: product.category,
      subcategory: product.subcategory,
      status: product.status,
      isAvailable: product.isActive && product.stockQuantity > 0,
    }));

    return (
      <DashboardLayout user={session.user}>
        <div className="space-y-6">
          {/* Page Header with proper spacing */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your product catalog</p>
          </div>
          <ProductList products={transformedProducts} />
        </div>
      </DashboardLayout>
    );
  } catch (error) {
    const err = error as Error;
    console.error("❌ Fout in AdminProductsPage:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });

    return (
      <DashboardLayout user={session.user}>
        <div className="space-y-6">
          {/* Page Header with proper spacing */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your product catalog</p>
          </div>
          <div className="text-red-600">
            <h1 className="text-xl font-bold mb-4">❌ Server-side fout in AdminProductsPage</h1>
            <pre>{err.message}</pre>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}
