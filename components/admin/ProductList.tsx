"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Grid3X3, List, ChevronLeft, ChevronRight, Plus, Download } from "lucide-react";
import ProductExportDialog from "@/components/ui/ProductExportDialog";

interface Product {
  id: string;
  name: string;
  brand: string;
  content: string;
  ean: string;
  purchasePrice: number;
  retailPrice: number;
  stock: number;
  maxOrderQuantity: number; // ✅ Gebruikt in UI, wordt gemapped van maxOrderableQuantity
  rating: number; // ✅ Gebruikt in UI, wordt gemapped van starRating
  category: string | null;
  subcategory: string | null;
  status: string;
  isAvailable: boolean;
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedContent, setSelectedContent] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleColumns, setVisibleColumns] = useState({
    brand: true,
    content: true,
    stock: true,
    price: true,
    rating: true,
    status: true,
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const itemsPerPage = 10;

  // Available brands, content sizes, and statuses for filters
  const brands = [...new Set(products.map((p) => p.brand))];
  const contentSizes = [...new Set(products.map((p) => p.content))];
  const statuses = [...new Set(products.map((p) => p.status))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONCEPT":
        return "bg-gray-400";
      case "ACTIEF":
        return "bg-green-500";
      case "NIET_BESCHIKBAAR":
        return "bg-yellow-500";
      case "VERVALLEN":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONCEPT":
        return "Concept";
      case "ACTIEF":
        return "Actief";
      case "NIET_BESCHIKBAAR":
        return "Niet Beschikbaar";
      case "VERVALLEN":
        return "Verlopen";
      default:
        return status;
    }
  };

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.ean.includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand = !selectedBrand || product.brand === selectedBrand;
      const matchesContent = !selectedContent || product.content === selectedContent;
      const matchesStatus = !selectedStatus || product.status === selectedStatus;

      let matchesAvailability = true;
      if (availabilityFilter === "available") {
        matchesAvailability = product.isAvailable && product.stock > 0;
      } else if (availabilityFilter === "outOfStock") {
        matchesAvailability = product.stock === 0;
      }

      return (
        matchesSearch && matchesBrand && matchesContent && matchesStatus && matchesAvailability
      );
    });
  }, [products, searchTerm, selectedBrand, selectedContent, selectedStatus, availabilityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Zoek Producten
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                id="search"
                placeholder="Zoek op naam, EAN, of merk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
              Merk
            </label>
            <select
              id="brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Merken</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Content Filter */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Inhoud
            </label>
            <select
              id="content"
              value={selectedContent}
              onChange={(e) => setSelectedContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Maten</option>
              {contentSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Statussen</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          {/* Availability Filter */}
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
              Beschikbaarheid
            </label>
            <select
              id="availability"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Producten</option>
              <option value="available">Op Voorraad</option>
              <option value="outOfStock">Uitverkocht</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Weergave:</span>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Column Toggles */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Kolommen:</span>
            {Object.entries(visibleColumns).map(([column, visible]) => (
              <label key={column} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleColumn(column as keyof typeof visibleColumns)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{column}</span>
              </label>
            ))}
          </div>

          {/* Export Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExportDialogOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exporteren</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Toon {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} van{" "}
          {filteredProducts.length} producten
        </p>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nieuw Product</span>
        </Link>
      </div>

      {/* Products Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {product.name}
                  </h3>
                  {visibleColumns.brand && (
                    <p className="text-xs text-gray-600 mt-1">{product.brand}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    product.isAvailable && product.stock > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.isAvailable && product.stock > 0 ? "Op Voorraad" : "Uitverkocht"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {visibleColumns.content && (
                  <p className="text-gray-600">Inhoud: {product.content}</p>
                )}
                {visibleColumns.stock && <p className="text-gray-600">Voorraad: {product.stock}</p>}
                {visibleColumns.price && (
                  <p className="text-gray-600">Prijs: €{product.retailPrice}</p>
                )}
                {visibleColumns.rating && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${i < product.rating ? "text-yellow-400" : "text-gray-300"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors text-center"
                >
                  Bewerken
                </Link>
                <button className="flex-1 bg-gray-600 text-white text-xs py-1 px-2 rounded hover:bg-gray-700 transition-colors">
                  Bekijken
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                {visibleColumns.brand && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merk
                  </th>
                )}
                {visibleColumns.content && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inhoud
                  </th>
                )}
                {visibleColumns.stock && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voorraad
                  </th>
                )}
                {visibleColumns.price && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prijs
                  </th>
                )}
                {visibleColumns.rating && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.ean}</div>
                    </div>
                  </td>
                  {visibleColumns.brand && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.brand}
                    </td>
                  )}
                  {visibleColumns.content && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.content}
                    </td>
                  )}
                  {visibleColumns.stock && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                  )}
                  {visibleColumns.price && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{product.retailPrice}
                    </td>
                  )}
                  {visibleColumns.rating && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < product.rating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)} text-white`}
                      >
                        {getStatusText(product.status)}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Bewerken
                      </Link>
                      <button className="text-gray-600 hover:text-gray-900">Bekijken</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Pagina {currentPage} van {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ProductExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        currentFilters={{
          search: searchTerm,
          brand: selectedBrand,
          content: selectedContent,
          status: selectedStatus,
          availability: availabilityFilter,
        }}
      />
    </div>
  );
}
