"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    brand: string;
    imageUrl: string | null;
    retailPrice?: number; // Added for margin calculation
  };
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  orderItems: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    PENDING: "In afwachting",
    APPROVED: "Goedgekeurd",
    REJECTED: "Afgewezen",
    CANCELLED: "Geannuleerd",
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/customer/orders?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError("Er is een fout opgetreden bij het laden van bestellingen");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const downloadPDF = async (orderId: string) => {
    try {
      setDownloadingPDF(orderId);
      const response = await fetch(`/api/customer/orders/${orderId}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Er is een fout opgetreden bij het downloaden van de PDF");
    } finally {
      setDownloadingPDF(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy 'om' HH:mm", {
      locale: nl,
    });
  };

  const calculateMargin = (retailPrice: number, customerPrice: number) => {
    return ((retailPrice - customerPrice) / retailPrice) * 100;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "text-green-600";
    if (margin >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Bestellingen laden...</div>
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

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Bestelgeschiedenis</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle statussen</option>
            <option value="PENDING">In afwachting</option>
            <option value="APPROVED">Goedgekeurd</option>
            <option value="REJECTED">Afgewezen</option>
            <option value="CANCELLED">Geannuleerd</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Geen bestellingen gevonden</div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">#{order.id.slice(-8)}</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[order.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                  <div className="text-sm text-gray-600">
                    {order.itemCount} product{order.itemCount !== 1 ? "en" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Details bekijken
                    </button>
                    {(order.status === "APPROVED" || order.status === "REJECTED") && (
                      <button
                        onClick={() => downloadPDF(order.id)}
                        disabled={downloadingPDF === order.id}
                        className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
                      >
                        {downloadingPDF === order.id ? "Downloaden..." : "PDF Download"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Vorige
          </button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Pagina {currentPage} van {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Volgende
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bestelling #{selectedOrder.id.slice(-8)}</h3>
                <div className="flex gap-2">
                  {(selectedOrder.status === "APPROVED" || selectedOrder.status === "REJECTED") && (
                    <button
                      onClick={() => downloadPDF(selectedOrder.id)}
                      disabled={downloadingPDF === selectedOrder.id}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {downloadingPDF === selectedOrder.id ? "Downloaden..." : "PDF Download"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Datum:</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[selectedOrder.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[selectedOrder.status as keyof typeof statusLabels]}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Producten:</h4>
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item) => {
                      const margin = calculateMargin(item.product.retailPrice || 0, item.price);

                      return (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.product.brand} - {item.quantity}x
                            </div>
                            {margin > 0 && (
                              <div className={`text-xs ${getMarginColor(margin)}`}>
                                Marge: {margin.toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatPrice(item.quantity * item.price)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatPrice(item.price)} per stuk
                            </div>
                            {item.product.retailPrice &&
                              item.product.retailPrice > item.price && (
                                <div className="text-xs text-gray-500 line-through">
                                  {formatPrice(item.product.retailPrice)}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Totaal:</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
