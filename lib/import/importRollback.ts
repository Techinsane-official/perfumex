import { prisma } from "@/lib/prisma";
import { getImportHistoryById } from "./importHistory";

export interface RollbackResult {
  success: boolean;
  message: string;
  rolledBackProducts: number;
  errors: string[];
}

export interface RollbackOptions {
  importId: string;
  rollbackStrategy: "all" | "failed_only" | "selective";
  confirmRollback: boolean;
  backupBeforeRollback: boolean;
}

/**
 * Rollback functionality for failed imports
 * This allows administrators to undo import changes and restore the database
 */
export class ImportRollback {
  private importId: string;
  private importEntry: Record<string, unknown> | null = null;

  constructor(importId: string) {
    this.importId = importId;
  }

  /**
   * Initialize rollback by loading import history
   */
  async initialize(): Promise<boolean> {
    try {
      this.importEntry = await getImportHistoryById(this.importId);
      if (!this.importEntry) {
        throw new Error(`Import with ID ${this.importId} not found`);
      }

      // Only allow rollback for completed or failed imports
      if (this.importEntry.status === "cancelled") {
        throw new Error("Cannot rollback cancelled imports");
      }

      return true;
    } catch (error) {
      console.error("Error initializing rollback:", error);
      return false;
    }
  }

  /**
   * Create a backup of current state before rollback
   */
  private async createBackup(): Promise<string> {
    const backupId = `backup_${this.importId}_${Date.now()}`;

    // Create backup of products that were imported in this session
    const importedProducts = await prisma.product.findMany({
      where: {
        importSessionId: this.importId,
      },
    });

    // Store backup in a separate table or file
    await prisma.importBackup.create({
      data: {
        id: backupId,
        importId: this.importId,
        backupData: JSON.stringify(importedProducts),
        createdAt: new Date(),
        description: `Backup before rollback of import ${this.importId}`,
      },
    });

    return backupId;
  }

  /**
   * Execute rollback based on strategy
   */
  async executeRollback(options: RollbackOptions): Promise<RollbackResult> {
    try {
      if (!this.importEntry) {
        await this.initialize();
      }

      if (!this.importEntry) {
        return {
          success: false,
          message: "Import not found or cannot be rolled back",
          rolledBackProducts: 0,
          errors: ["Import not found"],
        };
      }

      // Create backup if requested
      let backupId: string | null = null;
      if (options.backupBeforeRollback) {
        backupId = await this.createBackup();
      }

      let rolledBackProducts = 0;
      const errors: string[] = [];

      switch (options.rollbackStrategy) {
        case "all":
          rolledBackProducts = await this.rollbackAllProducts();
          break;

        case "failed_only":
          rolledBackProducts = await this.rollbackFailedProducts();
          break;

        case "selective":
          rolledBackProducts = await this.rollbackSelectiveProducts();
          break;

        default:
          throw new Error("Invalid rollback strategy");
      }

      // Update import history with rollback information
      await prisma.importHistory.update({
        where: { id: this.importId },
        data: {
          status: "rolled_back",
          notes: `${this.importEntry.notes || ""}\n\nRollback executed: ${rolledBackProducts} products rolled back. Backup ID: ${backupId || "None"}`,
        },
      });

      return {
        success: true,
        message: `Successfully rolled back ${rolledBackProducts} products`,
        rolledBackProducts,
        errors,
      };
    } catch (error) {
      console.error("Rollback error:", error);
      return {
        success: false,
        message: "Rollback failed",
        rolledBackProducts: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Rollback all products from this import
   */
  private async rollbackAllProducts(): Promise<number> {
    const result = await prisma.product.deleteMany({
      where: {
        importSessionId: this.importId,
      },
    });

    return result.count;
  }

  /**
   * Rollback only products that had errors during import
   */
  private async rollbackFailedProducts(): Promise<number> {
    // This would require tracking which specific products failed during import
    // For now, we'll implement a basic version that rolls back products with errors
    const failedProducts = await prisma.product.findMany({
      where: {
        importSessionId: this.importId,
        // Add conditions for failed products (e.g., validation errors)
        OR: [{ name: null }, { ean: null }, { purchasePrice: null }],
      },
    });

    const deleteResult = await prisma.product.deleteMany({
      where: {
        id: {
          in: failedProducts.map((p) => p.id),
        },
      },
    });

    return deleteResult.count;
  }

  /**
   * Rollback selective products (for future implementation)
   */
  private async rollbackSelectiveProducts(): Promise<number> {
    // This would allow administrators to select specific products to rollback
    // For now, we'll implement a basic version
    return await this.rollbackAllProducts();
  }

  /**
   * Get rollback preview - shows what would be rolled back
   */
  async getRollbackPreview(strategy: "all" | "failed_only" | "selective"): Promise<{
    totalProducts: number;
    productsToRollback: number;
    estimatedImpact: string;
    warnings: string[];
  }> {
    try {
      if (!this.importEntry) {
        await this.initialize();
      }

      const totalProducts = await prisma.product.count({
        where: { importSessionId: this.importId },
      });

      let productsToRollback = 0;
      const warnings: string[] = [];

      switch (strategy) {
        case "all":
          productsToRollback = totalProducts;
          if (totalProducts > 100) {
            warnings.push("Large rollback detected - this may take significant time");
          }
          break;

        case "failed_only":
          const failedCount = await prisma.product.count({
            where: {
              importSessionId: this.importId,
              OR: [{ name: null }, { ean: null }, { purchasePrice: null }],
            },
          });
          productsToRollback = failedCount;
          break;

        case "selective":
          productsToRollback = totalProducts; // Default to all for selective
          warnings.push("Selective rollback requires manual product selection");
          break;
      }

      const estimatedImpact = this.getEstimatedImpact(productsToRollback);

      return {
        totalProducts,
        productsToRollback,
        estimatedImpact,
        warnings,
      };
    } catch (error) {
      console.error("Error getting rollback preview:", error);
      return {
        totalProducts: 0,
        productsToRollback: 0,
        estimatedImpact: "Unknown",
        warnings: ["Error calculating rollback preview"],
      };
    }
  }

  /**
   * Get estimated impact of rollback
   */
  private getEstimatedImpact(productCount: number): string {
    if (productCount === 0) {
      return "No impact - no products to rollback";
    } else if (productCount < 10) {
      return "Low impact - quick rollback";
    } else if (productCount < 100) {
      return "Medium impact - moderate rollback time";
    } else {
      return "High impact - may take significant time";
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<RollbackResult> {
    try {
      const backup = await prisma.importBackup.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        return {
          success: false,
          message: "Backup not found",
          rolledBackProducts: 0,
          errors: ["Backup not found"],
        };
      }

      let backupData;
      try {
        backupData = JSON.parse(backup.backupData);
      } catch (error) {
        console.error("Error parsing backup data:", error);
        return {
          success: false,
          message: "Invalid backup data format",
          rolledBackProducts: 0,
          errors: ["Invalid backup data format"],
        };
      }

      // Restore products from backup
      const restoredProducts = await prisma.product.createMany({
        data: backupData.map((product: Record<string, unknown>) => ({
          ...product,
          id: undefined, // Let Prisma generate new IDs
          importSessionId: this.importId,
        })),
      });

      return {
        success: true,
        message: `Successfully restored ${restoredProducts.count} products from backup`,
        rolledBackProducts: restoredProducts.count,
        errors: [],
      };
    } catch (error) {
      console.error("Restore error:", error);
      return {
        success: false,
        message: "Restore failed",
        rolledBackProducts: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Get available backups for this import
   */
  async getAvailableBackups(): Promise<
    Array<{
      id: string;
      createdAt: Date;
      description: string;
    }>
  > {
    const backups = await prisma.importBackup.findMany({
      where: { importId: this.importId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        description: true,
      },
    });

    return backups;
  }
}
