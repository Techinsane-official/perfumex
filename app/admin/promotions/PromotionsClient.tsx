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
  Gift,
  Calendar,
  Users,
  Percent
} from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description?: string;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  promotionCustomers: Array<{
    id: string;
    customerId: string;
    customer: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function PromotionsClient() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromotion, setEditingPromotion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount: 0,
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch("/api/admin/promotions");
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPromotion 
        ? `/api/admin/promotions/${editingPromotion}`
        : "/api/admin/promotions";
      
      const method = editingPromotion ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingPromotion(null);
        setFormData({
          name: "",
          description: "",
          discount: 0,
          startDate: "",
          endDate: "",
          isActive: true,
        });
        fetchPromotions();
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion.id);
    setFormData({
      name: promotion.name,
      description: promotion.description || "",
      discount: promotion.discount,
      startDate: promotion.startDate.split("T")[0],
      endDate: promotion.endDate.split("T")[0],
      isActive: promotion.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (promotionId: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPromotions();
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
    }
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) return "Inactive";
    if (now < startDate) return "Scheduled";
    if (now > endDate) return "Expired";
    return "Active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "success";
      case "Scheduled": return "warning";
      case "Expired": return "neutral";
      case "Inactive": return "neutral";
      default: return "neutral";
    }
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
          <h2 className="text-lg font-semibold text-gray-900">Promotions</h2>
          <p className="text-gray-600">Manage temporary promotions and special offers</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              {editingPromotion ? "Edit Promotion" : "Add Promotion"}
            </CardTitle>
            <CardDescription>
              Configure temporary promotions and special offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promotion Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
                  {editingPromotion ? "Update" : "Create"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromotion(null);
                    setFormData({
                      name: "",
                      description: "",
                      discount: 0,
                      startDate: "",
                      endDate: "",
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

      {/* Promotions List */}
      <div className="grid gap-4">
        {promotions.map((promotion) => {
          const status = getPromotionStatus(promotion);
          return (
            <Card key={promotion.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{promotion.name}</CardTitle>
                      <CardDescription>
                        {promotion.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      label={status}
                      variant={getStatusColor(status) as any}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(promotion)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(promotion.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Discount:</span>
                    <p className="text-gray-600">{promotion.discount}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <p className="text-gray-600">{new Date(promotion.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">End Date:</span>
                    <p className="text-gray-600">{new Date(promotion.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Customers:</span>
                    <p className="text-gray-600">{promotion.promotionCustomers.length} assigned</p>
                  </div>
                </div>
                {promotion.promotionCustomers.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Assigned Customers:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {promotion.promotionCustomers.map((pc) => (
                        <Badge 
                          key={pc.id}
                          label={pc.customer.name}
                          variant="neutral"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {promotions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions configured</h3>
              <p className="text-gray-600 mb-4">
                Create temporary promotions and special offers for your customers.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Promotion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 