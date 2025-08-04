"use client";

import { useState, useEffect } from "react";

interface PricingSummaryProps {
  customerId: string;
}

interface CategoryPricing {
  categoryId: string;
  categoryName: string;
  marginPercentage: number;
}

interface ProductOverride {
  productId: string;
  productName: string;
  customerPrice: number;
}

interface PricingStats {
  categoryOverrides: number;
  productOverrides: number;
  averageOrderValue: number;
  totalOrders: number;
}

interface CustomerPricing {
  marginPercentage: number;
  hiddenCategories?: string[];
}

interface PricingData {
  customer: CustomerPricing;
  pricingStats: PricingStats;
  categoryPricing?: CategoryPricing[];
  productOverrides?: ProductOverride[];
}

export default function PricingSummary({ customerId }: PricingSummaryProps) {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingSummary();
  }, [customerId]);

  const fetchPricingSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer/price-summary");
      if (!response.ok) {
        throw new Error("Failed to fetch pricing summary");
      }

      const data = await response.json();
      setPricingData(data);
    } catch {
      setError("Er is een fout opgetreden bij het laden van prijsinformatie");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Prijsinformatie laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  if (!pricingData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Geen prijsinformatie beschikbaar</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Prijsinformatie</h2>

      {/* General Pricing Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Algemene Prijsinstellingen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Standaard marge</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(pricingData.customer.marginPercentage)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Dit percentage wordt toegepast op alle producten tenzij er specifieke overrides zijn
              ingesteld.
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Verborgen categorieën</div>
            <div className="text-lg font-medium text-gray-900">
              {pricingData.customer.hiddenCategories?.length || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Categorieën die niet zichtbaar zijn in jouw catalogus.
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Categorie overrides</div>
          <div className="text-2xl font-bold text-green-600">
            {pricingData.pricingStats?.categoryOverrides ?? 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Categorieën met aangepaste marges</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Product overrides</div>
          <div className="text-2xl font-bold text-purple-600">
            {pricingData.pricingStats?.productOverrides ?? 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Producten met specifieke prijzen</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Gemiddelde bestelling</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatPrice(pricingData.pricingStats?.averageOrderValue ?? 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Gebaseerd op {pricingData.pricingStats?.totalOrders ?? 0} bestellingen
          </div>
        </div>
      </div>

      {/* Category Pricing */}
      {(pricingData.categoryPricing ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Categorie-specifieke Marges</h3>
          <div className="space-y-3">
            {(pricingData.categoryPricing ?? []).map((category: CategoryPricing) => (
              <div
                key={category.categoryId}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>{category.categoryName}</div>
                <div>{formatPercentage(category.marginPercentage)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Pricing Overrides */}
      {(pricingData.productOverrides ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product-specifieke Prijzen</h3>
          <div className="space-y-3">
            {(pricingData.productOverrides ?? []).map((product: ProductOverride) => (
              <div
                key={product.productId}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>{product.productName}</div>
                <div>{formatPrice(product.customerPrice)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
