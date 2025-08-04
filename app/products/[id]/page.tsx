"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Star, ShoppingCart, Heart, MessageCircle, Package, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

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
  status: string;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
  }>;
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

interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  customer: {
    id: string;
    name: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: "",
    content: "",
    rating: 5,
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchReviews();
    }
  }, [params.id, fetchProduct, fetchReviews]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"} text-yellow-400 fill-current`}
          />,
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"} text-yellow-400 fill-current`}
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />,
        );
      } else {
        stars.push(
          <Star
            key={i}
            className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"} text-gray-300`}
          />,
        );
      }
    }
    return stars;
  };

  const handleAddToOrder = () => {
    // Add to order logic here
    console.log("Adding to order:", product?.id, orderQuantity);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setSubmittingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product?.id,
          title: reviewForm.title,
          content: reviewForm.content,
          rating: reviewForm.rating,
        }),
      });

      if (response.ok) {
        setReviewForm({ title: "", content: "", rating: 5 });
        setShowReviewForm(false);
        setUserHasReviewed(true);
        // Refresh reviews
        fetchReviews();
      } else {
        const error = await response.json();
        alert(error.error || "Er is een fout opgetreden");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Er is een fout opgetreden");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Product niet gevonden</h1>
          <p className="text-gray-600 mt-2">
            Het opgevraagde product bestaat niet of is niet beschikbaar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.images.length > 0 && product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="h-24 w-24" />
              </div>
            )}
          </div>

          {/* Additional Images */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <Image
                    src={image.url}
                    alt={image.alt || product.name}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-xl text-gray-600 mt-2">{product.brand}</p>
            <p className="text-gray-500 mt-1">{product.content}</p>
          </div>

          {/* Review Stats */}
          {product.reviewStats && product.reviewStats.totalReviews > 0 && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {renderStars(product.reviewStats.averageRating, "lg")}
                <span className="text-lg font-semibold text-gray-900">
                  {product.reviewStats.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500">
                {product.reviewStats.totalReviews}{" "}
                {product.reviewStats.totalReviews === 1 ? "beoordeling" : "beoordelingen"}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            {product.customerPrice ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.customerPrice)}
                </div>
                {product.customerPrice !== product.retailPrice && (
                  <div className="text-lg text-gray-500 line-through">
                    {formatPrice(product.retailPrice)}
                  </div>
                )}
                {/* Pricing breakdown for customers */}
                {product.customerPricing && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-gray-900">Prijsoverzicht</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inkoopprijs:</span>
                        <span>{formatPrice(product.customerPricing.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Marge ({product.customerPricing.marginPercentage}%):
                        </span>
                        <span className="text-green-600">
                          +{formatPrice(product.customerPricing.marginAmount)}
                        </span>
                      </div>
                      {product.customerPricing.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Korting:</span>
                          <span className="text-red-600">
                            -{formatPrice(product.customerPricing.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-900">Jouw prijs:</span>
                          <span className="text-blue-600">
                            {formatPrice(product.customerPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {formatPrice(product.retailPrice)}
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                product.stockQuantity > 10
                  ? "text-green-600"
                  : product.stockQuantity > 0
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {product.stockQuantity > 10
                ? "Op voorraad"
                : product.stockQuantity > 0
                  ? "Beperkt voorraad"
                  : "Uitverkocht"}
            </span>
            <span className="text-sm text-gray-500">({product.stockQuantity} beschikbaar)</span>
          </div>

          {/* Order Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-medium text-lg">{orderQuantity}</span>
                <button
                  onClick={() =>
                    setOrderQuantity(Math.min(product.stockQuantity, orderQuantity + 1))
                  }
                  disabled={orderQuantity >= product.stockQuantity}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAddToOrder}
                disabled={product.stockQuantity === 0}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5 inline mr-2" />
                Toevoegen aan bestelling
              </button>
              <button className="p-3 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Beschrijving</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Beoordelingen ({reviews.length})</h2>
          {session?.user && !userHasReviewed && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              Review Schrijven
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && session?.user && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jouw Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  required
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Geef je review een titel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beoordeling *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewForm.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {reviewForm.rating} van 5 sterren
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review *</label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deel je ervaring met dit product..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "Bezig met verzenden..." : "Review Verzenden"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.title}</h4>
                    <p className="text-sm text-gray-500">{review.customer.name}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating, "sm")}
                  </div>
                </div>
                <p className="text-gray-600">{review.content}</p>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(review.createdAt).toLocaleDateString("nl-NL")}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nog geen beoordelingen voor dit product.</p>
              {session?.user && (
                <p className="text-sm mt-2">Wees de eerste om een review te schrijven!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
