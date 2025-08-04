"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function BuyerLoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!username) {
      setError("Gebruikersnaam is verplicht");
      setIsLoading(false);
      return;
    }

    // Parse username for markup percentage
    let actualUsername = username;
    let markup = 0;

    if (username.includes("+")) {
      const parts = username.split("+");
      actualUsername = parts[0] || "";
      const markupPart = parts[1];

      if (markupPart && markupPart.trim() !== "") {
        const markupNum = parseFloat(markupPart);
        if (!isNaN(markupNum) && markupNum >= 0 && markupNum <= 100) {
          markup = markupNum / 100; // Convert percentage to decimal
        }
      }
    }

    const result = await signIn("credentials", {
      username: actualUsername,
      markup: markup,
      role: "buyer",
      redirect: false,
    });

    if (result?.error) {
      setError("Gebruikersnaam niet gevonden");
    }
    if (result?.ok) {
      window.location.href = "/dashboard";
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Buyer Login</h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Gebruikersnaam
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="bijv. klantnaam of klantnaam+15"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Inloggen..." : "Buyer Inloggen"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
            ← Terug naar login keuze
          </Link>
        </div>
      </div>
    </div>
  );
}
