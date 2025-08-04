"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Project X</h1>
          <p className="text-xl text-gray-600 mb-8">B2B Wholesale Platform for Perfumes</p>

          {status === "loading" ? (
            <div className="text-gray-600">Loading...</div>
          ) : session ? (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welkom terug!</h2>
              <div className="text-left space-y-2 text-gray-600">
                <p>
                  <strong>Email:</strong> {session.user?.email}
                </p>
                <p>
                  <strong>Role:</strong> {session.user?.role}
                </p>
                <p>
                  <strong>User ID:</strong> {session.user?.id}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Uitloggen
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Niet ingelogd</h2>
              <p className="text-gray-600 mb-4">Log in om toegang te krijgen tot het platform.</p>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Inloggen
              </Link>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Platform Features</h2>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• Customer-specific pricing</li>
              <li>• Advanced inventory management</li>
              <li>• Order approval workflows</li>
              <li>• Picklist system</li>
              <li>• Margin management</li>
              <li>• Staffel discounts</li>
            </ul>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            <p>Built with Next.js 15, TypeScript, Prisma, and Supabase</p>
          </div>
        </div>
      </div>
    </main>
  );
}
