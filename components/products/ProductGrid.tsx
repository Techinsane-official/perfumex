"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  ShoppingCart,
  Star,
  Package,
  Plus,
  Minus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  brand: string;
  content: string;
  ean: string;
  purchasePrice: number;
  retailPrice: number;
  stockQuantity: number;
  maxOrderableQuantity?: number;
  starRating: number;
  category?: string;
  subcategory?: string;
  description?: string;
  tags: string[];
  isActive: boolean;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
  }>;
  // Review data
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
  };
  // Customer-specific pricing
  customerPrice?: number;
  customerPricing?: {
    basePrice: number;
    marginAmount: number;
    marginPercentage: number;
    finalPrice: number;
    discountAmount: number;
    discountPercentage: number;
  };
}

interface OrderItem {
  productId: string;
  quantity: number;
  product: Product;
}

interface ProductGridProps {
  /** @internal placeholder to satisfy lint rules */
  _placeholder?: true;
}

export function ProductGrid({}: ProductGridProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedContent, setSelectedContent] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Advanced filters
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const itemsPerPage = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBrand && { brand: selectedBrand }),
        ...(selectedContent && { content: selectedContent }),
        ...(availabilityFilter && { availability: availabilityFilter }),
        // Advanced filters
        ...(minRating && { minRating: minRating.toString() }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedSubcategory && { subcategory: selectedSubcategory }),
        ...(minPrice && { minPrice: minPrice.toString() }),
        ...(maxPrice && { maxPrice: maxPrice.toString() }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(",") }),
      });

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.total || 0);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    selectedBrand,
    selectedContent,
    availabilityFilter,
    minRating,
    selectedCategory,
    selectedSubcategory,
    minPrice,
    maxPrice,
    selectedTags,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const getAvailabilityColor = (quantity: number) => {
    if (quantity > 10) return "text-green-600";
    if (quantity > 0) return "text-yellow-600";
    return "text-red-600";
  };

  const getAvailabilityText = (quantity: number) => {
    if (quantity > 10) return "Op voorraad";
    if (quantity > 0) return "Beperkt voorraad";
    return "Uitverkocht";
  };

  // Review helper functions
  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} text-yellow-400 fill-current`}
          />,
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} text-yellow-400 fill-current`}
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />,
        );
      } else {
        stars.push(
          <Star key={i} className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} text-gray-300`} />,
        );
      }
    }
    return stars;
  };

  // Order functions
  const addToOrder = (product: Product) => {
    setOrderItems((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
            : item,
        );
      } else {
        return [...prev, { productId: product.id, quantity: 1, product }];
      }
    });
  };

  const removeFromOrder = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product?.stockQuantity || 0)) }
          : item,
      ),
    );
  };

  const getOrderItemQuantity = (productId: string) => {
    const item = orderItems.find((item) => item.productId === productId);
    return item?.quantity || 0;
  };

  const getTotalOrderItems = () => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleOrderPreview = () => {
    if (orderItems.length > 0) {
      // Store order items in sessionStorage for the preview page
      sessionStorage.setItem("orderItems", JSON.stringify(orderItems));
      router.push("/order-preview");
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
      {/* Order Preview Bar */}
      {orderItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {getTotalOrderItems()} producten in bestelling
                </p>
                <p className="text-sm text-blue-700">{orderItems.length} verschillende producten</p>
              </div>
            </div>
            <button
              onClick={handleOrderPreview}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Bestelling Bekijken
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Zoek producten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merk</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Merken</option>
                  <option value="brand1">Merk 1</option>
                  <option value="brand2">Merk 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inhoud</label>
                <select
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Inhouden</option>
                  <option value="100ml">100ml</option>
                  <option value="50ml">50ml</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschikbaarheid
                </label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle</option>
                  <option value="in_stock">Op voorraad</option>
                  <option value="limited">Beperkt voorraad</option>
                  <option value="out_of_stock">Uitverkocht</option>
                </select>
              </div>

              {/* Advanced Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Categorieën</option>
                  <option value="parfum">Parfum</option>
                  <option value="eau-de-toilette">Eau de Toilette</option>
                  <option value="eau-de-parfum">Eau de Parfum</option>
                  <option value="body-spray">Body Spray</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorie</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Subcategorieën</option>
                  <option value="men">Heren</option>
                  <option value="women">Dames</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <select
                  value={minRating || ""}
                  onChange={(e) => setMinRating(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alle Ratings</option>
                  <option value="5">5 sterren</option>
                  <option value="4">4+ sterren</option>
                  <option value="3">3+ sterren</option>
                  <option value="2">2+ sterren</option>
                  <option value="1">1+ sterren</option>
                </select>
              </div>

              {/* Price Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Prijs</label>
                <input
                  type="number"
                  placeholder="€0"
                  value={minPrice || ""}
                  onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Prijs</label>
                <input
                  type="number"
                  placeholder="€1000"
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Actions */}
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedBrand("");
                    setSelectedContent("");
                    setAvailabilityFilter("");
                    setMinRating(null);
                    setSelectedCategory("");
                    setSelectedSubcategory("");
                    setMinPrice(null);
                    setMaxPrice(null);
                    setSelectedTags([]);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Toon {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalProducts)} van {totalProducts} producten
        </p>
      </div>

      {/* Products Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const orderQuantity = getOrderItemQuantity(product.id);
            const isInOrder = orderQuantity > 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {product.images.length > 0 && product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-gray-400 cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                  <button className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-50">
                    <Heart className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">{product.brand}</p>
                    </div>
                    {product.reviewStats && product.reviewStats.totalReviews > 0 ? (
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center space-x-1">
                          {renderStars(product.reviewStats.averageRating, "sm")}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({product.reviewStats.totalReviews})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center space-x-1">{renderStars(0, "sm")}</div>
                        <span className="text-xs text-gray-500">(0)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      {product.customerPrice ? (
                        <>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(product.customerPrice)}
                          </span>
                          {product.customerPrice !== product.retailPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.retailPrice)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(product.retailPrice)}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm ${getAvailabilityColor(product.stockQuantity)}`}>
                      {getAvailabilityText(product.stockQuantity)}
                    </span>
                  </div>

                  {/* Order Controls */}
                  {isInOrder ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(product.id, orderQuantity - 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-center font-medium">{orderQuantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, orderQuantity + 1)}
                        disabled={orderQuantity >= product.stockQuantity}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromOrder(product.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Verwijder
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToOrder(product)}
                      disabled={product.stockQuantity === 0}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4 w-4 inline mr-1" />
                      Bestel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const orderQuantity = getOrderItemQuantity(product.id);
            const isInOrder = orderQuantity > 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                    {product.images.length > 0 && product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-gray-400 cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product.brand} • {product.content}
                        </p>
                      </div>
                      {product.reviewStats && product.reviewStats.totalReviews > 0 ? (
                        <div className="flex items-center space-x-1 ml-2">
                          <div className="flex items-center space-x-1">
                            {renderStars(product.reviewStats.averageRating, "sm")}
                          </div>
                          <span className="text-xs text-gray-500">
                            ({product.reviewStats.totalReviews})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 ml-2">
                          <div className="flex items-center space-x-1">{renderStars(0, "sm")}</div>
                          <span className="text-xs text-gray-500">(0)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        {product.customerPrice ? (
                          <>
                            <span className="text-lg font-semibold text-gray-900">
                              {formatPrice(product.customerPrice)}
                            </span>
                            {product.customerPrice !== product.retailPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(product.retailPrice)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(product.retailPrice)}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${getAvailabilityColor(product.stockQuantity)}`}>
                        {getAvailabilityText(product.stockQuantity)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Heart className="h-5 w-5" />
                    </button>
                    {isInOrder ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(product.id, orderQuantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-medium">{orderQuantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, orderQuantity + 1)}
                          disabled={orderQuantity >= product.stockQuantity}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromOrder(product.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Verwijder
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToOrder(product)}
                        disabled={product.stockQuantity === 0}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-4 w-4 inline mr-1" />
                        Bestel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vorige
          </button>
          <span className="text-sm text-gray-700">
            Pagina {currentPage} van {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende
          </button>
        </div>
      )}
    </div>
  );
}
