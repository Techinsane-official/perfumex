"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Plus,
  Search,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { OfflineAlert } from "@/components/ui/OfflineIndicator";
import { NotificationCenter } from "@/components/ui/NotificationCenter";

interface MobileAdminDashboardProps {
  /** @internal placeholder to satisfy lint rules */
  _placeholder?: true;
}

export function MobileAdminDashboard({}: MobileAdminDashboardProps) {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real implementation, this would fetch from API
      setStats({
        totalUsers: 25,
        totalProducts: 150,
        pendingOrders: 8,
        totalRevenue: 12500,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const quickActions = [
    {
      title: "Gebruikers",
      icon: Users,
      color: "bg-blue-500",
      href: "/admin/users",
      count: stats.totalUsers,
    },
    {
      title: "Producten",
      icon: Package,
      color: "bg-green-500",
      href: "/admin/products",
      count: stats.totalProducts,
    },
    {
      title: "Bestellingen",
      icon: ShoppingCart,
      color: "bg-purple-500",
      href: "/admin/orders",
      count: stats.pendingOrders,
      badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} nieuw` : undefined,
    },
    {
      title: "Rapporten",
      icon: BarChart3,
      color: "bg-orange-500",
      href: "/admin/reports",
    },
  ];

  const recentActivities = [
    { id: 1, action: "Nieuwe gebruiker aangemaakt", time: "2 min geleden", type: "success" },
    { id: 2, action: "Bestelling goedgekeurd", time: "5 min geleden", type: "success" },
    { id: 3, action: "Product bijgewerkt", time: "10 min geleden", type: "info" },
    { id: 4, action: "Voorraad alert", time: "15 min geleden", type: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* Offline Alert */}
      <OfflineAlert />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Totaal Omzet</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Openstaande Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Snelle Acties</h3>
          <NotificationCenter />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="relative p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{action.title}</p>
                    {action.count !== undefined && (
                      <p className="text-sm text-gray-500">{action.count}</p>
                    )}
                  </div>
                </div>
                {action.badge && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {action.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Activiteit</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                {activity.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                {activity.type === "warning" && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                {activity.type === "info" && <Activity className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tools */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Tools</h3>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/admin/products/new")}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Plus className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Nieuw Product</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => router.push("/admin/users/new")}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Nieuwe Gebruiker</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => router.push("/admin/export-history")}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">Export Geschiedenis</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => router.push("/admin/settings")}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Instellingen</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Zoek in admin..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
        </div>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
