"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";

interface CreateUserFormData {
  username: string;
  email: string;
  role: "ADMIN" | "BUYER";
  password: string;
  confirmPassword: string;
}

export function CreateUserForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateUserFormData>({
    username: "",
    email: "",
    role: "BUYER",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Gebruikersnaam is verplicht";
    } else if (formData.username.length < 3) {
      newErrors.username = "Gebruikersnaam moet minimaal 3 karakters bevatten";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Voer een geldig email adres in";
    }

    if (!formData.password) {
      newErrors.password = "Wachtwoord is verplicht";
    } else if (formData.password.length < 6) {
      newErrors.password = "Wachtwoord moet minimaal 6 karakters bevatten";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Wachtwoorden komen niet overeen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/users");
        }, 2000);
      } else {
        const errorData = await response.json();
        if (errorData.error === "USERNAME_EXISTS") {
          setErrors({ username: "Gebruikersnaam bestaat al" });
        } else if (errorData.error === "EMAIL_EXISTS") {
          setErrors({ email: "Email adres bestaat al" });
        } else {
          setErrors({ username: "Er is een fout opgetreden bij het aanmaken van de gebruiker" });
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setErrors({ username: "Er is een fout opgetreden bij het aanmaken van de gebruiker" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Gebruiker Succesvol Aangemaakt!
        </h2>
        <p className="text-gray-600">U wordt doorgestuurd naar het gebruikersoverzicht...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Gebruikersnaam *
        </label>
        <input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => handleInputChange("username", e.target.value)}
          className={`w-full rounded-md border focus:ring-2 focus:ring-blue-500 ${
            errors.username ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Voer gebruikersnaam in"
        />
        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Adres *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={`w-full rounded-md border focus:ring-2 focus:ring-blue-500 ${
            errors.email ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="voer@email.nl"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Role Field */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Rol *
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => handleInputChange("role", e.target.value)}
          className="w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="BUYER">Koper (Buyer)</option>
          <option value="ADMIN">Beheerder (Admin)</option>
        </select>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Wachtwoord *
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          className={`w-full rounded-md border focus:ring-2 focus:ring-blue-500 ${
            errors.password ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Minimaal 6 karakters"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Bevestig Wachtwoord *
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
          className={`w-full rounded-md border focus:ring-2 focus:ring-blue-500 ${
            errors.confirmPassword ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Herhaal wachtwoord"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          <span>{loading ? "Aanmaken..." : "Gebruiker Aanmaken"}</span>
        </button>
      </div>
    </form>
  );
}
