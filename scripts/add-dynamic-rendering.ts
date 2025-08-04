import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface FileInfo {
  path: string;
  hasPrismaQuery: boolean;
  hasFetchQuery: boolean;
  hasDynamicExport: boolean;
  needsDynamic: boolean;
}

function scanDirectory(dir: string, files: FileInfo[] = []): FileInfo[] {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, files);
    } else if (item === "page.tsx" || item === "page.ts") {
      const content = readFileSync(fullPath, "utf-8");

      const hasPrismaQuery =
        /prisma\.|await prisma\.|prisma\.findMany|prisma\.findFirst|prisma\.create|prisma\.update|prisma\.delete/.test(
          content,
        );
      const hasFetchQuery = /fetch\(|await fetch/.test(content);
      const hasDynamicExport = /export const dynamic = "force-dynamic"/.test(content);
      const isAdminRoute = /app\/admin/.test(fullPath);

      files.push({
        path: fullPath,
        hasPrismaQuery,
        hasFetchQuery,
        hasDynamicExport,
        needsDynamic: (hasPrismaQuery || hasFetchQuery) && isAdminRoute && !hasDynamicExport,
      });
    }
  }

  return files;
}

function addDynamicExport(filePath: string): void {
  const content = readFileSync(filePath, "utf-8");

  // Check if file already has dynamic export
  if (content.includes('export const dynamic = "force-dynamic"')) {
    console.log(`✅ ${filePath} - Already has dynamic export`);
    return;
  }

  // Add dynamic export at the top
  const lines = content.split("\n");
  const newLines = [
    "// ✅ Forceer dynamische rendering voor admin routes met serverdata",
    'export const dynamic = "force-dynamic";',
    "",
    ...lines,
  ];

  writeFileSync(filePath, newLines.join("\n"));
  console.log(`✅ ${filePath} - Added dynamic export`);
}

function main() {
  console.log("🔍 Scanning admin routes for server data...\n");

  const adminFiles = scanDirectory("app/admin");
  const filesNeedingDynamic = adminFiles.filter((f) => f.needsDynamic);

  console.log("📊 Scan Results:");
  adminFiles.forEach((file) => {
    const status = file.hasDynamicExport ? "✅" : file.needsDynamic ? "❌" : "⏭️";
    const details = [
      file.hasPrismaQuery ? "Prisma" : "",
      file.hasFetchQuery ? "Fetch" : "",
      file.hasDynamicExport ? "Dynamic" : "",
    ]
      .filter(Boolean)
      .join(", ");

    console.log(`${status} ${file.path} - ${details || "No server data"}`);
  });

  if (filesNeedingDynamic.length === 0) {
    console.log("\n🎉 All admin routes already have dynamic rendering!");
    return;
  }

  console.log(`\n📝 Adding dynamic rendering to ${filesNeedingDynamic.length} files...`);

  filesNeedingDynamic.forEach((file) => {
    addDynamicExport(file.path);
  });

  console.log("\n✅ Dynamic rendering added successfully!");
  console.log("\n💡 Benefits:");
  console.log("   - Real-time data updates");
  console.log("   - No stale cached data");
  console.log("   - Always fresh server-side data");
  console.log("   - Better admin experience");
}

main();
