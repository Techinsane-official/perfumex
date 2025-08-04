"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Users, Mail, Phone, MapPin, DollarSign, Settings } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  generalMargin: number;
  minimumOrderValue: number;
  minimumOrderItems: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customerMargins: Array<{
    id: string;
    category: string;
    margin: number;
  }>;
  customerPrices: Array<{
    id: string;
    productId: string;
    price: number;
    product: {
      id: string;
      name: string;
      brand: string;
      content: string;
    };
  }>;
  customerDiscounts: Array<{
    id: string;
    brand: string;
    discount: number;
  }>;
  hiddenCategories: Array<{
    id: string;
    category: string;
  }>;
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    orderItems: Array<{
      quantity: number;
      product: {
        name: string;
        brand: string;
      };
    }>;
  }>;
  _count: {
    orders: number;
    customerMargins: number;
    customerPrices: number;
    customerDiscounts: number;
    hiddenCategories: number;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "pricing" | "orders">("overview");

  useEffect(() => {
    if (params.id) {
      fetchCustomer(params.id as string);
    }
  }, [params.id]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
      } else {
        console.error("Failed to fetch customer");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
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
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-screen-md mx-auto p-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Klant niet gevonden</h2>
          <p className="text-gray-600 mb-4">De klant kon niet worden geladen.</p>
          <button
            onClick={() => router.push("/admin/customers")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terug naar Klanten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/admin/customers")}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Klant details en configuratie</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Bewerken</span>
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {customer.isActive ? "Actief" : "Inactief"}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pricing"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Prijsconfiguratie
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "orders"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Bestellingen ({customer._count.orders})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Klant Informatie</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <Users className="h-4 w-4" />
                        <span>Naam</span>
                      </div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      <p className="font-medium text-gray-900">{customer.email}</p>
                    </div>
                    {customer.phone && (
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                          <Phone className="h-4 w-4" />
                          <span>Telefoon</span>
                        </div>
                        <p className="font-medium text-gray-900">{customer.phone}</p>
                      </div>
                    )}
                    {customer.address && (
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                          <MapPin className="h-4 w-4" />
                          <span>Adres</span>
                        </div>
                        <p className="font-medium text-gray-900">{customer.address}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Algemene Marge</span>
                      </div>
                      <p className="font-medium text-gray-900">{customer.generalMargin}%</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Minimum Bestelling</span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatPrice(customer.minimumOrderValue)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <Settings className="h-4 w-4" />
                        <span>Minimum Producten</span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {customer.minimumOrderItems} stuks
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <Users className="h-4 w-4" />
                        <span>Lid sinds</span>
                      </div>
                      <p className="font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistieken</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Totaal bestellingen</span>
                  <span className="font-medium text-gray-900">{customer._count.orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categorie marges</span>
                  <span className="font-medium text-gray-900">
                    {customer._count.customerMargins}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Product prijzen</span>
                  <span className="font-medium text-gray-900">
                    {customer._count.customerPrices}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Merk kortingen</span>
                  <span className="font-medium text-gray-900">
                    {customer._count.customerDiscounts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verborgen categorieën</span>
                  <span className="font-medium text-gray-900">
                    {customer._count.hiddenCategories}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pricing" && (
        <div className="space-y-6">
          {/* Category Margins */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Categorie Marges</h2>
              <p className="text-sm text-gray-600">Specifieke marges per productcategorie</p>
            </div>
            <div className="p-6">
              {customer.customerMargins.length > 0 ? (
                <div className="space-y-3">
                  {customer.customerMargins.map((margin) => (
                    <div
                      key={margin.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{margin.category}</span>
                      <span className="text-blue-600 font-semibold">{margin.margin}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Geen categorie-specifieke marges geconfigureerd
                </p>
              )}
            </div>
          </div>

          {/* Brand Discounts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Merk Kortingen</h2>
              <p className="text-sm text-gray-600">Kortingen per merk</p>
            </div>
            <div className="p-6">
              {customer.customerDiscounts.length > 0 ? (
                <div className="space-y-3">
                  {customer.customerDiscounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{discount.brand}</span>
                      <span className="text-green-600 font-semibold">-{discount.discount}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Geen merk-specifieke kortingen geconfigureerd
                </p>
              )}
            </div>
          </div>

          {/* Hidden Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Verborgen Categorieën</h2>
              <p className="text-sm text-gray-600">
                Categorieën die verborgen zijn voor deze klant
              </p>
            </div>
            <div className="p-6">
              {customer.hiddenCategories.length > 0 ? (
                <div className="space-y-3">
                  {customer.hiddenCategories.map((hiddenCategory) => (
                    <div
                      key={hiddenCategory.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <span className="font-medium text-red-900">{hiddenCategory.category}</span>
                      <span className="text-red-600 text-sm">Verborgen</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Geen verborgen categorieën geconfigureerd
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recente Bestellingen</h2>
            <p className="text-sm text-gray-600">Laatste 10 bestellingen van deze klant</p>
          </div>
          <div className="p-6">
            {customer.orders.length > 0 ? (
              <div className="space-y-4">
                {customer.orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Bestelling #{order.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.orderItems.length} producten besteld
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Geen bestellingen gevonden</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
