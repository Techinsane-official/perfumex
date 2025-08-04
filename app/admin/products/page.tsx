// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ProductList } from "@/components/admin/ProductList";

export default async function AdminProductsPage() {
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
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Productbeheer</h1>
        <ProductList products={transformedProducts} />
      </main>
    );
  } catch (error) {
    const err = error as Error;
    console.error("❌ Fout in AdminProductsPage:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });

    return (
      <main className="p-4 text-red-600">
        <h1 className="text-xl font-bold mb-4">❌ Server-side fout in AdminProductsPage</h1>
        <pre>{err.message}</pre>
      </main>
    );
  }
}
