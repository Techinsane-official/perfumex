"use client";

import Link from "next/link";

export default function LoginChoicePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in op Project X
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Kies je login type</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login/admin"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            🔐 Admin Login
          </Link>

          <Link
            href="/login/buyer"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            🛒 Buyer Login
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Admin: Gebruikersnaam + Wachtwoord</p>
          <p>Buyer: Gebruikersnaam + Opslagpercentage</p>
        </div>
      </div>
    </div>
  );
}
