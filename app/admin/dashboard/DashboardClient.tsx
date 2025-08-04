"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { formatDateForDisplay } from "@/lib/utils";
import BulkExportDialog from "@/components/ui/BulkExportDialog";
import { MobileNavigation } from "@/components/ui/MobileNavigation";
import { Prisma } from "@prisma/client";
import { 
  Upload, 
  Download, 
  Image, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  FileText,
  Star,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Prisma.JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string; // Now a string (ISO format)
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

interface DashboardClientProps {
  session: {
    user?: {
      username?: string;
    };
  };
  recentLogs: AuditLog[];
}

export default function DashboardClient({ session, recentLogs }: DashboardClientProps) {
  const router = useRouter();

  const [formattedLogs, setFormattedLogs] = useState<Array<AuditLog & { formattedDate: string }>>(
    [],
  );
  const [bulkExportOpen, setBulkExportOpen] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("Client: Props received", { session, recentLogs });
  }, [session, recentLogs]);

  useEffect(() => {
    // Format dates only on client side to prevent hydration mismatch
    const formatted = recentLogs.map((log) => ({
      ...log,
      formattedDate: formatDateForDisplay(log.createdAt),
    }));
    setFormattedLogs(formatted);
  }, [recentLogs]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <span className="text-sm text-gray-500">Welkom, {session.user?.username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login/admin" })}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Product Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/products")}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Producten Beheren
                </span>
                <span className="text-blue-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/products/new")}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Nieuw Product
                </span>
                <span className="text-green-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/products/import")}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </span>
                <span className="text-purple-200">→</span>
              </button>
            </div>
          </div>

          {/* Order Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Order Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/orders")}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Bestellingen
                </span>
                <span className="text-green-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/orders/new")}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Nieuwe Bestelling
                </span>
                <span className="text-blue-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/picklists")}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Picklists
                </span>
                <span className="text-purple-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/reviews")}
                className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Reviews Beheren
                </span>
                <span className="text-yellow-200">→</span>
              </button>
            </div>
          </div>

          {/* Customer Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Customer Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/customers")}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Klanten
                </span>
                <span className="text-purple-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/customers/new")}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Nieuwe Klant
                </span>
                <span className="text-green-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/customers/import")}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Klanten Import
                </span>
                <span className="text-blue-200">→</span>
              </button>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/users")}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Gebruikers Overzicht
                </span>
                <span className="text-blue-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/users/new")}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Nieuwe Gebruiker
                </span>
                <span className="text-green-200">→</span>
              </button>
            </div>
          </div>

          {/* Reports & Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Reports & Analytics
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center justify-between">
                <span className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Verkooprapporten
                </span>
                <span className="text-blue-200">→</span>
              </button>
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left flex items-center justify-between">
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Voorraadrapporten
                </span>
                <span className="text-green-200">→</span>
              </button>
              <button
                onClick={() => setBulkExportOpen(true)}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Bulk Export
                </span>
                <span className="text-purple-200">→</span>
              </button>
            </div>
          </div>

          {/* System Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              System Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/admin/audit-logs")}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Audit Logs
                </span>
                <span className="text-gray-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/settings")}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Systeem Instellingen
                </span>
                <span className="text-orange-200">→</span>
              </button>
              <button
                onClick={() => router.push("/admin/backup")}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Backup & Restore
                </span>
                <span className="text-red-200">→</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formattedLogs.length > 0 ? (
                formattedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {log.action} - {log.entity}
                      </p>
                      <p className="text-xs text-gray-500">{log.formattedDate}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Geen recente activiteit</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation userRole="ADMIN" username={session.user?.username || ""} />

      {/* Dialogs */}
      <BulkExportDialog isOpen={bulkExportOpen} onClose={() => setBulkExportOpen(false)} />
    </div>
  );
}
