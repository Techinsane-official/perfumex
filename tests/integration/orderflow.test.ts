import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as createOrder, GET as getOrders } from "@/app/api/orders/route";
import { PATCH as updateOrder, GET as getAdminOrders } from "@/app/api/admin/orders/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/pricing", () => ({
  calculateOrderPricing: vi.fn(),
  validateOrder: vi.fn(),
}));

describe("Order Flow Integration", () => {
  const mockSession = {
    user: {
      id: "user-1",
      username: "testuser",
      role: "BUYER",
    },
  };

  const mockAdminSession = {
    user: {
      id: "admin-1",
      username: "admin",
      role: "ADMIN",
    },
  };

  const mockOrder = {
    id: "order-1",
    customerId: "customer-1",
    userId: "user-1",
    status: "PENDING",
    totalAmount: 150.0,
    notes: "Test order",
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: "customer-1",
      name: "Test Customer",
      email: "test@example.com",
    },
    user: {
      id: "user-1",
      username: "testuser",
    },
    orderItems: [
      {
        id: "item-1",
        productId: "product-1",
        quantity: 2,
        price: 75.0,
        product: {
          id: "product-1",
          name: "Test Product",
          brand: "Test Brand",
        },
      },
    ],
  };

  const mockPricingResult = {
    items: [
      {
        productId: "product-1",
        quantity: 2,
        basePrice: 50.0,
        finalPrice: 75.0,
        totalPrice: 150.0,
        marginAmount: 25.0,
        discountAmount: 0,
      },
    ],
    subtotal: 100.0,
    totalMargin: 50.0,
    totalDiscount: 0,
    totalAmount: 150.0,
    itemCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Order Creation Flow", () => {
    it("should create order successfully", async () => {
      const { calculateOrderPricing, validateOrder } = await import("@/lib/pricing");

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(validateOrder).mockResolvedValue({ isValid: true, errors: [], warnings: [] });
      vi.mocked(calculateOrderPricing).mockResolvedValue(mockPricingResult);
      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.orderItem.create).mockResolvedValue(mockOrder.orderItems[0] as any);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "product-1", quantity: 2 }],
          notes: "Test order",
          customerId: "customer-1",
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toBeDefined();
      expect(data.pricing).toBeDefined();
    });

    it("should fail order creation with invalid data", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [], // Empty items
          customerId: "customer-1",
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should fail order creation with validation errors", async () => {
      const { validateOrder } = await import("@/lib/pricing");

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(validateOrder).mockResolvedValue({
        isValid: false,
        errors: ["Insufficient stock"],
        warnings: [],
      });

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "product-1", quantity: 100 }],
          customerId: "customer-1",
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Order validation failed");
      expect(data.details).toContain("Insufficient stock");
    });
  });

  describe("Order Retrieval Flow", () => {
    it("should retrieve orders for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as any);
      vi.mocked(prisma.order.count).mockResolvedValue(1);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await getOrders(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.orders).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it("should fail order retrieval for unauthenticated user", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await getOrders(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Admin Order Management Flow", () => {
    it("should retrieve orders for admin", async () => {
      vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as any);
      vi.mocked(prisma.order.count).mockResolvedValue(1);

      const request = new NextRequest("http://localhost:3000/api/admin/orders");
      const response = await getAdminOrders(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.orders).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it("should approve order successfully", async () => {
      const approvedOrder = {
        ...mockOrder,
        status: "APPROVED",
        approvedBy: "admin-1",
        approvedAt: new Date(),
      };

      vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(approvedOrder as any);
      vi.mocked(prisma.product.update).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const request = new NextRequest("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "order-1",
          action: "APPROVE",
        }),
      });

      const response = await updateOrder(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("approved");
    });

    it("should reject order with reason", async () => {
      const rejectedOrder = {
        ...mockOrder,
        status: "REJECTED",
        approvedBy: "admin-1",
        approvedAt: new Date(),
        rejectionReason: "Out of stock",
      };

      vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(rejectedOrder as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const request = new NextRequest("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "order-1",
          action: "REJECT",
          reason: "Out of stock",
        }),
      });

      const response = await updateOrder(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("rejected");
    });

    it("should fail to approve non-existent order", async () => {
      vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "non-existent",
          action: "APPROVE",
        }),
      });

      const response = await updateOrder(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Order not found");
    });

    it("should fail to approve already processed order", async () => {
      const approvedOrder = { ...mockOrder, status: "APPROVED" };

      vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(approvedOrder as any);

      const request = new NextRequest("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "order-1",
          action: "APPROVE",
        }),
      });

      const response = await updateOrder(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("cannot be modified");
    });
  });

  describe("Complete Order Flow", () => {
    it("should complete full order lifecycle", async () => {
      const { calculateOrderPricing, validateOrder } = await import("@/lib/pricing");

      // Step 1: Create order
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(validateOrder).mockResolvedValue({ isValid: true, errors: [], warnings: [] });
      vi.mocked(calculateOrderPricing).mockResolvedValue(mockPricingResult);
      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.orderItem.create).mockResolvedValue(mockOrder.orderItems[0] as any);

      const createRequest = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "product-1", quantity: 2 }],
          customerId: "customer-1",
        }),
      });

      const createResponse = await createOrder(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      expect(createData.order.status).toBe("PENDING");

      // Step 2: Admin approves order
      const approvedOrder = {
        ...mockOrder,
        status: "APPROVED",
        approvedBy: "admin-1",
        approvedAt: new Date(),
      };

      vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(approvedOrder as any);
      vi.mocked(prisma.product.update).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const approveRequest = new NextRequest("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createData.order.id,
          action: "APPROVE",
        }),
      });

      const approveResponse = await updateOrder(approveRequest);
      const approveData = await approveResponse.json();

      expect(approveResponse.status).toBe(200);
      expect(approveData.success).toBe(true);
    });
  });
});
