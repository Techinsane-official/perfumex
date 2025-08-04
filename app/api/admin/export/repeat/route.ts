import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Parser } from "json2csv";
import * as XLSX from "xlsx";
import { toSafeString } from "@/lib/utils/decimal";
import { SafeJson, ExportParameters } from "@/types";
import puppeteer from "puppeteer";
import { Prisma } from "@prisma/client";

// Type guard to validate filters object
function isValidFilters(value: unknown): value is SafeJson {
  return typeof value === "object" && value !== null;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { exportHistoryId } = body;

    if (!exportHistoryId) {
      return NextResponse.json({ error: "Export history ID is required" }, { status: 400 });
    }

    // Fetch the original export history record
    const exportHistory = await prisma.exportHistory.findUnique({
      where: { id: exportHistoryId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!exportHistory) {
      return NextResponse.json({ error: "Export history not found" }, { status: 404 });
    }

    // Only allow repeating successful exports
    if (exportHistory.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Only successful exports can be repeated" },
        { status: 400 },
      );
    }

    const { exportType, exportFormat, parameters } = exportHistory;

    let fileBuffer: Buffer;
    let filename: string;
    let contentType: string;
    let recordCount: number;

    // Generate new filename with current timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    if (exportType === "PRODUCT") {
      // Handle product export
      const validatedParams = parameters as unknown as ExportParameters;
      const { format, columns, filters } = validatedParams;

      // Build where clause based on filters
      const where: Record<string, unknown> = {};

      if (isValidFilters(filters)) {
        const safeFilters = filters as SafeJson;

        if (safeFilters.brand) {
          where.brand = { contains: safeFilters.brand as string, mode: "insensitive" };
        }

        if (safeFilters.category) {
          where.category = safeFilters.category as string;
        }

        if (safeFilters.subcategory) {
          where.subcategory = safeFilters.subcategory as string;
        }

        if (safeFilters.availability && safeFilters.availability !== "all") {
          where.isActive = safeFilters.availability === "in_stock";
        }

        if (safeFilters.minRating || safeFilters.maxRating) {
          (where as Record<string, unknown>).starRating = {
            ...(safeFilters.minRating ? { gte: safeFilters.minRating as number } : {}),
            ...(safeFilters.maxRating ? { lte: safeFilters.maxRating as number } : {}),
          };
        }

        if (safeFilters.minPrice || safeFilters.maxPrice) {
          (where as Record<string, unknown>).retailPrice = {
            ...(safeFilters.minPrice ? { gte: safeFilters.minPrice as number } : {}),
            ...(safeFilters.maxPrice ? { lte: safeFilters.maxPrice as number } : {}),
          };
        }

        if (safeFilters.search) {
          where.OR = [
            { name: { contains: safeFilters.search as string, mode: "insensitive" } },
            { brand: { contains: safeFilters.search as string, mode: "insensitive" } },
            { ean: { contains: safeFilters.search as string } },
            { content: { contains: safeFilters.search as string, mode: "insensitive" } },
          ];
        }
      }

      // Fetch products with filters
      const products = await prisma.product.findMany({
        where,
        orderBy: { name: "asc" },
      });

      // Transform data based on selected columns
      const exportData = products.map((product) => {
        const row: Record<string, unknown> = {};

        columns.forEach((column: string) => {
          switch (column) {
            case "name":
              row["Product Naam"] = product.name;
              break;
            case "brand":
              row["Merk"] = product.brand;
              break;
            case "content":
              row["Inhoud/Grootte"] = product.content;
              break;
            case "ean":
              row["EAN Code"] = product.ean;
              break;
            case "purchasePrice":
              row["Inkoopprijs"] = toSafeString(product.purchasePrice);
              break;
            case "retailPrice":
              row["Verkoopprijs"] = toSafeString(product.retailPrice);
              break;
            case "stockQuantity":
              row["Voorraad"] = toSafeString(product.stockQuantity);
              break;
            case "maxOrderQuantity":
              row["Max Bestelling"] = toSafeString(product.maxOrderableQuantity);
              break;
            case "rating":
              row["Sterren"] = toSafeString(product.starRating);
              break;
            case "category":
              row["Categorie"] = product.category || "";
              break;
            case "subcategory":
              row["Subcategorie"] = product.subcategory || "";
              break;
            case "isAvailable":
              row["Beschikbaar"] = product.isActive ? "Ja" : "Nee";
              break;
            case "description":
              row["Beschrijving"] = product.description || "";
              break;
            case "tags":
              row["Tags"] = product.tags?.join(", ") || "";
              break;
            case "createdAt":
              row["Aangemaakt"] = product.createdAt?.toLocaleDateString("nl-NL") || "";
              break;
            case "updatedAt":
              row["Bijgewerkt"] = product.updatedAt?.toLocaleDateString("nl-NL") || "";
              break;
          }
        });

        return row;
      });

      recordCount = products.length;

      if (format === "csv") {
        // Generate CSV
        const parser = new Parser({
          fields: columns.map((col: string) => {
            const fieldMap: { [key: string]: string } = {
              name: "Product Naam",
              brand: "Merk",
              content: "Inhoud/Grootte",
              ean: "EAN Code",
              purchasePrice: "Inkoopprijs",
              retailPrice: "Verkoopprijs",
              stockQuantity: "Voorraad",
              maxOrderQuantity: "Max Bestelling",
              rating: "Sterren",
              category: "Categorie",
              subcategory: "Subcategorie",
              isAvailable: "Beschikbaar",
              description: "Beschrijving",
              tags: "Tags",
              createdAt: "Aangemaakt",
              updatedAt: "Bijgewerkt",
            };
            return fieldMap[col] || col;
          }),
        });

        const csv = parser.parse(exportData);
        fileBuffer = Buffer.from(csv, "utf-8");
        filename = `producten_export_${timestamp}.csv`;
        contentType = "text/csv";
      } else {
        // Generate Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Auto-size columns
        const columnWidths = columns.map((col: string) => {
          const maxLength = Math.max(
            col.length,
            ...exportData.map((row: Record<string, unknown>) => {
              const value = row[Object.keys(row).find((k2) => k2.includes(col)) || ""] || "";
              return value.toString().length;
            }),
          );
          return { width: Math.min(maxLength + 2, 50) };
        });

        worksheet["!cols"] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, "Producten");
        fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        filename = `producten_export_${timestamp}.xlsx`;
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }
    } else if (exportType === "ORDER") {
      // Handle order export
      const {
        orderIds,
        exportType: pdfExportType,
        includeCustomerInfo,
        includeProductDetails,
        includeTotals,
      } = parameters as SafeJson;

      // Fetch orders with related data
      const orders = await prisma.order.findMany({
        where: {
          id: { in: orderIds as string[] },
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

      recordCount = orders.length;

      // Generate PDF content
      const pdfContent = generateOrderPDFContent(orders, {
        exportType: pdfExportType as "individual" | "bundled",
        includeCustomerInfo: includeCustomerInfo as boolean,
        includeProductDetails: includeProductDetails as boolean,
        includeTotals: includeTotals as boolean,
      });

      // Generate PDF using Puppeteer
      fileBuffer = await generatePDF(pdfContent);
      filename = `orders-export-${timestamp}.pdf`;
      contentType = "application/pdf";
    } else {
      return NextResponse.json({ error: "Unsupported export type" }, { status: 400 });
    }

    // Log the repeat export
    try {
      await prisma.exportHistory.create({
        data: {
          userId: session.user.id,
          exportType,
          exportFormat,
          fileName: filename,
          fileSize: fileBuffer.length,
          parameters: parameters as unknown as Prisma.InputJsonValue,
          recordCount,
          status: "SUCCESS",
        },
      });
    } catch (error) {
      console.error("Failed to log repeat export history:", error);
      // Don't fail the export if history logging fails
    }

    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Repeat export error:", error);
    return NextResponse.json({ error: "Failed to repeat export" }, { status: 500 });
  }
}

// Helper functions for PDF generation (copied from order export)
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
    };
    user: {
      username: string;
    };
    orderItems: Array<{
      quantity: number;
      price: unknown;
      product: {
        name: string;
        brand: string;
        content: string;
        ean: string;
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
        const itemTotal = Number(item.price) * item.quantity;
        html += `
          <tr>
            <td>${item.product.name}</td>
            <td>${item.product.ean}</td>
            <td>${item.quantity}</td>
            <td>€${Number(item.price).toFixed(2)}</td>
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
        return sum + Number(item.price) * item.quantity;
      }, 0);

      html += `
        <div class="totals-section">
          <p><strong>Subtotal:</strong> €${subtotal.toFixed(2)}</p>
          <p class="total-row"><strong>Total Amount:</strong> €${Number(order.totalAmount).toFixed(2)}</p>
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
