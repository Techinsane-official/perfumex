import { prisma } from "@/lib/prisma";

export interface Translation {
  key: string;
  language: string;
  value: string;
  context?: string;
}

export interface I18nConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  fallbackLanguage: string;
}

const defaultConfig: I18nConfig = {
  defaultLanguage: "nl",
  supportedLanguages: ["nl", "en", "de", "fr"],
  fallbackLanguage: "nl",
};

class I18nService {
  private config: I18nConfig;
  private cache: Map<string, Map<string, string>> = new Map();

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async getTranslation(key: string, language: string, context?: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `${language}:${context || "default"}`;
      const cachedTranslations = this.cache.get(cacheKey);
      if (cachedTranslations?.has(key)) {
        return cachedTranslations.get(key)!;
      }

      // Query database
      const translation = await prisma.translation.findFirst({
        where: {
          key,
          language,
          context: context || null,
        },
      });

      if (translation) {
        // Cache the result
        if (!this.cache.has(cacheKey)) {
          this.cache.set(cacheKey, new Map());
        }
        this.cache.get(cacheKey)!.set(key, translation.value);
        return translation.value;
      }

      // Fallback to default language
      if (language !== this.config.fallbackLanguage) {
        return this.getTranslation(key, this.config.fallbackLanguage, context);
      }

      // Return key as fallback
      return key;
    } catch (error) {
      console.error("Error getting translation:", error);
      return key;
    }
  }

  async setTranslation(key: string, language: string, value: string, context?: string): Promise<void> {
    try {
      await prisma.translation.upsert({
        where: {
          key_language_context: {
            key,
            language,
            context: context || "",
          },
        },
        update: {
          value,
        },
        create: {
          key,
          language,
          value,
          context: context || "",
        },
      });

      // Clear cache for this language/context
      const cacheKey = `${language}:${context || "default"}`;
      this.cache.delete(cacheKey);
    } catch (error) {
      console.error("Error setting translation:", error);
    }
  }

  async loadTranslations(language: string, context?: string): Promise<Map<string, string>> {
    try {
      const translations = await prisma.translation.findMany({
        where: {
          language,
          context: context || null,
        },
      });

      const translationMap = new Map<string, string>();
      translations.forEach((t) => {
        translationMap.set(t.key, t.value);
      });

      // Cache the translations
      const cacheKey = `${language}:${context || "default"}`;
      this.cache.set(cacheKey, translationMap);

      return translationMap;
    } catch (error) {
      console.error("Error loading translations:", error);
      return new Map();
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      const languages = await prisma.translation.findMany({
        select: {
          language: true,
        },
        distinct: ["language"],
      });

      return languages.map((l) => l.language);
    } catch (error) {
      console.error("Error getting supported languages:", error);
      return this.config.supportedLanguages;
    }
  }

  // Helper method for common translations
  async t(key: string, language: string, context?: string): Promise<string> {
    return this.getTranslation(key, language, context);
  }

  // Batch translation method
  async translateBatch(keys: string[], language: string, context?: string): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.getTranslation(key, language, context);
      })
    );

    return result;
  }
}

// Create singleton instance
export const i18n = new I18nService();

// Common translation keys
export const COMMON_KEYS = {
  // Navigation
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  ORDERS: "orders",
  CUSTOMERS: "customers",
  USERS: "users",
  PICKLISTS: "picklists",
  REPORTS: "reports",
  SETTINGS: "settings",

  // Actions
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  SAVE: "save",
  CANCEL: "cancel",
  CONFIRM: "confirm",
  APPROVE: "approve",
  REJECT: "reject",
  PICK: "pick",
  SCAN: "scan",

  // Status
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  APPROVED: "approved",
  REJECTED: "rejected",

  // Messages
  LOADING: "loading",
  NO_DATA: "no_data",
  ERROR: "error",
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",

  // Form labels
  NAME: "name",
  EMAIL: "email",
  PHONE: "phone",
  ADDRESS: "address",
  QUANTITY: "quantity",
  PRICE: "price",
  TOTAL: "total",
  DATE: "date",
  STATUS: "status",
  DESCRIPTION: "description",
} as const;

// Initialize default translations
export async function initializeTranslations(): Promise<void> {
  const defaultTranslations = [
    // Dutch translations
    { key: "dashboard", language: "nl", value: "Dashboard" },
    { key: "products", language: "nl", value: "Producten" },
    { key: "orders", language: "nl", value: "Bestellingen" },
    { key: "customers", language: "nl", value: "Klanten" },
    { key: "users", language: "nl", value: "Gebruikers" },
    { key: "picklists", language: "nl", value: "Picklijsten" },
    { key: "reports", language: "nl", value: "Rapporten" },
    { key: "settings", language: "nl", value: "Instellingen" },
    { key: "create", language: "nl", value: "Aanmaken" },
    { key: "edit", language: "nl", value: "Bewerken" },
    { key: "delete", language: "nl", value: "Verwijderen" },
    { key: "save", language: "nl", value: "Opslaan" },
    { key: "cancel", language: "nl", value: "Annuleren" },
    { key: "confirm", language: "nl", value: "Bevestigen" },
    { key: "approve", language: "nl", value: "Goedkeuren" },
    { key: "reject", language: "nl", value: "Afwijzen" },
    { key: "pick", language: "nl", value: "Picken" },
    { key: "scan", language: "nl", value: "Scannen" },
    { key: "pending", language: "nl", value: "In afwachting" },
    { key: "in_progress", language: "nl", value: "In behandeling" },
    { key: "completed", language: "nl", value: "Voltooid" },
    { key: "cancelled", language: "nl", value: "Geannuleerd" },
    { key: "approved", language: "nl", value: "Goedgekeurd" },
    { key: "rejected", language: "nl", value: "Afgewezen" },
    { key: "loading", language: "nl", value: "Laden..." },
    { key: "no_data", language: "nl", value: "Geen gegevens gevonden" },
    { key: "error", language: "nl", value: "Fout" },
    { key: "success", language: "nl", value: "Succes" },
    { key: "warning", language: "nl", value: "Waarschuwing" },
    { key: "info", language: "nl", value: "Informatie" },

    // English translations
    { key: "dashboard", language: "en", value: "Dashboard" },
    { key: "products", language: "en", value: "Products" },
    { key: "orders", language: "en", value: "Orders" },
    { key: "customers", language: "en", value: "Customers" },
    { key: "users", language: "en", value: "Users" },
    { key: "picklists", language: "en", value: "Picklists" },
    { key: "reports", language: "en", value: "Reports" },
    { key: "settings", language: "en", value: "Settings" },
    { key: "create", language: "en", value: "Create" },
    { key: "edit", language: "en", value: "Edit" },
    { key: "delete", language: "en", value: "Delete" },
    { key: "save", language: "en", value: "Save" },
    { key: "cancel", language: "en", value: "Cancel" },
    { key: "confirm", language: "en", value: "Confirm" },
    { key: "approve", language: "en", value: "Approve" },
    { key: "reject", language: "en", value: "Reject" },
    { key: "pick", language: "en", value: "Pick" },
    { key: "scan", language: "en", value: "Scan" },
    { key: "pending", language: "en", value: "Pending" },
    { key: "in_progress", language: "en", value: "In Progress" },
    { key: "completed", language: "en", value: "Completed" },
    { key: "cancelled", language: "en", value: "Cancelled" },
    { key: "approved", language: "en", value: "Approved" },
    { key: "rejected", language: "en", value: "Rejected" },
    { key: "loading", language: "en", value: "Loading..." },
    { key: "no_data", language: "en", value: "No data found" },
    { key: "error", language: "en", value: "Error" },
    { key: "success", language: "en", value: "Success" },
    { key: "warning", language: "en", value: "Warning" },
    { key: "info", language: "en", value: "Information" },
  ];

  for (const translation of defaultTranslations) {
    await i18n.setTranslation(
      translation.key,
      translation.language,
      translation.value
    );
  }
} 