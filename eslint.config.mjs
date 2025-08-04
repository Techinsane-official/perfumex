import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:prettier/recommended"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@next/next/no-img-element": "warn",
      "prettier/prettier": "error",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests for mocks
    },
  },
  // --- Node.js core modules blokkeren in client-bestanden ---
  // Deze override voorkomt dat server-only Node.js modules (zoals fs, path, crypto, etc.)
  // per ongeluk worden geïmporteerd in client-code (app/, components/), behalve in /app/api/ en /scripts/.
  // Dit voorkomt build errors en security-issues bij Next.js/Netlify deployments.
  {
    files: ["app/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}"],
    ignores: ["app/api/**", "scripts/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fs",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "path",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "crypto",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "os",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "child_process",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "net",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "tls",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "zlib",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "http",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
            {
              name: "https",
              message:
                "Node.js core modules zijn niet toegestaan in client-code. Gebruik alleen in server-bestanden of API routes.",
            },
          ],
          patterns: [
            "node:fs",
            "node:path",
            "node:crypto",
            "node:os",
            "node:child_process",
            "node:net",
            "node:tls",
            "node:zlib",
            "node:http",
            "node:https",
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
