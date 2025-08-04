"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  Eye,
  ArrowLeft,
  Scan,
  CheckSquare,
  Square
} from "lucide-react";

interface PicklistItem {
  id: string;
  quantity: number;
  picked: number;
  status: "PENDING" | "PICKED" | "PARTIALLY_PICKED" | "OUT_OF_STOCK";
  scannedAt: string | null;
  pickedAt: string | null;
  product: {
    id: string;
    name: string;
    brand: string;
    ean: string;
    barcode: string | null;
    location: string | null;
    stockQuantity: number;
  };
}

interface Picklist {
  id: string;
  orderId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedTo: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    customer: {
      name: string;
    };
    user: {
      username: string;
    };
  };
  assignedUser: {
    id: string;
    username: string;
  } | null;
  pickItems: PicklistItem[];
}

interface PicklistDetailClientProps {
  session: {
    user?: {
      username?: string;
    };
  };
  picklistId: string;
}

export default function PicklistDetailClient({ session, picklistId }: PicklistDetailClientProps) {
  const router = useRouter();
  const [picklist, setPicklist] = useState<Picklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchPicklist();
  }, [picklistId]);

  const fetchPicklist = async () => {
    try {
      const response = await fetch(`/api/admin/picklists/${picklistId}`);
      if (response.ok) {
        const data = await response.json();
        setPicklist(data);
      } else {
        console.error("Failed to fetch picklist");
      }
    } catch (error) {
      console.error("Error fetching picklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePicklistItem = async (itemId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/picklists/${picklistId}/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchPicklist(); // Refresh data
      } else {
        console.error("Failed to update picklist item");
      }
    } catch (error) {
      console.error("Error updating picklist item:", error);
    }
  };

  const scanBarcode = async (itemId: string, barcode: string) => {
    try {
      setScanning(true);
      const response = await fetch(`/api/admin/picklists/${picklistId}/items/${itemId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode }),
      });

      if (response.ok) {
        await fetchPicklist(); // Refresh data
      } else {
        console.error("Failed to scan barcode");
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
    } finally {
      setScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Square className="w-4 h-4" />;
      case "PICKED":
        return <CheckSquare className="w-4 h-4" />;
      case "PARTIALLY_PICKED":
        return <CheckSquare className="w-4 h-4 text-yellow-600" />;
      case "OUT_OF_STOCK":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading picklist...</p>
        </div>
      </div>
    );
  }

  if (!picklist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Picklist not found</p>
        </div>
      </div>
    );
  }

  const completedItems = picklist.pickItems.filter(item => item.status === "PICKED").length;
  const totalItems = picklist.pickItems.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/admin/picklists")}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Picklist Details</h1>
                <p className="text-sm text-gray-500">Order #{picklist.orderId.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(picklist.status)}`}>
                {getStatusIcon(picklist.status)}
                <span className="ml-1">{picklist.status.replace("_", " ")}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">Progress</h3>
            <span className="text-sm text-gray-500">{completedItems} of {totalItems} items picked</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {progressPercentage.toFixed(0)}% complete
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Customer</p>
              <p className="text-sm text-gray-900">{picklist.order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ordered By</p>
              <p className="text-sm text-gray-900">{picklist.order.user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Assigned To</p>
              <p className="text-sm text-gray-900">{picklist.assignedUser?.username || "Unassigned"}</p>
            </div>
          </div>
        </div>

        {/* Picklist Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Items to Pick</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {picklist.pickItems.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getItemStatusIcon(item.status)}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">{item.product.brand} - {item.product.ean}</p>
                        {item.product.location && (
                          <p className="text-xs text-gray-400">Location: {item.product.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.picked} / {item.quantity}
                      </p>
                      <p className="text-xs text-gray-500">picked</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updatePicklistItem(item.id, { 
                          picked: item.picked + 1,
                          status: item.picked + 1 >= item.quantity ? "PICKED" : "PARTIALLY_PICKED"
                        })}
                        disabled={item.status === "PICKED"}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => scanBarcode(item.id, item.product.barcode || "")}
                        disabled={scanning || !item.product.barcode}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        <Scan className="w-4 h-4 mr-1" />
                        Scan
                      </button>
                    </div>
                  </div>
                </div>
                {item.scannedAt && (
                  <div className="mt-2 text-xs text-green-600">
                    ✓ Scanned at {new Date(item.scannedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 