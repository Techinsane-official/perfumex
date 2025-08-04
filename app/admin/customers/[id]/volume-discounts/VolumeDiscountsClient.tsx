"use client";

import { useState, useEffect } from "react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  TrendingDown,
  Package,
  Users
} from "lucide-react";

interface VolumeDiscount {
  id: string;
  customerId: string;
  minQuantity: number;
  maxQuantity?: number;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VolumeDiscountsClientProps {
  customerId: string;
}

export default function VolumeDiscountsClient({ customerId }: VolumeDiscountsClientProps) {
  const [discounts, setDiscounts] = useState<VolumeDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    minQuantity: 1,
    maxQuantity: undefined as number | undefined,
    discountPercentage: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchVolumeDiscounts();
  }, [customerId]);

  const fetchVolumeDiscounts = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/volume-discounts`);
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data);
      }
    } catch (error) {
      console.error("Error fetching volume discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDiscount 
        ? `/api/admin/customers/${customerId}/volume-discounts/${editingDiscount}`
        : `/api/admin/customers/${customerId}/volume-discounts`;
      
      const method = editingDiscount ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingDiscount(null);
        setFormData({
          minQuantity: 1,
          maxQuantity: undefined,
          discountPercentage: 0,
          isActive: true,
        });
        fetchVolumeDiscounts();
      }
    } catch (error) {
      console.error("Error saving volume discount:", error);
    }
  };

  const handleEdit = (discount: VolumeDiscount) => {
    setEditingDiscount(discount.id);
    setFormData({
      minQuantity: discount.minQuantity,
      maxQuantity: discount.maxQuantity,
      discountPercentage: discount.discountPercentage,
      isActive: discount.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (discountId: string) => {
    if (!confirm("Are you sure you want to delete this volume discount?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/volume-discounts/${discountId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchVolumeDiscounts();
      }
    } catch (error) {
      console.error("Error deleting volume discount:", error);
    }
  };

  const getQuantityRange = (discount: VolumeDiscount) => {
    if (discount.maxQuantity) {
      return `${discount.minQuantity} - ${discount.maxQuantity}`;
    }
    return `${discount.minQuantity}+`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Volume Discounts</h2>
          <p className="text-gray-600">Configure tiered pricing based on order quantities</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Discount
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" />
              {editingDiscount ? "Edit Volume Discount" : "Add Volume Discount"}
            </CardTitle>
            <CardDescription>
              Configure quantity-based pricing tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxQuantity || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxQuantity: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingDiscount ? "Update" : "Create"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDiscount(null);
                    setFormData({
                      minQuantity: 1,
                      maxQuantity: undefined,
                      discountPercentage: 0,
                      isActive: true,
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Discounts List */}
      <div className="grid gap-4">
        {discounts.map((discount) => (
          <Card key={discount.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {getQuantityRange(discount)} items
                    </CardTitle>
                    <CardDescription>
                      {discount.discountPercentage}% discount
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    label={discount.isActive ? "Active" : "Inactive"}
                    variant={discount.isActive ? "success" : "neutral"}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(discount)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(discount.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Quantity Range:</span>
                  <p className="text-gray-600">{getQuantityRange(discount)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Discount:</span>
                  <p className="text-gray-600">{discount.discountPercentage}%</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-600">
                    {discount.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {discounts.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No volume discounts configured</h3>
              <p className="text-gray-600 mb-4">
                Add volume discounts to provide tiered pricing based on order quantities.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Discount
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 