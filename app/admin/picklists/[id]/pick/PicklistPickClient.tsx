"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Scan,
  CheckSquare,
  Square,
  Play,
  Pause
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

interface PicklistPickClientProps {
  session: {
    user?: {
      username?: string;
    };
  };
  picklistId: string;
}

export default function PicklistPickClient({ session, picklistId }: PicklistPickClientProps) {
  const router = useRouter();
  const [picklist, setPicklist] = useState<Picklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");

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
        setBarcodeInput("");
      } else {
        console.error("Failed to scan barcode");
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
    } finally {
      setScanning(false);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (picklist && barcodeInput.trim()) {
      const currentItem = picklist.pickItems[currentItemIndex];
      if (currentItem) {
        scanBarcode(currentItem.id, barcodeInput.trim());
      }
    }
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Square className="w-6 h-6" />;
      case "PICKED":
        return <CheckSquare className="w-6 h-6 text-green-600" />;
      case "PARTIALLY_PICKED":
        return <CheckSquare className="w-6 h-6 text-yellow-600" />;
      case "OUT_OF_STOCK":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Square className="w-6 h-6" />;
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

  const pendingItems = picklist.pickItems.filter(item => item.status !== "PICKED");
  const currentItem = pendingItems[currentItemIndex];
  const completedItems = picklist.pickItems.filter(item => item.status === "PICKED").length;
  const totalItems = picklist.pickItems.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/admin/picklists/${picklistId}`)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Pick Mode</h1>
                <p className="text-sm text-gray-500">Order #{picklist.orderId.slice(-8)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {completedItems} / {totalItems}
              </div>
              <div className="text-xs text-gray-500">completed</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-center text-sm text-gray-600">
          {progressPercentage.toFixed(0)}% complete
        </div>
      </div>

      {/* Current Item */}
      {currentItem && (
        <div className="px-4 py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getItemStatusIcon(currentItem.status)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentItem.product.name}</h2>
                  <p className="text-sm text-gray-500">{currentItem.product.brand}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {currentItem.picked} / {currentItem.quantity}
                </div>
                <div className="text-sm text-gray-500">picked</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500">EAN</p>
                <p className="text-sm text-gray-900">{currentItem.product.ean}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-sm text-gray-900">{currentItem.product.location || "Not set"}</p>
              </div>
            </div>

            {/* Barcode Scanner */}
            <form onSubmit={handleBarcodeSubmit} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={scanning}
                />
                <button
                  type="submit"
                  disabled={scanning || !barcodeInput.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scan
                </button>
              </div>
            </form>

            {/* Manual Pick Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updatePicklistItem(currentItem.id, { 
                  picked: Math.max(0, currentItem.picked - 1),
                  status: currentItem.picked - 1 <= 0 ? "PENDING" : "PARTIALLY_PICKED"
                })}
                disabled={currentItem.picked <= 0}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                -1
              </button>
              <button
                onClick={() => updatePicklistItem(currentItem.id, { 
                  picked: currentItem.quantity,
                  status: "PICKED"
                })}
                disabled={currentItem.status === "PICKED"}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                Pick All
              </button>
              <button
                onClick={() => updatePicklistItem(currentItem.id, { 
                  picked: Math.min(currentItem.quantity, currentItem.picked + 1),
                  status: currentItem.picked + 1 >= currentItem.quantity ? "PICKED" : "PARTIALLY_PICKED"
                })}
                disabled={currentItem.status === "PICKED"}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                +1
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
              disabled={currentItemIndex === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              {currentItemIndex + 1} of {pendingItems.length} remaining
            </span>
            <button
              onClick={() => setCurrentItemIndex(Math.min(pendingItems.length - 1, currentItemIndex + 1))}
              disabled={currentItemIndex === pendingItems.length - 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Completed Message */}
      {!currentItem && completedItems === totalItems && (
        <div className="px-4 py-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 mb-2">Picklist Complete!</h2>
            <p className="text-green-700">All items have been picked successfully.</p>
            <button
              onClick={() => router.push(`/admin/picklists/${picklistId}`)}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 