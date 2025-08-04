"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

import { confirmProductDeletion, deleteProduct } from "./actions";

interface Product {
  id: string;
  name: string;
  brand: string;
  ean: string;
  purchasePrice: string;
  retailPrice: string;
  stock: string;
}

export default function ProductDeletePage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as Record<string, unknown>)?.role !== "ADMIN") {
      router.push("/login/admin");
      return;
    }

    // Load product details
    const loadProduct = async () => {
      try {
        const formData = new FormData();
        formData.append("csrf_token", "temp"); // Will be replaced by actual token

        const result = await confirmProductDeletion(
          productId,
          new Request("", { method: "POST", body: formData }),
        );
        if (result.success && result.product) {
          setProduct(result.product);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setError("Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [session, status, router, productId]);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("csrf_token", "temp"); // Will be replaced by actual token

      await deleteProduct(productId, new Request("", { method: "POST", body: formData }));
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/products");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <BackButton href="/admin/products" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Product Not Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <div className="mt-6">
            <BackButton href="/admin/products" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BackButton href="/admin/products" />
                <h1 className="ml-4 text-xl font-semibold text-gray-900">Delete Product</h1>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Warning: This action cannot be undone
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently delete the product and all associated data.
                </p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <p className="mt-1 text-sm text-gray-900">{product.brand}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">EAN Code</label>
                  <p className="mt-1 text-sm text-gray-900">{product.ean}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <p className="mt-1 text-sm text-gray-900">{product.stock} units</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                  <p className="mt-1 text-sm text-gray-900">€{product.purchasePrice}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Retail Price</label>
                  <p className="mt-1 text-sm text-gray-900">€{product.retailPrice}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
