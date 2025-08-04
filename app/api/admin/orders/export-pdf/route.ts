import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";
import { z } from "zod";
import { toSafeNumber } from "@/lib/utils/decimal";

// Validation schema for export request
const exportRequestSchema = z.object({
  orderIds: z.array(z.string()).min(1, "At least one order ID is required"),
  exportType: z.enum(["individual", "bundled"]).default("bundled"),
  includeCustomerInfo: z.boolean().default(true),
  includeProductDetails: z.boolean().default(true),
  includeTotals: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = exportRequestSchema.parse(body);
    const { orderIds, exportType, includeCustomerInfo, includeProductDetails, includeTotals } =
      validatedData;

    // Fetch orders with related data
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        customer: true,
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 });
    }

    // Generate PDF content
    const pdfContent = generateOrderPDFContent(orders, {
      exportType,
      includeCustomerInfo,
      includeProductDetails,
      includeTotals,
    });

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDF(pdfContent);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `orders-export-${timestamp}.pdf`;

    // Log export history
    try {
      await prisma.exportHistory.create({
        data: {
          userId: session.user.id,
          exportType: "ORDER",
          exportFormat: "PDF",
          fileName: filename,
          fileSize: pdfBuffer.length,
          parameters: {
            orderIds,
            exportType,
            includeCustomerInfo,
            includeProductDetails,
            includeTotals,
          },
          recordCount: orders.length,
          status: "SUCCESS",
        },
      });
    } catch (error) {
      console.error("Failed to log export history:", error);
      // Don't fail the export if history logging fails
    }

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

function generateOrderPDFContent(
  orders: Array<{
    id: string;
    status: string;
    totalAmount: unknown;
    createdAt: Date;
    updatedAt: Date;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectionReason: string | null;
    notes: string | null;
    customer: {
      name: string;
      email: string;
      phone: string | null;
      address: string | null;
      company?: string;
    };
    user: {
      username: string;
    };
    orderItems: Array<{
      quantity: number;
      price: unknown;
      product: {
        name: string;
        sku?: string;
        brand: string;
        content: string;
      };
    }>;
  }>,
  options: {
    exportType: "individual" | "bundled";
    includeCustomerInfo: boolean;
    includeProductDetails: boolean;
    includeTotals: boolean;
  },
) {
  const { exportType, includeCustomerInfo, includeProductDetails, includeTotals } = options;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Order Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .order-section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .order-header {
          background-color: #f5f5f5;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 5px;
        }
        .order-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .customer-info {
          background-color: #f9f9f9;
          padding: 10px;
          border-radius: 5px;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .products-table th,
        .products-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .products-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .totals-section {
          margin-top: 20px;
          text-align: right;
        }
        .total-row {
          font-weight: bold;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-approved { background-color: #d4edda; color: #155724; }
        .status-rejected { background-color: #f8d7da; color: #721c24; }
        .status-cancelled { background-color: #e2e3e5; color: #383d41; }
        .page-break {
          page-break-before: always;
        }
        @media print {
          body { margin: 0; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Project X - Order Export</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
  `;

  orders.forEach((order, index) => {
    if (exportType === "individual" && index > 0) {
      html += '<div class="page-break"></div>';
    }

    html += `
      <div class="order-section">
        <div class="order-header">
          <h2>Order #${order.id}</h2>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
        </div>
    `;

    if (includeCustomerInfo) {
      html += `
        <div class="order-info">
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customer.name}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone || "N/A"}</p>
            <p><strong>Address:</strong> ${order.customer.address || "N/A"}</p>
            <p><strong>Company:</strong> ${order.customer.company || "N/A"}</p>
          </div>
          <div class="customer-info">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Updated:</strong> ${new Date(order.updatedAt).toLocaleString()}</p>
            <p><strong>User:</strong> ${order.user.username}</p>
            ${order.approvedBy ? `<p><strong>Approved By:</strong> ${order.approvedBy}</p>` : ""}
            ${order.approvedAt ? `<p><strong>Approved At:</strong> ${new Date(order.approvedAt).toLocaleString()}</p>` : ""}
            ${order.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${order.rejectionReason}</p>` : ""}
          </div>
        </div>
      `;
    }

    if (includeProductDetails && order.orderItems.length > 0) {
      html += `
        <h3>Products</h3>
        <table class="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Price per Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
      `;

      order.orderItems.forEach((item) => {
        const itemTotal = toSafeNumber(item.price as unknown) * item.quantity;
        html += `
          <tr>
            <td>${item.product.name}</td>
            <td>${item.product.sku || "N/A"}</td>
            <td>${item.quantity}</td>
            <td>€${toSafeNumber(item.price as unknown).toFixed(2)}</td>
            <td>€${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    } else {
      html += `
        <div style="text-align: center; padding: 20px; color: #666;">
          <p>No products found for this order</p>
        </div>
      `;
    }

    if (includeTotals) {
      const subtotal = order.orderItems.reduce((sum: number, item) => {
        return sum + toSafeNumber(item.price as unknown) * item.quantity;
      }, 0);

      html += `
        <div class="totals-section">
          <p><strong>Subtotal:</strong> €${subtotal.toFixed(2)}</p>
          <p class="total-row"><strong>Total Amount:</strong> €${toSafeNumber(order.totalAmount as unknown).toFixed(2)}</p>
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
        </div>
      `;
    }

    html += `
      </div>
    `;
  });

  html += `
    </body>
    </html>
  `;

  return html;
}

async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set content and wait for rendering
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF with A4 format
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
