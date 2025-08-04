import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateProductPrice, calculateOrderPricing, validateOrder } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    logPricingCalculation: vi.fn(),
  },
}));

const mockProduct = {
  id: "product-1",
  name: "Test Product",
  brand: "Test Brand",
  content: "100ml",
  ean: "1234567890123",
  purchasePrice: 50.0,
  retailPrice: 75.0,
  stockQuantity: 100,
  maxOrderableQuantity: 200,
  starRating: 4,
  category: "Dames Parfums",
  subcategory: "Eau de Parfum",
  description: "Test description",
  tags: ["test", "sample"],
  isActive: true,
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCustomer = {
  id: "customer-1",
  name: "Test Customer",
  email: "test@example.com",
  phone: "+31612345678",
  address: "Test Address",
  company: "Test Company",
  generalMargin: 15,
  minimumOrderValue: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Pricing Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateProductPrice", () => {
    it("should calculate basic pricing with general margin", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

      const result = await calculateProductPrice("product-1", "customer-1", 1);

      expect(result).toEqual({
        basePrice: 50.0,
        marginAmount: 7.5, // 15% of 50.00
        marginPercentage: 15,
        finalPrice: 57.5,
        discountAmount: 0,
        discountPercentage: 0,
        totalPrice: 57.5,
      });
    });

    it("should apply category-specific margin override", async () => {
      const customerWithCategoryMargin = {
        ...mockCustomer,
        customerMargins: [{ category: "Dames Parfums", margin: 20 }],
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(customerWithCategoryMargin as any);

      const result = await calculateProductPrice("product-1", "customer-1", 1);

      expect(result.marginPercentage).toBe(20);
      expect(result.marginAmount).toBe(10.0); // 20% of 50.00
      expect(result.finalPrice).toBe(60.0);
    });

    it("should apply brand-specific discount", async () => {
      const customerWithBrandDiscount = {
        ...mockCustomer,
        customerDiscounts: [{ brand: "Test Brand", discount: 10 }],
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(customerWithBrandDiscount as any);

      const result = await calculateProductPrice("product-1", "customer-1", 1);

      expect(result.discountAmount).toBe(5.75); // 10% of 57.50
      expect(result.finalPrice).toBe(51.75);
    });

    it("should apply product-specific price override", async () => {
      const customerWithProductPrice = {
        ...mockCustomer,
        customerPrices: [{ productId: "product-1", price: 45.0 }],
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(customerWithProductPrice as any);

      const result = await calculateProductPrice("product-1", "customer-1", 1);

      expect(result.finalPrice).toBe(45.0);
      expect(result.marginAmount).toBe(-5.0); // 45 - 50
      expect(result.marginPercentage).toBe(0); // Override disables margin calculation
    });

    it("should apply quantity-based discounts", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

      const result = await calculateProductPrice("product-1", "customer-1", 100);

      // Should apply 10% discount for 100+ items
      expect(result.finalPrice).toBeLessThan(57.5);
      expect(result.discountAmount).toBeGreaterThan(0);
    });

    it("should throw error for non-existent product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

      await expect(calculateProductPrice("non-existent", "customer-1", 1)).rejects.toThrow(
        "Product or customer not found",
      );
    });

    it("should throw error for non-existent customer", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      await expect(calculateProductPrice("product-1", "non-existent", 1)).rejects.toThrow(
        "Product or customer not found",
      );
    });
  });

  describe("calculateOrderPricing", () => {
    it("should calculate total order pricing", async () => {
      const items = [
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ];

      const mockProduct2 = { ...mockProduct, id: "product-2", purchasePrice: 30.0 };

      vi.mocked(prisma.product.findUnique)
        .mockResolvedValueOnce(mockProduct as any)
        .mockResolvedValueOnce(mockProduct2 as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

      const result = await calculateOrderPricing(items, "customer-1");

      expect(result.items).toHaveLength(2);
      expect(result.subtotal).toBe(130.0); // (50 * 2) + (30 * 1)
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.itemCount).toBe(3);
    });

    it("should handle empty order items", async () => {
      const items: Array<{ productId: string; quantity: number }> = [];

      const result = await calculateOrderPricing(items, "customer-1");

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe("validateOrder", () => {
    it("should validate order successfully", async () => {
      const items = [{ productId: "product-1", quantity: 2 }];

      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

      const result = await validateOrder(items, "customer-1");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation for minimum order value", async () => {
      const items = [{ productId: "product-1", quantity: 1 }];
      const customerWithMinOrder = { ...mockCustomer, minimumOrderValue: 200 };

      vi.mocked(prisma.customer.findUnique).mockResolvedValue(customerWithMinOrder as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

      const result = await validateOrder(items, "customer-1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining("Minimum order value"));
    });

    it("should fail validation for insufficient stock", async () => {
      const items = [{ productId: "product-1", quantity: 150 }];
      const productWithLowStock = { ...mockProduct, stockQuantity: 100 };

      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([productWithLowStock] as any);

      const result = await validateOrder(items, "customer-1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining("Insufficient stock"));
    });

    it("should fail validation for maximum order quantity", async () => {
      const items = [{ productId: "product-1", quantity: 100 }];
      const productWithMaxOrder = { ...mockProduct, maxOrderableQuantity: 50 };

      vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([productWithMaxOrder] as any);

      const result = await validateOrder(items, "customer-1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining("Maximum order quantity"));
    });

    it("should fail validation for non-existent customer", async () => {
      const items = [{ productId: "product-1", quantity: 1 }];

      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

      const result = await validateOrder(items, "customer-1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Customer not found");
    });
  });
});
