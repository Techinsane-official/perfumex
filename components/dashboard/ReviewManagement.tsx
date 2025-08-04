"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    brand: string;
    imageUrl: string | null;
  };
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    rating: 5,
  });

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    PENDING: "In afwachting",
    APPROVED: "Goedgekeurd",
    REJECTED: "Afgewezen",
  };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/customer/reviews?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.reviews);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError("Er is een fout opgetreden bij het laden van reviews");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title,
      content: review.content,
      rating: review.rating,
    });
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    try {
      const response = await fetch(`/api/customer/reviews`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: editingReview.id,
          ...editForm,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update review");
      }

      // Refresh reviews
      await fetchReviews();
      setEditingReview(null);
    } catch {
      setError("Er is een fout opgetreden bij het bijwerken van de review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Weet je zeker dat je deze review wilt verwijderen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/customer/reviews?id=${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      // Refresh reviews
      await fetchReviews();
    } catch {
      setError("Er is een fout opgetreden bij het verwijderen van de review");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: nl });
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Reviews laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Mijn Reviews</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle statussen</option>
            <option value="PENDING">In afwachting</option>
            <option value="APPROVED">Goedgekeurd</option>
            <option value="REJECTED">Afgewezen</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Geen reviews gevonden</div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-yellow-500 text-lg">{renderStars(review.rating)}</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[review.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[review.status as keyof typeof statusLabels]}
                    </span>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-1">{review.title}</h3>

                  <p className="text-gray-600 text-sm mb-2">{review.content}</p>

                  <div className="text-xs text-gray-500">
                    {review.product.brand} - {review.product.name}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Geplaatst op {formatDate(review.createdAt)}
                  </div>
                </div>

                {review.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditReview(review)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Verwijderen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Vorige
          </button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Pagina {currentPage} van {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Volgende
          </button>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review bewerken</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beoordeling
                  </label>
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} sterren
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateReview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Bijwerken
                </button>
                <button
                  onClick={() => setEditingReview(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
