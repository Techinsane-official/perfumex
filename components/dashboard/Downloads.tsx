"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  downloadUrl: string;
}

export default function Downloads() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

  const statusColors = {
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    APPROVED: "Goedgekeurd",
    REJECTED: "Afgewezen",
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "10",
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/customer/invoices?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data.invoices);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError("Er is een fout opgetreden bij het laden van facturen");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
      a.download = `factuur-${orderId.slice(-8)}.pdf`;
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
    return format(new Date(dateString), "dd MMMM yyyy", { locale: nl });
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Facturen laden...</div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Downloads & Facturen</h2>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Filters wissen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle statussen</option>
              <option value="APPROVED">Goedgekeurd</option>
              <option value="REJECTED">Afgewezen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vanaf datum</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tot datum</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Geen facturen gevonden</div>
          <div className="text-sm text-gray-400 mt-2">
            Facturen zijn beschikbaar voor goedgekeurde of afgewezen bestellingen
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{invoice.invoiceNumber}</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[invoice.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[invoice.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{formatDate(invoice.createdAt)}</div>
                  <div className="text-sm text-gray-600">
                    {invoice.itemCount} product{invoice.itemCount !== 1 ? "en" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(invoice.totalAmount)}
                  </div>
                  <button
                    onClick={() => downloadPDF(invoice.id)}
                    disabled={downloadingPDF === invoice.id}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {downloadingPDF === invoice.id ? "Downloaden..." : "📄 PDF Download"}
                  </button>
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Over Facturen</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Facturen zijn beschikbaar voor goedgekeurde en afgewezen bestellingen</div>
          <div>• PDF&apos;s bevatten alle orderdetails, klantgegevens en BTW berekening</div>
          <div>• Downloads zijn beschikbaar voor 12 maanden na bestelling</div>
          <div>• Voor vragen over facturen, neem contact op via info@projectx.nl</div>
        </div>
      </div>
    </div>
  );
}
