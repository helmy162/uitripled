import ComponentsLandingPage from "@/components/components-landing-page";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Component Library",
  description:
    "Browse 70+ production-ready motion components built with Framer Motion, shadcn/ui, and Tailwind CSS.",
  path: "/components",
  keywords: [
    "React components",
    "motion components",
    "component library",
    "Framer Motion UI",
  ],
});

export default function ComponentsPage() {
  return <ComponentsLandingPage />;
}
