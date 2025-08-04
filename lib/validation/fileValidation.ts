import { z } from "zod";

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  csv: {
    extensions: [".csv"],
    mimeTypes: ["text/csv", "application/csv"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  excel: {
    extensions: [".xlsx", ".xls"],
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
};

// Required columns for product import
export const REQUIRED_COLUMNS = [
  "name",
  "brand",
  "content",
  "ean",
  "purchasePrice",
  "retailPrice",
  "stockQuantity",
];

// Optional columns
export const OPTIONAL_COLUMNS = [
  "maxOrderableQuantity",
  "starRating",
  "category",
  "subcategory",
  "description",
  "tags",
];

// Column validation schemas
export const COLUMN_VALIDATIONS = {
  name: z
    .string()
    .min(1, "Productnaam is verplicht")
    .max(100, "Productnaam mag maximaal 100 tekens zijn"),
  brand: z.string().min(1, "Merk is verplicht").max(50, "Merk mag maximaal 50 tekens zijn"),
  content: z.string().min(1, "Inhoud is verplicht"),
  ean: z.string().regex(/^\d{13}$/, "EAN moet exact 13 cijfers bevatten"),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Inkoopprijs moet een geldig bedrag zijn"),
  retailPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Verkoopprijs moet een geldig bedrag zijn"),
  stockQuantity: z.string().regex(/^\d+$/, "Voorraad moet een geheel getal zijn"),
  maxOrderableQuantity: z.string().optional(),
  starRating: z
    .string()
    .regex(/^[0-5]$/, "Sterrenrating moet tussen 0-5 zijn")
    .optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
};

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
  dataPreview?: {
    headers: string[];
    rowCount: number;
    sampleRows: Record<string, unknown>[];
  };
}

export interface ColumnValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingColumns: string[];
  extraColumns: string[];
  columnMapping: Record<string, string>;
}

export class FileValidator {
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file existence
    if (!file) {
      return {
        isValid: false,
        errors: ["Geen bestand geselecteerd"],
        warnings: [],
      };
    }

    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      extension,
    };

    // Validate file type
    const isCsv =
      SUPPORTED_FILE_TYPES.csv.extensions.includes(`.${extension}`) ||
      SUPPORTED_FILE_TYPES.csv.mimeTypes.includes(file.type);
    const isExcel =
      SUPPORTED_FILE_TYPES.excel.extensions.includes(`.${extension}`) ||
      SUPPORTED_FILE_TYPES.excel.mimeTypes.includes(file.type);

    if (!isCsv && !isExcel) {
      errors.push("Alleen CSV en Excel bestanden zijn toegestaan");
    }

    // Validate file size
    const maxSize = isCsv ? SUPPORTED_FILE_TYPES.csv.maxSize : SUPPORTED_FILE_TYPES.excel.maxSize;
    if (file.size > maxSize) {
      errors.push(`Bestand is te groot. Maximum: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Check for empty file
    if (file.size === 0) {
      errors.push("Bestand is leeg");
    }

    // Warnings for large files
    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      warnings.push("Groot bestand gedetecteerd. Import kan langer duren.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo,
    };
  }

  static validateHeaders(headers: string[]): ColumnValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingColumns: string[] = [];
    const extraColumns: string[] = [];
    const columnMapping: Record<string, string> = {};

    // Check for required columns
    for (const requiredCol of REQUIRED_COLUMNS) {
      const found = headers.find(
        (h) =>
          h.toLowerCase().trim() === requiredCol.toLowerCase() ||
          h.toLowerCase().trim() ===
            requiredCol
              .toLowerCase()
              .replace(/([A-Z])/g, " $1")
              .toLowerCase(),
      );

      if (!found) {
        missingColumns.push(requiredCol);
        errors.push(`Verplichte kolom ontbreekt: ${requiredCol}`);
      } else {
        columnMapping[requiredCol] = found;
      }
    }

    // Check for optional columns
    for (const optionalCol of OPTIONAL_COLUMNS) {
      const found = headers.find(
        (h) =>
          h.toLowerCase().trim() === optionalCol.toLowerCase() ||
          h.toLowerCase().trim() ===
            optionalCol
              .toLowerCase()
              .replace(/([A-Z])/g, " $1")
              .toLowerCase(),
      );

      if (found) {
        columnMapping[optionalCol] = found;
      }
    }

    // Check for extra columns
    const allExpectedColumns = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
    for (const header of headers) {
      const isExpected = allExpectedColumns.some(
        (expected) =>
          header.toLowerCase().trim() === expected.toLowerCase() ||
          header.toLowerCase().trim() ===
            expected
              .toLowerCase()
              .replace(/([A-Z])/g, " $1")
              .toLowerCase(),
      );

      if (!isExpected) {
        extraColumns.push(header);
        warnings.push(`Onbekende kolom: ${header}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingColumns,
      extraColumns,
      columnMapping,
    };
  }

  static validateRow(
    row: Record<string, unknown>,
    columnMapping: Record<string, string>,
    rowIndex: number,
  ): string[] {
    const errors: string[] = [];

    for (const [expectedCol, actualCol] of Object.entries(columnMapping)) {
      const value = row[actualCol];
      const validationSchema = COLUMN_VALIDATIONS[expectedCol as keyof typeof COLUMN_VALIDATIONS];

      if (validationSchema) {
        try {
          validationSchema.parse(value);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Rij ${rowIndex + 1}, kolom "${actualCol}": ${error.errors[0].message}`);
          }
        }
      }
    }

    return errors;
  }

  static validateData(
    data: Record<string, unknown>[],
    columnMapping: Record<string, string>,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validRows: number;
    invalidRows: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validRows = 0;
    let invalidRows = 0;

    // Check for empty data
    if (data.length === 0) {
      errors.push("Geen data gevonden in bestand");
      return { isValid: false, errors, warnings, validRows, invalidRows };
    }

    // Validate each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row) {
        const rowErrors = this.validateRow(row, columnMapping, i);

        if (rowErrors.length > 0) {
          invalidRows++;
          errors.push(...rowErrors);
        } else {
          validRows++;
        }
      }
    }

    // Warnings for large datasets
    if (data.length > 1000) {
      warnings.push(`Grote dataset gedetecteerd: ${data.length} rijen`);
    }

    // Warning if many invalid rows
    if (invalidRows > 0 && invalidRows > data.length * 0.1) {
      warnings.push(
        `Veel ongeldige rijen: ${invalidRows}/${data.length} (${((invalidRows / data.length) * 100).toFixed(1)}%)`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows,
      invalidRows,
    };
  }
}
