"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, CheckCircle, XCircle, Trash2, Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  moderatedAt?: string;
  rejectionReason?: string;
  customer: {
    name: string;
    email: string;
  };
  product: {
    name: string;
  };
  moderator?: {
    username: string;
  };
}

interface ReviewListProps {
  /** @internal placeholder to satisfy lint rules */
  _placeholder?: true;
}

function ReviewList({}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (ratingFilter) params.append("rating", ratingFilter);

      const response = await fetch(`/api/admin/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        console.error("Failed to fetch reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        fetchReviews();
      } else {
        alert("Failed to approve review");
      }
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Error approving review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId: string, reason: string) => {
    setActionLoading(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        fetchReviews();
      } else {
        alert("Failed to reject review");
      }
    } catch (error) {
      console.error("Error rejecting review:", error);
      alert("Error rejecting review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Weet je zeker dat je deze review wilt verwijderen?")) return;
    setActionLoading(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/delete`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchReviews();
      } else {
        alert("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review");
    } finally {
      setActionLoading(null);
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "In afwachting";
      case "APPROVED":
        return "Goedgekeurd";
      case "REJECTED":
        return "Afgewezen";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Moderatie</h1>
          <p className="text-gray-600">Beheer product reviews en goedkeuringen</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Zoek in reviews, klanten, producten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Statussen</option>
              <option value="PENDING">In afwachting</option>
              <option value="APPROVED">Goedgekeurd</option>
              <option value="REJECTED">Afgewezen</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Ratings</option>
              <option value="5">5 sterren</option>
              <option value="4">4 sterren</option>
              <option value="3">3 sterren</option>
              <option value="2">2 sterren</option>
              <option value="1">1 ster</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{review.product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{review.customer.name}</div>
                    <div className="text-sm text-gray-500">{review.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStars(review.rating)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        review.status,
                      )}`}
                    >
                      {getStatusText(review.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bekijk details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {review.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={actionLoading === review.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Goedkeuren"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Reden voor afwijzing:");
                              if (reason) handleReject(review.id, reason);
                            }}
                            disabled={actionLoading === review.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Afwijzen"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={actionLoading === review.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <p className="text-sm text-gray-900">{selectedReview.product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Klant</label>
                  <p className="text-sm text-gray-900">
                    {selectedReview.customer.name} ({selectedReview.customer.email})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  {renderStars(selectedReview.rating)}
                </div>
                {selectedReview.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Titel</label>
                    <p className="text-sm text-gray-900">{selectedReview.title}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedReview.comment}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedReview.status,
                    )}`}
                  >
                    {getStatusText(selectedReview.status)}
                  </span>
                </div>
                {selectedReview.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Afwijzingsreden
                    </label>
                    <p className="text-sm text-red-600">{selectedReview.rejectionReason}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum</label>
                  <p className="text-sm text-gray-500">{formatDate(selectedReview.createdAt)}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewList />
      </div>
    </div>
  );
}
