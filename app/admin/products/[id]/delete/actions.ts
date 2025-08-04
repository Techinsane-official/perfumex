"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/middleware-utils";
import { logProductAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function deleteProduct(productId: string, request: Request) {
  try {
    // Check authentication and admin role
    await requireAdmin();

    // Verify CSRF token
    const formData = await request.formData();
    const csrfToken = formData.get("csrf_token") as string;
    if (!csrfToken) {
      throw new Error("CSRF token missing");
    }

    // Get product details before deletion
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        brand: true,
        ean: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    // Log the product deletion
    await logProductAction("DELETE", productId, {
      productName: product.name,
      brand: product.brand,
      ean: product.ean,
    });

    // Revalidate cache before redirect
    revalidatePath("/admin/products");

    // Redirect after successful deletion - this will throw NEXT_REDIRECT exception
    // which is expected behavior and should not be logged as an error
    redirect("/admin/products");
  } catch (error) {
    // Filter out NEXT_REDIRECT exceptions - these are expected and should not be logged as errors
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      // This is a successful redirect, not an error - re-throw to allow Next.js to handle it
      throw error;
    }

    // Log only real errors, not redirects
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function confirmProductDeletion(productId: string, request: Request) {
  try {
    // Check authentication and admin role
    await requireAdmin();

    // Verify CSRF token
    const formData = await request.formData();
    const csrfToken = formData.get("csrf_token") as string;
    if (!csrfToken) {
      throw new Error("CSRF token missing");
    }

    // Get product details from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        brand: true,
        ean: true,
        purchasePrice: true,
        retailPrice: true,
        stockQuantity: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return { 
      success: true, 
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        ean: product.ean,
        purchasePrice: product.purchasePrice.toString(),
        retailPrice: product.retailPrice.toString(),
        stock: product.stockQuantity.toString(),
      }
    };
  } catch (error) {
    console.error("Error confirming product deletion:", error);
    throw error;
  }
}
