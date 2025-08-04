import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Parser } from "json2csv";
import * as XLSX from "xlsx";
import { z } from "zod";

// Validation schema for bulk export request
const bulkExportSchema = z.object({
  exports: z.array(
    z.object({
      type: z.enum(["PRODUCT", "ORDER", "CUSTOMER"]),
      format: z.enum(["CSV", "EXCEL"]),
      columns: z.array(z.string()),
      filters: z.record(z.any()).optional(),
    }),
  ),
  includePricing: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkExportSchema.parse(body);

    const results = [];
    const errors = [];

    for (const exportConfig of validatedData.exports) {
      try {
        let data = [];
        let recordCount = 0;

        // Fetch data based on type
        switch (exportConfig.type) {
          case "PRODUCT":
            const products = await prisma.product.findMany({
              where: {
                // Apply filters if provided
                ...(exportConfig.filters?.brand && { brand: exportConfig.filters.brand }),
                ...(exportConfig.filters?.category && { category: exportConfig.filters.category }),
                ...(exportConfig.filters?.availability === "in_stock" && {
                  isActive: true,
                  stockQuantity: { gt: 0 },
                }),
                ...(exportConfig.filters?.availability === "out_of_stock" && {
                  OR: [{ isActive: false }, { stockQuantity: { lte: 0 } }],
                }),
                ...(exportConfig.filters?.search && {
                  OR: [
                    { name: { contains: exportConfig.filters.search, mode: "insensitive" } },
                    { brand: { contains: exportConfig.filters.search, mode: "insensitive" } },
                    { ean: { contains: exportConfig.filters.search } },
                  ],
                }),
                ...(exportConfig.filters?.minPrice && {
                  retailPrice: { gte: exportConfig.filters.minPrice },
                }),
                ...(exportConfig.filters?.maxPrice && {
                  retailPrice: { lte: exportConfig.filters.maxPrice },
                }),
                ...(exportConfig.filters?.minRating && {
                  starRating: { gte: exportConfig.filters.minRating },
                }),
                ...(exportConfig.filters?.maxRating && {
                  starRating: { lte: exportConfig.filters.maxRating },
                }),
              },
              orderBy: { createdAt: "desc" },
            });

            data = products.map((product) => {
              const row: Record<string, unknown> = {};
              exportConfig.columns.forEach((col) => {
                switch (col) {
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
                    row["Inkoopprijs"] = product.purchasePrice?.toString() || "";
                    break;
                  case "retailPrice":
                    row["Verkoopprijs"] = product.retailPrice?.toString() || "";
                    break;
                  case "stockQuantity":
                    row["Voorraad"] = product.stockQuantity?.toString() || "";
                    break;
                  case "maxOrderQuantity":
                    row["Max Bestelling"] = product.maxOrderableQuantity?.toString() || "";
                    break;
                  case "rating":
                    row["Sterren"] = product.starRating?.toString() || "";
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
            break;

          case "ORDER":
            const orders = await prisma.order.findMany({
              where: {
                // Apply filters if provided
                ...(exportConfig.filters?.status && { status: exportConfig.filters.status }),
                ...(exportConfig.filters?.search && {
                  OR: [
                    { id: { contains: exportConfig.filters.search } },
                    {
                      customer: {
                        name: { contains: exportConfig.filters.search, mode: "insensitive" },
                      },
                    },
                  ],
                }),
                ...(exportConfig.filters?.minDate && {
                  createdAt: { gte: new Date(exportConfig.filters.minDate) },
                }),
                ...(exportConfig.filters?.maxDate && {
                  createdAt: { lte: new Date(exportConfig.filters.maxDate) },
                }),
              },
              include: {
                customer: true,
                orderItems: {
                  include: {
                    product: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            });

            data = orders.map((order) => {
              const row: Record<string, unknown> = {};
              exportConfig.columns.forEach((col) => {
                switch (col) {
                  case "id":
                    row["Order ID"] = order.id;
                    break;
                  case "customerName":
                    row["Klant Naam"] = order.customer.name;
                    break;
                  case "customerEmail":
                    row["Klant Email"] = order.customer.email;
                    break;
                  case "status":
                    row["Status"] = order.status;
                    break;
                  case "totalAmount":
                    row["Totaal Bedrag"] = order.totalAmount?.toString() || "";
                    break;
                  case "itemCount":
                    row["Aantal Items"] = order.orderItems.length;
                    break;
                  case "createdAt":
                    row["Aangemaakt"] = order.createdAt?.toLocaleDateString("nl-NL") || "";
                    break;
                  case "updatedAt":
                    row["Bijgewerkt"] = order.updatedAt?.toLocaleDateString("nl-NL") || "";
                    break;
                }
              });
              return row;
            });
            recordCount = orders.length;
            break;

          case "CUSTOMER":
            const customers = await prisma.customer.findMany({
              where: {
                // Apply filters if provided
                ...(exportConfig.filters?.search && {
                  OR: [
                    { name: { contains: exportConfig.filters.search, mode: "insensitive" } },
                    { email: { contains: exportConfig.filters.search, mode: "insensitive" } },
                  ],
                }),
                ...(exportConfig.filters?.status && {
                  isActive: exportConfig.filters.status === "active",
                }),
              },
              orderBy: { createdAt: "desc" },
            });

            data = customers.map((customer) => {
              const row: Record<string, unknown> = {};
              exportConfig.columns.forEach((col) => {
                switch (col) {
                  case "name":
                    row["Klant Naam"] = customer.name;
                    break;
                  case "email":
                    row["Email"] = customer.email;
                    break;
                  case "phone":
                    row["Telefoon"] = customer.phone || "";
                    break;
                  case "address":
                    row["Adres"] = customer.address || "";
                    break;
                  case "generalMargin":
                    row["Algemene Marge"] = customer.generalMargin?.toString() || "";
                    break;
                  case "minimumOrderValue":
                    row["Min Bestelwaarde"] = customer.minimumOrderValue?.toString() || "";
                    break;
                  case "minimumOrderItems":
                    row["Min Aantal Items"] = customer.minimumOrderItems?.toString() || "";
                    break;
                  case "isActive":
                    row["Actief"] = customer.isActive ? "Ja" : "Nee";
                    break;
                  case "createdAt":
                    row["Aangemaakt"] = customer.createdAt?.toLocaleDateString("nl-NL") || "";
                    break;
                  case "updatedAt":
                    row["Bijgewerkt"] = customer.updatedAt?.toLocaleDateString("nl-NL") || "";
                    break;
                }
              });
              return row;
            });
            recordCount = customers.length;
            break;
        }

        // Generate file based on format
        let fileBuffer: Buffer;
        let filename: string;
        let contentType: string;

        if (exportConfig.format === "CSV") {
          const parser = new Parser({
            fields: exportConfig.columns.map((col) => {
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
                id: "Order ID",
                customerName: "Klant Naam",
                customerEmail: "Klant Email",
                status: "Status",
                totalAmount: "Totaal Bedrag",
                itemCount: "Aantal Items",
                email: "Email",
                phone: "Telefoon",
                address: "Adres",
                generalMargin: "Algemene Marge",
                minimumOrderValue: "Min Bestelwaarde",
                minimumOrderItems: "Min Aantal Items",
                isActive: "Actief",
              };
              return fieldMap[col] || col;
            }),
          });

          const csv = parser.parse(data);
          fileBuffer = Buffer.from(csv, "utf-8");
          filename = `${exportConfig.type.toLowerCase()}_export_${new Date().toISOString().split("T")[0]}.csv`;
          contentType = "text/csv";
        } else {
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.json_to_sheet(data);

          // Auto-size columns
          const columnWidths = exportConfig.columns.map((col) => {
            const maxLength = Math.max(
              col.length,
              ...data.map((row) => {
                const value = row[Object.keys(row).find((k) => k.includes(col)) || ""] || "";
                return value.toString().length;
              }),
            );
            return { width: Math.min(maxLength + 2, 50) };
          });

          worksheet["!cols"] = columnWidths;

          XLSX.utils.book_append_sheet(workbook, worksheet, exportConfig.type);
          fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
          filename = `${exportConfig.type.toLowerCase()}_export_${new Date().toISOString().split("T")[0]}.xlsx`;
          contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }

        // Log export history
        try {
          await prisma.exportHistory.create({
            data: {
              userId: session.user.id,
              exportType: exportConfig.type,
              exportFormat: exportConfig.format,
              fileName: filename,
              fileSize: fileBuffer.length,
              parameters: {
                format: exportConfig.format.toLowerCase(),
                columns: exportConfig.columns,
                filters: exportConfig.filters,
                includePricing: validatedData.includePricing,
              },
              recordCount,
              status: "SUCCESS",
            },
          });
        } catch (error) {
          console.error("Failed to log export history:", error);
        }

        results.push({
          type: exportConfig.type,
          format: exportConfig.format,
          filename,
          fileSize: fileBuffer.length,
          recordCount,
          fileBuffer: fileBuffer.toString("base64"),
          contentType,
        });
      } catch (error) {
        console.error(`Error exporting ${exportConfig.type}:`, error);
        errors.push({
          type: exportConfig.type,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      results,
      errors,
      totalExports: validatedData.exports.length,
      successfulExports: results.length,
      failedExports: errors.length,
    });
  } catch (error) {
    console.error("Bulk export error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid export data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Bulk export failed" }, { status: 500 });
  }
}
