"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "categories">("general");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    generalMargin: 0,
    minimumOrderValue: 0,
    minimumOrderItems: 0,
    isActive: true,
  });

  // Pricing state
  const [margins, setMargins] = useState<Array<{ category: string; margin: number }>>([]);
  const [discounts, setDiscounts] = useState<Array<{ brand: string; discount: number }>>([]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // New item states
  const [newMargin, setNewMargin] = useState({ category: "", margin: 0 });
  const [newDiscount, setNewDiscount] = useState({ brand: "", discount: 0 });
  const [newHiddenCategory, setNewHiddenCategory] = useState("");

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert("Naam en email zijn verplicht");
      return;
    }

    setSaving(true);
    try {
      // Create customer
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const customerData = await response.json();
        const customerId = customerData.customer.id;

        // Add margins
        for (const margin of margins) {
          await fetch(`/api/admin/customers/${customerId}/margins`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(margin),
          });
        }

        // Add discounts
        for (const discount of discounts) {
          await fetch(`/api/admin/customers/${customerId}/discounts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(discount),
          });
        }

        // Add hidden categories
        for (const category of hiddenCategories) {
          await fetch(`/api/admin/customers/${customerId}/hidden-categories`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ category }),
          });
        }

        router.push(`/admin/customers/${customerId}`);
      } else {
        const errorData = await response.json();
        alert(`Fout: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Er is een fout opgetreden bij het aanmaken van de klant.");
    } finally {
      setSaving(false);
    }
  };

  const addMargin = () => {
    if (newMargin.category && newMargin.margin >= 0) {
      setMargins([...margins, newMargin]);
      setNewMargin({ category: "", margin: 0 });
    }
  };

  const removeMargin = (index: number) => {
    setMargins(margins.filter((_, i) => i !== index));
  };

  const addDiscount = () => {
    if (newDiscount.brand && newDiscount.discount >= 0) {
      setDiscounts([...discounts, newDiscount]);
      setNewDiscount({ brand: "", discount: 0 });
    }
  };

  const removeDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  const addHiddenCategory = () => {
    if (newHiddenCategory && !hiddenCategories.includes(newHiddenCategory)) {
      setHiddenCategories([...hiddenCategories, newHiddenCategory]);
      setNewHiddenCategory("");
    }
  };

  const removeHiddenCategory = (category: string) => {
    setHiddenCategories(hiddenCategories.filter((c) => c !== category));
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Nieuwe Klant</h1>
            <p className="text-gray-600">Maak een nieuwe klant aan</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Opslaan...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Opslaan</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "general"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Algemeen
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
            onClick={() => setActiveTab("categories")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "categories"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Verborgen Categorieën
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Algemene Informatie</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Naam *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Klant naam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="klant@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+31 6 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Straat en huisnummer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Algemene Marge (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.generalMargin}
                  onChange={(e) =>
                    setFormData({ ...formData, generalMargin: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Bestelling (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrderValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumOrderValue: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Producten
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimumOrderItems}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumOrderItems: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Actief</span>
                </label>
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
              <div className="space-y-4">
                {margins.map((margin, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={margin.category}
                      onChange={(e) => {
                        const newMargins = [...margins];
                        if (newMargins[index]) {
                          newMargins[index].category = e.target.value;
                          setMargins(newMargins);
                        }
                      }}
                      placeholder="Categorie"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={margin.margin}
                      onChange={(e) => {
                        const newMargins = [...margins];
                        if (newMargins[index]) {
                          newMargins[index].margin = parseFloat(e.target.value) || 0;
                          setMargins(newMargins);
                        }
                      }}
                      placeholder="Marge %"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeMargin(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newMargin.category}
                    onChange={(e) => setNewMargin({ ...newMargin, category: e.target.value })}
                    placeholder="Nieuwe categorie"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMargin.margin}
                    onChange={(e) =>
                      setNewMargin({ ...newMargin, margin: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="Marge %"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button onClick={addMargin} className="text-blue-600 hover:text-blue-700">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Discounts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Merk Kortingen</h2>
              <p className="text-sm text-gray-600">Kortingen per merk</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {discounts.map((discount, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={discount.brand}
                      onChange={(e) => {
                        const newDiscounts = [...discounts];
                        if (newDiscounts[index]) {
                          newDiscounts[index].brand = e.target.value;
                          setDiscounts(newDiscounts);
                        }
                      }}
                      placeholder="Merk"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount.discount}
                      onChange={(e) => {
                        const newDiscounts = [...discounts];
                        if (newDiscounts[index]) {
                          newDiscounts[index].discount = parseFloat(e.target.value) || 0;
                          setDiscounts(newDiscounts);
                        }
                      }}
                      placeholder="Korting %"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeDiscount(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newDiscount.brand}
                    onChange={(e) => setNewDiscount({ ...newDiscount, brand: e.target.value })}
                    placeholder="Nieuw merk"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDiscount.discount}
                    onChange={(e) =>
                      setNewDiscount({ ...newDiscount, discount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="Korting %"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button onClick={addDiscount} className="text-blue-600 hover:text-blue-700">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Verborgen Categorieën</h2>
            <p className="text-sm text-gray-600">Categorieën die verborgen zijn voor deze klant</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {hiddenCategories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <span className="font-medium text-red-900">{category}</span>
                  <button
                    onClick={() => removeHiddenCategory(category)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newHiddenCategory}
                  onChange={(e) => setNewHiddenCategory(e.target.value)}
                  placeholder="Nieuwe verborgen categorie"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button onClick={addHiddenCategory} className="text-blue-600 hover:text-blue-700">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
