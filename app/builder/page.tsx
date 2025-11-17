import BuilderPageClient from "./BuilderPage.client";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Motion Builder",
  description:
    "Arrange motion components, remix layouts, and export production-ready React code with the UI TripleD builder.",
  path: "/builder",
  keywords: [
    "UI builder",
    "motion builder",
    "Framer Motion builder",
    "React drag and drop builder",
  ],
  index: false,
});

export default function BuilderPage() {
  return <BuilderPageClient />;
}
