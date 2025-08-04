"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";

interface BrandAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  placeholder?: string;
}

export default function BrandAutocomplete({
  value,
  onChange,
  error,
  placeholder = "Selecteer merk...",
}: BrandAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch existing brands from database
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/brands");
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.brands || []);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        // Fallback to common perfume brands
        setSuggestions([
          "Chanel",
          "Dior",
          "YSL",
          "Tom Ford",
          "Jo Malone",
          "Hermès",
          "Giorgio Armani",
          "Versace",
          "Paco Rabanne",
          "Calvin Klein",
          "Marc Jacobs",
          "Bvlgari",
          "Cartier",
          "Gucci",
          "Prada",
          "Balenciaga",
          "Maison Margiela",
          "Byredo",
          "Le Labo",
          "Diptyque",
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value) {
      setFilteredSuggestions(suggestions.slice(0, 10)); // Show first 10
    } else {
      const filtered = suggestions.filter((brand) =>
        brand.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
    }
  }, [value, suggestions]);

  // Handle input change
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    setIsOpen(true);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (brand: string) => {
    onChange(brand);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isOpen && filteredSuggestions.length > 0) {
      e.preventDefault();
      const firstSuggestion = filteredSuggestions[0];
      if (firstSuggestion) {
        handleSuggestionClick(firstSuggestion);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          placeholder={placeholder}
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Laden...</div>
          ) : filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => handleSuggestionClick(brand)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {brand}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {value ? "Geen merken gevonden" : "Begin met typen..."}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
