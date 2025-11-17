import HomePageContent from "@/components/pages/HomePageContent";
import { createMetadata, siteConfig } from "@/lib/seo";

export const metadata = createMetadata({
  title: "UI Components, Blocks & Templates",
  description: siteConfig.description,
  path: "/",
  keywords: [
    "UI components",
    "motion components",
    "React UI library",
    "Next.js animations",
    "Framer Motion templates",
    "shadcn ui components",
  ],
});

export default function HomePage() {
  return <HomePageContent />;
}
