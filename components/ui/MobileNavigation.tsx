"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  Users as Customers,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface MobileNavigationProps {
  userRole: "ADMIN" | "BUYER";
  username: string;
}

export function MobileNavigation({ userRole, username }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Gebruikers", icon: Users },
    { href: "/admin/products", label: "Producten", icon: Package },
    { href: "/admin/orders", label: "Bestellingen", icon: ShoppingCart },
    { href: "/admin/customers", label: "Klanten", icon: Customers },
    { href: "/admin/export-history", label: "Export", icon: BarChart3 },
    { href: "/admin/settings", label: "Instellingen", icon: Settings },
  ];

  const buyerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Producten", icon: Package },
    { href: "/orders", label: "Bestellingen", icon: ShoppingCart },
    { href: "/profile", label: "Profiel", icon: Settings },
  ];

  const navItems = userRole === "ADMIN" ? adminNavItems : buyerNavItems;

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: userRole === "ADMIN" ? "/login/admin" : "/login" });
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="text-xs">Meer</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">{username}</p>
                <p className="text-sm text-gray-500">
                  {userRole === "ADMIN" ? "Beheerder" : "Koper"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {navItems.slice(4).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="border-t border-gray-200 pt-2 mt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Uitloggen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Hamburger Menu */}
      <div className="hidden md:block">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Desktop Menu Overlay */}
        {isOpen && (
          <div className="hidden md:block fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{username}</p>
                  <p className="text-sm text-gray-500">
                    {userRole === "ADMIN" ? "Beheerder" : "Koper"}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="border-t border-gray-200 pt-2 mt-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Uitloggen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
