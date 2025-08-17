import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import * as XLSX from "xlsx";
import { Decimal } from "decimal.js";

interface ImportResult {
  success: boolean;
  message: string;
  row?: number;
  field?: string;
}

interface ProductRow {
  name: string;
  brand: string;
  content: string;
  ean: string;
  purchasePrice: number;
  retailPrice: number;
  stockQuantity: number;
  maxOrderableQuantity?: number;
  starRating?: number;
  category?: string;
  subcategory?: string;
  description?: string;
  tags?: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV and Excel files are allowed." },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), "temp");
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (error) {
      console.error("Error creating temp directory:", error);
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    // Parse file
    let rows: any[] = [];
    try {
      if (file.type === "text/csv") {
        // For CSV files, use proper CSV parsing
        const csvText = buffer.toString('utf-8');
        const workbook = XLSX.read(csvText, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else {
        // For Excel files
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      return NextResponse.json(
        { error: "Failed to parse file. Please check the file format." },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data found in file." },
        { status: 400 }
      );
    }

    console.log("Parsed rows:", rows.length);
    console.log("First row sample:", rows[0]);

    const results: ImportResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel/CSV is 1-indexed and we have headers

      try {
        // Validate required fields
        const requiredFields = ["name", "brand", "content", "ean", "purchasePrice", "retailPrice"];
        for (const field of requiredFields) {
          if (!row[field]) {
            results.push({
              success: false,
              message: `Missing required field: ${field}`,
              row: rowNumber,
              field,
            });
            errorCount++;
            continue;
          }
        }

        // Validate EAN uniqueness
        const existingProduct = await prisma.product.findUnique({
          where: { ean: row.ean },
        });

        if (existingProduct) {
          results.push({
            success: false,
            message: `EAN ${row.ean} already exists`,
            row: rowNumber,
            field: "ean",
          });
          errorCount++;
          continue;
        }

        // Validate numeric fields
        const numericFields = ["purchasePrice", "retailPrice", "stockQuantity"];
        for (const field of numericFields) {
          if (row[field] && isNaN(Number(row[field]))) {
            results.push({
              success: false,
              message: `Invalid numeric value for ${field}`,
              row: rowNumber,
              field,
            });
            errorCount++;
            continue;
          }
        }

        // Parse tags
        const tags = row.tags ? row.tags.split(",").map((tag: string) => tag.trim()) : [];

        console.log(`Creating product for row ${rowNumber}:`, {
          name: row.name,
          brand: row.brand,
          content: row.content,
          ean: row.ean,
          purchasePrice: row.purchasePrice,
          retailPrice: row.retailPrice,
          stockQuantity: row.stockQuantity
        });

        // Create product with proper Decimal types
        const product = await prisma.product.create({
          data: {
            name: row.name,
            brand: row.brand,
            content: row.content,
            ean: row.ean,
            purchasePrice: new Decimal(row.purchasePrice),
            retailPrice: new Decimal(row.retailPrice),
            stockQuantity: parseInt(row.stockQuantity) || 0,
            maxOrderableQuantity: row.maxOrderableQuantity ? parseInt(row.maxOrderableQuantity) : 10,
            starRating: row.starRating ? parseInt(row.starRating) : 0,
            category: row.category || "Uncategorized",
            subcategory: row.subcategory || "",
            description: row.description || "",
            tags,
            status: row.status || "ACTIEF",
            isActive: true,
          },
        });

        console.log(`Product created successfully:`, product.id);

        results.push({
          success: true,
          message: `Product "${row.name}" successfully imported`,
          row: rowNumber,
        });

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.push({
          success: false,
          message: `Error processing row: ${error instanceof Error ? error.message : "Unknown error"}`,
          row: rowNumber,
        });
        errorCount++;
      }
    }

    // Clean up temp file
    try {
      await writeFile(tempPath, ""); // Clear the file
    } catch (error) {
      console.error("Error cleaning up temp file:", error);
    }

    return NextResponse.json({
      results,
      summary: {
        total: rows.length,
        success: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 