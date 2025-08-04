"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const { data: session } = useSession();

  const tabs = [
    { id: "overview", label: "Overzicht", icon: "🏠" },
    { id: "orders", label: "Bestellingen", icon: "📦" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "pricing", label: "Prijzen", icon: "💰" },
    { id: "downloads", label: "Downloads", icon: "📄" },
    { id: "notifications", label: "Meldingen", icon: "🔔" },
  ];

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900">Klant Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welkom, {session?.user?.username}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Uitloggen
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
