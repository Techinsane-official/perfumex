"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Loader2 } from "lucide-react";

interface UserActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

interface UserActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export function UserActivityDialog({ isOpen, onClose, userId, username }: UserActivityDialogProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entity: entityFilter }),
      });

      const response = await fetch(`/api/admin/users/${userId}/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalActivities(data.pagination?.total || 0);
      } else {
        console.error("Failed to fetch user activities");
      }
    } catch (error) {
      console.error("Error fetching user activities:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage, actionFilter, entityFilter]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchActivities();
    }
  }, [isOpen, userId, fetchActivities]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const handleClose = () => {
    setActivities([]);
    setCurrentPage(1);
    setActionFilter("");
    setEntityFilter("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gebruiker Activiteit</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Gebruiker Informatie</h4>
            <p className="text-sm text-gray-600">
              Gebruiker: <span className="font-medium">{username}</span>
            </p>
            <p className="text-sm text-gray-600">
              Totaal activiteiten: <span className="font-medium">{totalActivities}</span>
            </p>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="actionFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Actie
                </label>
                <select
                  id="actionFilter"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Acties</option>
                  <option value="CREATE">Aanmaken</option>
                  <option value="UPDATE">Bijwerken</option>
                  <option value="DELETE">Verwijderen</option>
                  <option value="LOGIN">Inloggen</option>
                  <option value="LOGOUT">Uitloggen</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="entityFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Entiteit
                </label>
                <select
                  id="entityFilter"
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Entiteiten</option>
                  <option value="User">Gebruiker</option>
                  <option value="Product">Product</option>
                  <option value="Customer">Klant</option>
                  <option value="Order">Bestelling</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Activiteit Log</h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Geen activiteiten gevonden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(activity.action)}`}
                          >
                            {formatAction(activity.action)}
                          </span>
                          {activity.entity && (
                            <span className="text-sm text-gray-600">
                              {activity.entity}
                              {activity.entityId && ` (${activity.entityId})`}
                            </span>
                          )}
                        </div>
                        {activity.details && (
                          <div className="text-sm text-gray-600 mb-2">
                            <details className="cursor-pointer">
                              <summary className="hover:text-gray-800">Details bekijken</summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(activity.createdAt)}</span>
                          {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vorige
                </button>
                <span className="text-sm text-gray-700">
                  Pagina {currentPage} van {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volgende
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
