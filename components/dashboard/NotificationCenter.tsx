"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Notification {
  id: string;
  type:
    | "ORDER_APPROVED"
    | "ORDER_REJECTED"
    | "REVIEW_APPROVED"
    | "REVIEW_REJECTED"
    | "PRICING_UPDATED";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
  explanation?: string;
}

interface NotificationCenterProps {
  customerId: string;
}

export default function NotificationCenter({ customerId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [customerId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // For now, we'll create mock notifications since we don't have a notification system yet
      // In a real implementation, this would fetch from /api/customer/notifications
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "ORDER_APPROVED",
          title: "Bestelling goedgekeurd",
          message: "Je bestelling #12345678 is goedgekeurd en wordt verwerkt.",
          read: false,
          createdAt: new Date("2024-01-15T10:00:00Z").toISOString(), // 2 hours ago
        },
        {
          id: "2",
          type: "REVIEW_APPROVED",
          title: "Review geplaatst",
          message: "Je review voor 'Chanel N°5' is goedgekeurd en zichtbaar op de productpagina.",
          read: false,
          createdAt: new Date("2024-01-14T10:00:00Z").toISOString(), // 1 day ago
        },
        {
          id: "3",
          type: "REVIEW_REJECTED",
          title: "Review afgewezen",
          message: "Je review voor 'Dior Sauvage' is afgewezen door de beheerder.",
          explanation:
            "De review bevatte onjuiste informatie over het product. Controleer de specificaties en probeer opnieuw.",
          read: false,
          createdAt: new Date("2024-01-12T10:00:00Z").toISOString(), // 3 days ago
        },
        {
          id: "4",
          type: "PRICING_UPDATED",
          title: "Prijzen bijgewerkt",
          message: "Je marge is aangepast naar 15% voor alle producten.",
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
        {
          id: "5",
          type: "ORDER_REJECTED",
          title: "Bestelling afgewezen",
          message: "Je bestelling #12345679 is afgewezen. Neem contact op voor meer informatie.",
          explanation:
            "Het product is momenteel niet op voorraad. We hebben je bestelling geannuleerd.",
          read: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        },
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.read).length);
    } catch {
      setError("Er is een fout opgetreden bij het laden van meldingen");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // In a real implementation, this would call /api/customer/notifications/[id]/read
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real implementation, this would call /api/customer/notifications/read-all
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ORDER_APPROVED":
        return "✅";
      case "ORDER_REJECTED":
        return "❌";
      case "REVIEW_APPROVED":
        return "⭐";
      case "REVIEW_REJECTED":
        return "⚠️";
      case "PRICING_UPDATED":
        return "💰";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "ORDER_APPROVED":
      case "REVIEW_APPROVED":
        return "border-green-200 bg-green-50";
      case "ORDER_REJECTED":
      case "REVIEW_REJECTED":
        return "border-red-200 bg-red-50";
      case "PRICING_UPDATED":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Zojuist";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} uur geleden`;
    } else {
      return format(date, "dd MMMM yyyy", { locale: nl });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Meldingen laden...</div>
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Meldingen</h2>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">
            Alles als gelezen markeren
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Geen meldingen</div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                !notification.read ? "ring-2 ring-blue-200" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                      {notification.explanation && (
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">Toelichting:</div>
                          <div className="text-sm text-gray-600">{notification.explanation}</div>
                        </div>
                      )}
                    </div>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Markeren als gelezen
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Meldingen Instellingen</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Bestelling updates</div>
              <div className="text-sm text-gray-600">Ontvang meldingen over bestelling status</div>
            </div>
            <div className="relative">
              <input type="checkbox" defaultChecked className="sr-only" id="order-notifications" />
              <label
                htmlFor="order-notifications"
                className="block w-12 h-6 bg-blue-600 rounded-full cursor-pointer"
              >
                <span className="block w-4 h-4 bg-white rounded-full transform translate-x-1 translate-y-1"></span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Review updates</div>
              <div className="text-sm text-gray-600">Ontvang meldingen over review status</div>
            </div>
            <div className="relative">
              <input type="checkbox" defaultChecked className="sr-only" id="review-notifications" />
              <label
                htmlFor="review-notifications"
                className="block w-12 h-6 bg-blue-600 rounded-full cursor-pointer"
              >
                <span className="block w-4 h-4 bg-white rounded-full transform translate-x-1 translate-y-1"></span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Prijswijzigingen</div>
              <div className="text-sm text-gray-600">Ontvang meldingen over prijs updates</div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                defaultChecked
                className="sr-only"
                id="pricing-notifications"
              />
              <label
                htmlFor="pricing-notifications"
                className="block w-12 h-6 bg-blue-600 rounded-full cursor-pointer"
              >
                <span className="block w-4 h-4 bg-white rounded-full transform translate-x-1 translate-y-1"></span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Review afwijzingen</div>
              <div className="text-sm text-gray-600">Ontvang toelichting bij afgewezen reviews</div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                defaultChecked
                className="sr-only"
                id="rejection-notifications"
              />
              <label
                htmlFor="rejection-notifications"
                className="block w-12 h-6 bg-blue-600 rounded-full cursor-pointer"
              >
                <span className="block w-4 h-4 bg-white rounded-full transform translate-x-1 translate-y-1"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
