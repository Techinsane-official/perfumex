import { readFileSync } from "fs";
import { join } from "path";

describe("test/setup.ts sanity checks", () => {
  let setupContent: string;

  beforeAll(() => {
    // Read the test setup file
    const setupPath = join(process.cwd(), "test", "setup.ts");
    setupContent = readFileSync(setupPath, "utf-8");
  });

  test("should not contain JSX syntax", () => {
    // Check for JSX patterns that should not be in .ts files
    const jsxPatterns = [
      /<[A-Z][a-zA-Z]*\s/, // JSX elements starting with capital letter
      /<\/[A-Z][a-zA-Z]*>/, // JSX closing tags
      /<[a-z][a-zA-Z]*\s/, // JSX elements starting with lowercase
      /<\/[a-z][a-zA-Z]*>/, // JSX closing tags
      /<[A-Z][a-zA-Z]*>/, // Self-closing JSX elements
      /<[a-z][a-zA-Z]*>/, // Self-closing JSX elements
    ];

    const foundJsx = jsxPatterns.some((pattern) => pattern.test(setupContent));
    expect(foundJsx).toBe(false);
  });

  test("should use React.createElement instead of JSX", () => {
    // Should contain React.createElement for image mock
    expect(setupContent).toMatch(/React\.createElement/);

    // Should not contain JSX syntax
    expect(setupContent).not.toMatch(/<img\s/);
    expect(setupContent).not.toMatch(/<\/img>/);
  });

  test("should not import server-only Node.js modules", () => {
    const forbiddenModules = [
      "fs",
      "path",
      "crypto",
      "os",
      "child_process",
      "net",
      "tls",
      "zlib",
      "http",
      "https",
      "util",
      "querystring",
      "url",
      "stream",
      "buffer",
      "events",
      "assert",
      "constants",
      "domain",
      "punycode",
      "string_decoder",
      "timers",
      "tty",
      "vm",
      "worker_threads",
      "cluster",
      "dgram",
      "dns",
      "module",
      "perf_hooks",
      "readline",
      "repl",
      "v8",
      "inspector",
      "trace_events",
      "wasi",
    ];

    const forbiddenImports = forbiddenModules.filter((module) => {
      const importPattern = new RegExp(`import.*['"]${module}['"]`, "g");
      const requirePattern = new RegExp(`require\\(['"]${module}['"]\\)`, "g");
      return importPattern.test(setupContent) || requirePattern.test(setupContent);
    });

    expect(forbiddenImports).toEqual([]);
  });

  test("should mock next/image correctly", () => {
    // Should contain vi.mock for next/image
    expect(setupContent).toMatch(/vi\.mock\('next\/image'/);

    // Should use React.createElement in the mock
    expect(setupContent).toMatch(/React\.createElement\('img'/);

    // Should have __esModule: true for ESM compatibility
    expect(setupContent).toMatch(/__esModule:\s*true/);
  });

  test("should mock next/navigation correctly", () => {
    // Should contain vi.mock for next/navigation
    expect(setupContent).toMatch(/vi\.mock\('next\/navigation'/);

    // Should mock all required navigation hooks
    expect(setupContent).toMatch(/useRouter/);
    expect(setupContent).toMatch(/useSearchParams/);
    expect(setupContent).toMatch(/usePathname/);
  });

  test("should set required environment variables", () => {
    // Should set test environment variables
    expect(setupContent).toMatch(/NEXTAUTH_SECRET/);
    expect(setupContent).toMatch(/NEXTAUTH_URL/);
    expect(setupContent).toMatch(/DATABASE_URL/);
    expect(setupContent).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(setupContent).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  test("should polyfill browser APIs", () => {
    // Should polyfill ResizeObserver
    expect(setupContent).toMatch(/global\.ResizeObserver/);

    // Should polyfill matchMedia
    expect(setupContent).toMatch(/global\.matchMedia/);
  });

  test("should be safe for browser-like test environments", () => {
    // Should contain comment about safety
    expect(setupContent).toMatch(/No server-only Node\.js modules/);
    expect(setupContent).toMatch(/safe for browser-like test environments/);
  });
});
