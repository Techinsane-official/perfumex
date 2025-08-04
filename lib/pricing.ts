import { prisma } from "./prisma";

export interface PricingResult {
  basePrice: number;
  marginAmount: number;
  marginPercentage: number;
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  totalPrice: number;
}

export interface OrderItemPricing {
  productId: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  totalPrice: number;
  marginAmount: number;
  discountAmount: number;
}

export interface OrderPricing {
  items: OrderItemPricing[];
  subtotal: number;
  totalMargin: number;
  totalDiscount: number;
  totalAmount: number;
  itemCount: number;
}

/**
 * Calculate customer-specific price for a product
 */
export async function calculateProductPrice(
  productId: string,
  customerId: string,
  quantity: number = 1,
): Promise<PricingResult> {
  // Get product and customer data
  const [product, customer] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { customerPrices: true },
    }),
    prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        customerMargins: true,
        customerDiscounts: true,
        customerPrices: true,
      },
    }),
  ]);

  if (!product || !customer) {
    throw new Error("Product or customer not found");
  }

  const basePrice = Number(product.purchasePrice);
  let finalPrice = basePrice;
  let marginAmount = 0;
  let discountAmount = 0;

  // Check for product-specific price override
  const productPriceOverride = customer.customerPrices.find(
    (cp: { productId: string; price: number }) => cp.productId === productId,
  );

  if (productPriceOverride) {
    finalPrice = Number(productPriceOverride.price);
    marginAmount = finalPrice - basePrice;
  } else {
    // Apply general margin
    let marginPercentage = Number(customer.generalMargin);

    // Check for category-specific margin override
    if (product.category) {
      const categoryMargin = customer.customerMargins.find(
        (cm: { category: string; margin: number }) => cm.category === product.category,
      );
      if (categoryMargin) {
        marginPercentage = Number(categoryMargin.margin);
      }
    }

    // Calculate margin
    marginAmount = basePrice * (marginPercentage / 100);
    finalPrice = basePrice + marginAmount;

    // Apply brand-specific discount
    if (product.brand) {
      const brandDiscount = customer.customerDiscounts.find(
        (cd: { brand: string; discount: number }) => cd.brand === product.brand,
      );
      if (brandDiscount) {
        discountAmount = finalPrice * (Number(brandDiscount.discount) / 100);
        finalPrice -= discountAmount;
      }
    }
  }

  // Apply quantity-based discounts (tiered pricing)
  const quantityDiscount = await calculateQuantityDiscount(customerId, productId, quantity);

  if (quantityDiscount > 0) {
    const quantityDiscountAmount = finalPrice * (quantityDiscount / 100);
    discountAmount += quantityDiscountAmount;
    finalPrice -= quantityDiscountAmount;
  }

  // Round to 2 decimal places
  finalPrice = Math.round(finalPrice * 100) / 100;
  marginAmount = Math.round(marginAmount * 100) / 100;
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    basePrice,
    marginAmount,
    marginPercentage: productPriceOverride ? 0 : Number(customer.generalMargin),
    finalPrice,
    discountAmount,
    discountPercentage: 0, // Will be calculated based on final price
    totalPrice: finalPrice * quantity,
  };
}

/**
 * Calculate quantity-based discount
 */
async function calculateQuantityDiscount(
  customerId: string,
  productId: string,
  quantity: number,
): Promise<number> {
  // This is a simplified implementation
  // In a real system, you might have tiered pricing rules
  if (quantity >= 100) return 10; // 10% discount for 100+ items
  if (quantity >= 50) return 5; // 5% discount for 50+ items
  if (quantity >= 20) return 2; // 2% discount for 20+ items
  return 0;
}

/**
 * Calculate total order pricing
 */
export async function calculateOrderPricing(
  items: Array<{ productId: string; quantity: number }>,
  customerId: string,
): Promise<OrderPricing> {
  const orderItems: OrderItemPricing[] = [];
  let subtotal = 0;
  let totalMargin = 0;
  let totalDiscount = 0;
  let itemCount = 0;

  for (const item of items) {
    const pricing = await calculateProductPrice(item.productId, customerId, item.quantity);

    const orderItem: OrderItemPricing = {
      productId: item.productId,
      quantity: item.quantity,
      basePrice: pricing.basePrice,
      finalPrice: pricing.finalPrice,
      totalPrice: pricing.totalPrice,
      marginAmount: pricing.marginAmount * item.quantity,
      discountAmount: pricing.discountAmount * item.quantity,
    };

    orderItems.push(orderItem);
    subtotal += pricing.basePrice * item.quantity;
    totalMargin += orderItem.marginAmount;
    totalDiscount += orderItem.discountAmount;
    itemCount += item.quantity;
  }

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    items: orderItems,
    subtotal,
    totalMargin,
    totalDiscount,
    totalAmount,
    itemCount,
  };
}

/**
 * Validate order against business rules
 */
export async function validateOrder(
  items: Array<{ productId: string; quantity: number }>,
  customerId: string,
): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get customer and products
  const [customer, products] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
    }),
    prisma.product.findMany({
      where: {
        id: { in: items.map((item) => item.productId) },
      },
    }),
  ]);

  if (!customer) {
    errors.push("Customer not found");
    return { isValid: false, errors, warnings };
  }

  // Check minimum order value
  const orderPricing = await calculateOrderPricing(items, customerId);
  if (orderPricing.totalAmount < Number(customer.minimumOrderValue)) {
    errors.push(
      `Minimum order value is €${customer.minimumOrderValue}. Current total: €${orderPricing.totalAmount.toFixed(2)}`,
    );
  }

  // Check minimum order items
  const uniqueProducts = new Set(items.map((item) => item.productId)).size;
  if (uniqueProducts < customer.minimumOrderItems) {
    errors.push(
      `Minimum ${customer.minimumOrderItems} different products required. Current: ${uniqueProducts}`,
    );
  }

  // Check stock availability
  for (const item of items) {
    const product = products.find(
      (p: {
        id: string;
        name: string;
        stockQuantity: number;
        maxOrderableQuantity?: number | null;
      }) => p.id === item.productId,
    );
    if (!product) {
      errors.push(`Product not found: ${item.productId}`);
      continue;
    }

    if (product.stockQuantity < item.quantity) {
      errors.push(
        `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
      );
    }

    if (product.maxOrderableQuantity && item.quantity > product.maxOrderableQuantity) {
      errors.push(
        `Maximum order quantity exceeded for ${product.name}. Max: ${product.maxOrderableQuantity}, Requested: ${item.quantity}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
