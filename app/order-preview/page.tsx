"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface OrderItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    brand: string;
    content: string;
    retailPrice: number;
    stockQuantity: number;
    maxOrderableQuantity?: number;
    images: Array<{
      id: string;
      url: string;
      alt?: string;
      isMain: boolean;
    }>;
  };
}

interface OrderPricing {
  items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
    finalPrice: number;
    totalPrice: number;
    marginAmount: number;
    discountAmount: number;
  }>;
  subtotal: number;
  totalMargin: number;
  totalDiscount: number;
  totalAmount: number;
  itemCount: number;
}

export default function OrderPreviewPage() {
  const router = useRouter();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [pricing, setPricing] = useState<OrderPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Get order items from sessionStorage
    const storedItems = sessionStorage.getItem("orderItems");
    if (storedItems) {
      try {
        const items = JSON.parse(storedItems);
        setOrderItems(items);
        calculatePricing(items);
      } catch (error) {
        console.error("Error parsing order items:", error);
        // Clear invalid data and redirect
        sessionStorage.removeItem("orderItems");
        router.push("/products");
      }
    } else {
      // No items in order, redirect back to products
      router.push("/products");
    }
    setLoading(false);
  }, [router]);

  const calculatePricing = async (items: OrderItem[]) => {
    try {
      const response = await fetch("/api/orders/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        const pricingData = await response.json();
        setPricing(pricingData);
      } else {
        console.error("Failed to calculate pricing");
      }
    } catch (error) {
      console.error("Error calculating pricing:", error);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const updatedItems = orderItems.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stockQuantity)) }
        : item,
    );
    setOrderItems(updatedItems);
    sessionStorage.setItem("orderItems", JSON.stringify(updatedItems));
    calculatePricing(updatedItems);
  };

  const removeItem = (productId: string) => {
    const updatedItems = orderItems.filter((item) => item.productId !== productId);
    setOrderItems(updatedItems);
    sessionStorage.setItem("orderItems", JSON.stringify(updatedItems));
    calculatePricing(updatedItems);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          notes: notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Clear sessionStorage
        sessionStorage.removeItem("orderItems");
        // Redirect to order confirmation
        router.push(`/order-confirmation/${result.order.id}`);
      } else {
        const errorData = await response.json();
        setErrors(errorData.details || [errorData.error || "Failed to submit order"]);
      }
    } catch {
      setErrors(["Network error. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="max-w-screen-md mx-auto p-6">
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Geen producten in bestelling</h2>
          <p className="text-gray-600 mb-4">
            Voeg producten toe aan je bestelling om door te gaan.
          </p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terug naar Producten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/products")}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bestelling Overzicht</h1>
            <p className="text-gray-600">Controleer je bestelling voordat je deze plaatst</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ShoppingCart className="h-4 w-4" />
          <span>{orderItems.length} producten</span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium mb-2">Er zijn problemen met je bestelling:</h3>
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Producten in Bestelling</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {orderItems.map((item) => (
                <div key={item.productId} className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                      {item.product.images.length > 0 && item.product.images[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt || item.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.product.brand} • {item.product.content}
                      </p>
                      <p className="text-sm text-gray-500">
                        Voorraad: {item.product.stockQuantity} stuks
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.product.retailPrice * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.product.retailPrice)} per stuk
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestelling Samenvatting</h2>

            {/* Pricing Details */}
            {pricing && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotaal:</span>
                  <span>{formatPrice(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Marge:</span>
                  <span>{formatPrice(pricing.totalMargin)}</span>
                </div>
                {pricing.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Korting:</span>
                    <span className="text-green-600">-{formatPrice(pricing.totalDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Totaal:</span>
                    <span className="text-lg">{formatPrice(pricing.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opmerkingen (optioneel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Speciale instructies of opmerkingen..."
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={submitting || orderItems.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Bestelling Plaatsen...
                </div>
              ) : (
                "Bestelling Plaatsen"
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Je bestelling wordt ter goedkeuring voorgelegd aan de beheerder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
