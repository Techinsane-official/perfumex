import { PrismaClient, UserRole, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Check if users already exist
  const existingUsers = await prisma.user.findMany();
  if (existingUsers.length > 0) {
    console.log("Users already exist, skipping user creation");
  } else {
    // Hash password for admin
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create customers first
    const customer = await prisma.customer.create({
      data: {
        name: "Parfum Groothandel BV",
        email: "klant@parfumrijk.com",
        phone: "+31201234567",
        address: "Parfumstraat 1, 1000 AB Amsterdam",
        generalMargin: 15.0,
        minimumOrderValue: 100.0,
        minimumOrderItems: 5,
      },
    });
    console.log("Created customer:", customer.name);

    // Create users with customer relationship
    const admin = await prisma.user.create({
      data: {
        username: "mkalleche@gmail.com",
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });
    const buyer = await prisma.user.create({
      data: {
        username: "buyer",
        role: UserRole.BUYER,
        customerId: customer.id, // Link buyer to customer
      },
    });
    console.log("Created users:", {
      admin: admin.username,
      buyer: buyer.username,
    });
  }

  // Check if customers already exist
  const existingCustomers = await prisma.customer.findMany();
  if (existingCustomers.length > 0) {
    console.log("Customers already exist, skipping customer creation");
  } else {
    // Create customers
    const customer = await prisma.customer.create({
      data: {
        name: "Parfum Groothandel BV",
        email: "klant@parfumrijk.com",
        phone: "+31201234567",
        address: "Parfumstraat 1, 1000 AB Amsterdam",
        generalMargin: 15.0,
        minimumOrderValue: 100.0,
        minimumOrderItems: 5,
      },
    });
    console.log("Created customer:", customer.name);
  }

  // Check if products already exist
  const existingProducts = await prisma.product.findMany();
  if (existingProducts.length > 0) {
    console.log("Products already exist, skipping product creation");
  } else {
    // Create demo products
    await prisma.product.createMany({
      data: [
        {
          brand: "Chanel",
          name: "Bleu de Chanel Eau de Parfum",
          content: "100ml",
          ean: "3145891074604",
          purchasePrice: 45.0,
          retailPrice: 79.95,
          stockQuantity: 120,
          maxOrderableQuantity: 10,
          starRating: 5,
          category: "Parfum",
          subcategory: "Heren",
          description: "Een houtachtig aromatische geur met frisheid en diepte.",
          tags: ["luxe", "houtachtig", "populair"],
          isActive: true,
        },
        {
          brand: "Dior",
          name: "Sauvage Eau de Toilette",
          content: "100ml",
          ean: "3348901486383",
          purchasePrice: 47.5,
          retailPrice: 84.95,
          stockQuantity: 85,
          maxOrderableQuantity: 8,
          starRating: 5,
          category: "Parfum",
          subcategory: "Heren",
          description: "Fris, krachtig en mannelijk met ambroxan en peper.",
          tags: ["fris", "krachtig", "mannelijk"],
          isActive: true,
        },
        {
          brand: "Tom Ford",
          name: "Oud Wood",
          content: "50ml",
          ean: "888066000536",
          purchasePrice: 60.0,
          retailPrice: 124.95,
          stockQuantity: 40,
          maxOrderableQuantity: 5,
          starRating: 4,
          category: "Parfum",
          subcategory: "Unisex",
          description: "Mysterieus en houtachtig met o.a. agarhout en sandelhout.",
          tags: ["mysterieus", "houtachtig", "luxe"],
          isActive: true,
        },
        {
          brand: "YSL",
          name: "La Nuit de L'Homme",
          content: "100ml",
          ean: "3365440316560",
          purchasePrice: 41.0,
          retailPrice: 74.95,
          stockQuantity: 65,
          maxOrderableQuantity: 6,
          starRating: 4,
          category: "Parfum",
          subcategory: "Heren",
          description: "Kruidig oriëntaals met kardemom, lavendel en vetiver.",
          tags: ["kruidig", "oriëntaals", "spicy"],
          isActive: true,
        },
        {
          brand: "Giorgio Armani",
          name: "Acqua di Gio Profumo",
          content: "75ml",
          ean: "3614271380379",
          purchasePrice: 42.5,
          retailPrice: 82.95,
          stockQuantity: 72,
          maxOrderableQuantity: 7,
          starRating: 5,
          category: "Parfum",
          subcategory: "Heren",
          description: "Marineachtig en krachtig met wierook en bergamot.",
          tags: ["marine", "krachtig", "fris"],
          isActive: true,
        },
        {
          brand: "Creed",
          name: "Aventus",
          content: "100ml",
          ean: "3508441001114",
          purchasePrice: 120.0,
          retailPrice: 239.0,
          stockQuantity: 15,
          maxOrderableQuantity: 3,
          starRating: 5,
          category: "Parfum",
          subcategory: "Unisex",
          description: "Krachtige ananasgeur met houtige basisnoten.",
          tags: ["luxe", "exclusief", "krachtig"],
          isActive: true,
        },
        {
          brand: "Hermès",
          name: "Terre d'Hermès",
          content: "100ml",
          ean: "3346131400014",
          purchasePrice: 39.0,
          retailPrice: 69.95,
          stockQuantity: 90,
          maxOrderableQuantity: 9,
          starRating: 4,
          category: "Parfum",
          subcategory: "Heren",
          description: "Fris en aards met sinaasappel, vetiver en cederhout.",
          tags: ["fris", "aards", "natuurlijk"],
          isActive: true,
        },
        {
          brand: "Lattafa",
          name: "Khamrah",
          content: "100ml",
          ean: "6291107457244",
          purchasePrice: 18.0,
          retailPrice: 39.95,
          stockQuantity: 200,
          maxOrderableQuantity: 12,
          starRating: 5,
          category: "Parfum",
          subcategory: "Unisex",
          description: "Arabische gourmand met kaneel, dadel en vanille.",
          tags: ["arabisch", "gourmand", "zoet"],
          isActive: true,
        },
      ],
    });
    console.log("✅ Demo producten succesvol ingevoegd!");
  }

  // Check if orders already exist
  const existingOrders = await prisma.order.findMany();
  if (existingOrders.length > 0) {
    console.log("Orders already exist, skipping order creation");
  } else {
    // Get existing customer and buyer for order creation
    const customer = await prisma.customer.findFirst();
    const buyer = await prisma.user.findFirst({ where: { role: UserRole.BUYER } });
    const product1 = await prisma.product.findFirst();
    const product2 = await prisma.product.findFirst({ skip: 1 });

    if (customer && buyer && product1 && product2) {
      // Create order
      await prisma.order.create({
        data: {
          customerId: customer.id,
          userId: buyer.id,
          status: OrderStatus.PENDING,
          totalAmount: 100.0,
          notes: "Eerste testorder",
          orderItems: {
            create: [
              {
                productId: product1.id,
                quantity: 2,
                price: 60.0,
              },
              {
                productId: product2.id,
                quantity: 1,
                price: 35.0,
              },
            ],
          },
        },
      });
      console.log("Created test order");
    }
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
