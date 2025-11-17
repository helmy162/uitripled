export type ComponentCategory =
  | "microinteractions"
  | "components"
  | "page"
  | "data"
  | "decorative"
  | "blocks";

export type Component = {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  tags: string[];
  component: React.ComponentType<any>;
  code: string;
  duration?: string;
  easing?: string;
  isFree?: boolean;
  display?: boolean;
};

export const categoryNames: Record<ComponentCategory, string> = {
  microinteractions: "Microinteractions",
  components: "Components",
  page: "Page Transitions",
  data: "Data Animations",
  decorative: "Decorative",
  blocks: "Blocks",
};

export const categoryDescriptions: Record<ComponentCategory, string> = {
  microinteractions:
    "Small, delightful interactions for buttons, toggles, and icons",
  components: "Animated UI components like modals, dropdowns, and cards",
  page: "Smooth transitions and hero sections for pages",
  data: "Bring your data to life with counters, progress bars, and lists",
  decorative: "Beautiful text and background effects",
  blocks: "Reusable block sections for landing pages and portfolios",
};
