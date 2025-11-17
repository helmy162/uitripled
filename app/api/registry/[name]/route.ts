import { NextResponse } from "next/server";
import { componentsRegistry, getComponentById } from "@/lib/components-registry";

/**
 * GET handler for registry
 * Returns component data from components-registry.tsx
 * Compatible with shadcn registry format
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing the component name
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    // If name is provided, return specific component
    if (name && name !== "index") {
      const component = getComponentById(name);
      
      if (!component) {
        return NextResponse.json(
          { error: `Component "${name}" not found` },
          { status: 404 }
        );
      }

      // Return component data
      return NextResponse.json(
        {
          id: component.id,
          name: component.name,
          description: component.description,
          category: component.category,
          tags: component.tags,
          duration: component.duration,
          easing: component.easing,
          display: component.display,
          code: component.code,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    // Return full registry (all components)
      const registry = componentsRegistry.map((component) => ({
      id: component.id,
      name: component.name,
      description: component.description,
      category: component.category,
      tags: component.tags,
      duration: component.duration,
      easing: component.easing,
      display: component.display,
    }));

    return NextResponse.json(
      {
        items: registry,
        total: registry.length,
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
