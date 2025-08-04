"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import OrderHistory from "@/components/dashboard/OrderHistory";
import ReviewManagement from "@/components/dashboard/ReviewManagement";
import PricingSummary from "@/components/dashboard/PricingSummary";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import Downloads from "@/components/dashboard/Downloads";

export default function BuyerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/buyer");
    } else if (status === "authenticated" && session?.user?.role !== "BUYER") {
      router.push("/login/buyer");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  
  if (!session || session.user?.role !== "BUYER") {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard Overzicht</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-blue-600 mr-4">📦</div>
                  <div>
                    <div className="text-sm text-gray-600">Actieve Bestellingen</div>
                    <div className="text-2xl font-bold text-gray-900">3</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-green-600 mr-4">⭐</div>
                  <div>
                    <div className="text-sm text-gray-600">Reviews Geplaatst</div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-purple-600 mr-4">💰</div>
                  <div>
                    <div className="text-sm text-gray-600">Gemiddelde Marge</div>
                    <div className="text-2xl font-bold text-gray-900">15%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Snelle Acties</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/products")}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Producten Bekijken
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Bestellingen Beheren
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Reviews Beheren
                  </button>
                  <button
                    onClick={() => setActiveTab("downloads")}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Facturen Downloaden
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recente Activiteit</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Bestelling #12345678 goedgekeurd</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Review voor Chanel N°5 geplaatst</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Marge aangepast naar 15%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Factuur #12345678 beschikbaar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "orders":
        return <OrderHistory customerId={session.user.id} />;

      case "reviews":
        return <ReviewManagement customerId={session.user.id} />;

      case "pricing":
        return <PricingSummary customerId={session.user.id} />;

      case "notifications":
        return <NotificationCenter customerId={session.user.id} />;

      case "downloads":
        return <Downloads customerId={session.user.id} />;

      default:
        return (
          <div className="text-center py-8">
            <div className="text-gray-500">Tab niet gevonden</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderTabContent()}</div>
    </div>
  );
}
