"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft, Package, Clock } from "lucide-react";
import Image from "next/image";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  notes?: string;
  customer: {
    name: string;
    email: string;
    company?: string;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      brand: string;
      content: string;
      images: Array<{
        id: string;
        url: string;
        alt?: string;
        isMain: boolean;
      }>;
    };
  }>;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        console.error("Failed to fetch order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Wacht op goedkeuring";
      case "APPROVED":
        return "Goedgekeurd";
      case "REJECTED":
        return "Afgewezen";
      case "CANCELLED":
        return "Geannuleerd";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      case "APPROVED":
        return "text-green-600 bg-green-50";
      case "REJECTED":
        return "text-red-600 bg-red-50";
      case "CANCELLED":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-screen-md mx-auto p-6">
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bestelling niet gevonden</h2>
          <p className="text-gray-600 mb-4">De bestelling kon niet worden geladen.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Bestelling Bevestiging</h1>
            <p className="text-gray-600">Je bestelling is succesvol geplaatst</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
        >
          {getStatusText(order.status)}
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-green-900">Bestelling Geplaatst!</h2>
            <p className="text-green-700">
              Je bestelling is succesvol geplaatst en wacht op goedkeuring van de beheerder.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bestelling Details</h2>
            </div>
            <div className="p-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Bestelling ID</p>
                  <p className="font-medium text-gray-900">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Datum</p>
                  <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-900">{getStatusText(order.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Totaal Bedrag</p>
                  <p className="font-medium text-gray-900">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Producten</h3>
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0">
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
                      <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.product.brand} • {item.product.content}
                      </p>
                    </div>

                    {/* Quantity and Price */}
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Opmerkingen</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestelling Samenvatting</h2>

            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Klant Informatie</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Naam:</span> {order.customer.name}
                </p>
                <p>
                  <span className="text-gray-600">Email:</span> {order.customer.email}
                </p>
                {order.customer.company && (
                  <p>
                    <span className="text-gray-600">Bedrijf:</span> {order.customer.company}
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aantal producten:</span>
                <span>{order.orderItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Totaal stuks:</span>
                <span>{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Totaal:</span>
                  <span className="text-lg">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Volgende Stappen</h3>
                  <p className="text-sm text-blue-700">
                    Je bestelling wordt binnen 24 uur beoordeeld door de beheerder. Je ontvangt een
                    email zodra de bestelling is goedgekeurd of afgewezen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-4 mt-8">
        <button
          onClick={() => router.push("/products")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nieuwe Bestelling
        </button>
        <button
          onClick={() => router.push("/orders")}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Mijn Bestellingen
        </button>
      </div>
    </div>
  );
}
