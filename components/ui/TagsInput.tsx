"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TagsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagsInput({
  tags,
  onTagsChange,
  placeholder = "Voeg tags toe...",
  maxTags = 10,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue) {
        handleAddTag(inputValue);
      }
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (value: string) => {
    // Remove commas and extra spaces
    const cleanedValue = value.replace(/,/g, "").trim();
    setInputValue(cleanedValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none text-sm"
          />
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {tags.length}/{maxTags} tags
        </span>
        {tags.length >= maxTags && (
          <span className="text-xs text-red-600">Maximum aantal tags bereikt</span>
        )}
      </div>
    </div>
  );
}
