"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  User,
  Mail,
  Building,
} from "lucide-react";
import Image from "next/image";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
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
      stockQuantity: number;
      images: Array<{
        id: string;
        url: string;
        alt?: string;
        isMain: boolean;
      }>;
    };
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
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

  const handleApprove = async () => {
    if (!order) return;

    setApproving(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "APPROVE",
        }),
      });

      if (response.ok) {
        // Refresh order data
        await fetchOrder(order.id);
      } else {
        console.error("Failed to approve order");
      }
    } catch (error) {
      console.error("Error approving order:", error);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!order || !rejectionReason.trim()) return;

    setRejecting(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "REJECT",
          reason: rejectionReason.trim(),
        }),
      });

      if (response.ok) {
        // Refresh order data
        await fetchOrder(order.id);
        setShowRejectDialog(false);
        setRejectionReason("");
      } else {
        console.error("Failed to reject order");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
    } finally {
      setRejecting(false);
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
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "APPROVED":
        return "text-green-600 bg-green-50 border-green-200";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      case "CANCELLED":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
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
            onClick={() => router.push("/admin/orders")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terug naar Bestellingen
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
            onClick={() => router.push("/admin/orders")}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bestelling #{order.id.slice(-8)}</h1>
            <p className="text-gray-600">Bestelling details en goedkeuring</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}
        >
          {getStatusIcon(order.status)}
          <span className="ml-2">{getStatusText(order.status)}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bestelling Informatie</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {order.approvedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Goedgekeurd op</p>
                    <p className="font-medium text-gray-900">{formatDate(order.approvedAt)}</p>
                  </div>
                )}
                {order.rejectionReason && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Afwijzingsreden</p>
                    <p className="font-medium text-gray-900">{order.rejectionReason}</p>
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Opmerkingen</p>
                  <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Klant Informatie</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{order.customer.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{order.customer.email}</span>
                  </div>
                  {order.customer.company && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <Building className="h-4 w-4" />
                      <span>{order.customer.company}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Producten</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {order.orderItems.map((item) => (
                <div key={item.id} className="p-6">
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acties</h2>

            {/* Approval Actions */}
            {order.status === "PENDING" && (
              <div className="space-y-4">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {approving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Goedkeuren...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Goedkeuren</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejecting}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-5 w-5" />
                  <span>Afwijzen</span>
                </button>
              </div>
            )}

            {/* Status Info */}
            {order.status !== "PENDING" && (
              <div className={`p-4 rounded-lg border ${getStatusColor(order.status)}`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className="font-medium">{getStatusText(order.status)}</span>
                </div>
                {order.status === "REJECTED" && order.rejectionReason && (
                  <p className="text-sm mt-2">{order.rejectionReason}</p>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Bestelling Samenvatting</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aantal producten:</span>
                  <span>{order.orderItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Totaal stuks:</span>
                  <span>{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Totaal:</span>
                    <span className="text-lg">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestelling Afwijzen</h3>
            <p className="text-gray-600 mb-4">
              Geef een reden op voor het afwijzen van deze bestelling. Dit wordt gedeeld met de
              klant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              placeholder="Reden voor afwijzing..."
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || rejecting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejecting ? "Afwijzen..." : "Afwijzen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
