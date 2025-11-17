import AnimationDetailPageClient from "./AnimationDetailPage.client";
import { createMetadata } from "@/lib/seo";
import { getComponentById, componentsRegistry } from "@/lib/components-registry";
import { notFound } from "next/navigation";

type PageParams = {
  params: {
    id: string;
  };
};

export function generateStaticParams() {
  return componentsRegistry
    .filter((component) => component.display !== false)
    .map((component) => ({ id: component.id }));
}

export const dynamicParams = true;

export function generateMetadata({ params }: PageParams) {
  const component = getComponentById(params.id);

  if (!component) {
    return createMetadata({
      title: "Component Not Found",
      description:
        "The requested motion component could not be found in the UI TripleD library.",
      path: `/components/${params.id}`,
      index: false,
    });
  }

  return createMetadata({
    title: `${component.name} Component`,
    description: component.description
      ? `${component.description} View the live demo, animation settings, and production-ready code.`
      : `Explore the ${component.name} motion component with live demo, animation settings, and production-ready code.`,
    path: `/components/${component.id}`,
    keywords: [
      component.name,
      `${component.category} component`,
      "motion component",
      "Frame Motion",
      "shadcn/ui",
      "Tailwind CSS",
      "Framer Motion example",
      "UI TripleD component",
    ].filter(Boolean),
  });
}

export default function AnimationDetailPage({ params }: PageParams) {
  const component = getComponentById(params.id);

  if (!component) {
    notFound();
  }

  return <AnimationDetailPageClient />;
}
