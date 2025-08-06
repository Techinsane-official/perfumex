"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import { uploadImage, validateImageFile, IMAGE_CONFIG } from "@/lib/supabase";
import ClientOnly from "./ClientOnly";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages: number;
  productId?: string; // For new products, we'll use a temporary ID
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages,
  productId,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [failedUploads, setFailedUploads] = useState<{ file: File; error: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate temporary product ID for new products
  const getProductId = () => {
    if (productId) return productId;
    // Use a stable ID for SSR, will be replaced on client
    return `temp-${Math.floor(Math.random() * 1000000)}`;
  };

  const handleFileSelect = async (files: FileList) => {
    if (images.length >= maxImages) {
      alert(`Je kunt maximaal ${maxImages} afbeeldingen uploaden.`);
      return;
    }

    setIsUploading(true);
    setUploadErrors([]);
    setFailedUploads([]);
    const newImages: string[] = [];
    const currentProductId = getProductId();

    for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
      const file = files[i];

      if (!file) continue;

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setUploadErrors((prev) => [...prev, `${file.name}: ${validation.error}`]);
        setFailedUploads((prev) => [...prev, { file, error: validation.error || "Validatie fout" }]);
        continue;
      }

      try {
        // Update progress
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Upload to Supabase Storage
        const result = await uploadImage(file, currentProductId);

        if (result.error) {
          setUploadErrors((prev) => [...prev, `${file.name}: ${result.error}`]);
          setFailedUploads((prev) => [...prev, { file, error: result.error || "Upload fout" }]);
        } else {
          newImages.push(result.url);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        }
      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload mislukt";
        setUploadErrors((prev) => [...prev, `${file.name}: ${errorMessage}`]);
        setFailedUploads((prev) => [...prev, { file, error: errorMessage }]);
      }
    }

    onImagesChange([...images, ...newImages]);
    setIsUploading(false);
    setUploadProgress({});
  };

  const retryFailedUpload = async (failedUpload: { file: File; error: string }) => {
    setIsUploading(true);
    setUploadErrors((prev) => prev.filter(error => !error.includes(failedUpload.file.name)));
    setFailedUploads((prev) => prev.filter(fu => fu.file !== failedUpload.file));
    
    const currentProductId = getProductId();

    try {
      setUploadProgress((prev) => ({ ...prev, [failedUpload.file.name]: 0 }));
      
      const result = await uploadImage(failedUpload.file, currentProductId);
      
      if (result.error) {
        setUploadErrors((prev) => [...prev, `${failedUpload.file.name}: ${result.error}`]);
        setFailedUploads((prev) => [...prev, { file: failedUpload.file, error: result.error || "Upload fout" }]);
      } else {
        onImagesChange([...images, result.url]);
        setUploadProgress((prev) => ({ ...prev, [failedUpload.file.name]: 100 }));
      }
    } catch (error) {
      console.error("Retry upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload mislukt";
      setUploadErrors((prev) => [...prev, `${failedUpload.file.name}: ${errorMessage}`]);
      setFailedUploads((prev) => [...prev, { file: failedUpload.file, error: errorMessage }]);
    }
    
    setIsUploading(false);
    setUploadProgress({});
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  return (
    <ClientOnly>
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-2">
          {isUploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Klik om afbeeldingen te selecteren
            </button>{" "}
            of sleep ze hierheen
          </div>
          <p className="text-xs text-gray-500">
            JPG, PNG, WebP tot {IMAGE_CONFIG.maxSize / 1024 / 1024}MB. Maximaal {maxImages}{" "}
            afbeeldingen.
          </p>
          {isUploading && <p className="text-sm text-blue-600">Bezig met uploaden...</p>}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">{filename}</span>
                <span className="text-gray-500">{progress}%</span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Upload Fouten:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {uploadErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Failed Uploads */}
      {failedUploads.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Mislukte Uploads:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {failedUploads.map((failedUpload, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>{failedUpload.file.name}</span>
                <button
                  type="button"
                  onClick={() => retryFailedUpload(failedUpload)}
                  className="text-yellow-600 hover:text-yellow-500 text-xs font-medium"
                >
                  Opnieuw proberen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={image}
                  alt={`Product afbeelding ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-image.png";
                  }}
                  unoptimized={true}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

        {/* Progress Info */}
        <div className="text-sm text-gray-600">
          {images.length} van {maxImages} afbeeldingen geüpload
        </div>
      </div>
    </ClientOnly>
  );
}
