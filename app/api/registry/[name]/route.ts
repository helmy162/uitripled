import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import registryIndex from "@/registry.json";

type RegistryItem = {
  name: string;
  files: { path: string; type: string }[];
  [key: string]: unknown;
};

/**
 * GET handler for individual registry items
 * Supports both /api/registry/{name} and /api/registry/{name}.json
 *
 * This endpoint returns a registry item with file contents included,
 * following the shadcn registry item schema.
 */
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // Remove .json extension if present
    const componentName = params.name.replace(/\.json$/, "");

    // Support both legacy object-based indexes and new array-based indexes
    const registryItems: RegistryItem[] = Array.isArray(registryIndex.items)
      ? registryIndex.items
      : (Object.values(registryIndex.items || {}) as RegistryItem[]);

    // Get component metadata from registry index
    const componentData = registryItems.find(
      (item: { name: string }) => item.name === componentName
    );

    if (!componentData) {
      return NextResponse.json(
        { error: `Component '${componentName}' not found` },
        { status: 404 }
      );
    }

    // Read file contents for each file in the component
    const filesWithContent = componentData.files.map(
      (file: { path: string; type: string }) => {
        try {
          // Map the registry path to actual file location
          // Handle multiple path formats:
          // 1. registry/ui/{name}.tsx or registry/new-york/ui/{name}.tsx (shadcn format)
          // 2. components/**/*.tsx (project component paths)
          let filePath: string;
          if (file.path.startsWith("components/")) {
            // Path starts with components/, use directly from project root
            filePath = join(process.cwd(), file.path);
          } else if (file.path.includes("new-york/ui/")) {
            // Path already includes new-york, use as-is
            filePath = join(process.cwd(), file.path);
          } else {
            // Extract filename from path (handles both ui/{name}.tsx and registry/ui/{name}.tsx)
            const fileName = file.path.replace(
              /^(registry\/)?(new-york\/)?ui\//,
              ""
            );
            filePath = join(process.cwd(), "registry", "ui", fileName);
          }

          // Check if file exists
          if (!existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            throw new Error(`File not found: ${file.path}`);
          }

          // Read the file content
          const content = readFileSync(filePath, "utf-8");

          if (!content || content.trim().length === 0) {
            throw new Error(`File is empty: ${file.path}`);
          }

          return {
            ...file,
            content: content,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`Error reading file ${file.path}:`, errorMessage);
          // Return file with error message in content
          return {
            ...file,
            content: `// Error: Could not read file ${file.path}\n// ${errorMessage}`,
          };
        }
      }
    );

    // Return the component data with file contents
    return NextResponse.json(
      {
        ...componentData,
        files: filesWithContent,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Registry API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
