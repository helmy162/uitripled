"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { BuilderSidebar } from "@/components/BuilderSidebar";
import { BuilderCanvas } from "@/components/BuilderCanvas";
import { BuilderCodeView } from "@/components/BuilderCodeView";
import { animationRegistry } from "@/lib/animation-registry";
import { Animation } from "@/lib/animations";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Loader2,
  Info,
  FolderOpen,
  Trash2,
  Eye,
  Type,
  Plus,
  Edit3,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TextContentEntry = {
  original: string;
  value: string;
};

export type BuilderComponent = {
  id: string;
  animationId: string;
  animation: Animation;
  textContent?: Record<string, TextContentEntry>;
};

export type BuilderProjectPage = {
  id: string;
  name: string;
  slug: string;
  components: BuilderComponent[];
};

type SavedProjectComponent = {
  id: string;
  animationId: string;
  textContent?: Record<string, TextContentEntry>;
};

type SavedProjectPage = {
  id: string;
  name: string;
  slug: string;
  components: SavedProjectComponent[];
  code?: string;
};

type SavedProject = {
  name: string;
  uuid?: string;
  deploymentSlug?: string;
  pages?: SavedProjectPage[];
  entryPageId?: string;
  components?: SavedProjectComponent[];
  code?: string;
  savedAt: string;
  deploymentId?: string;
  deploymentUrl?: string;
};

const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

function generateUniqueSlug(baseName: string, existingSlugs: string[]): string {
  const baseSlug = sanitizeSlug(baseName) || "page";
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let attempt = 2;
  let candidate = `${baseSlug}-${attempt}`;
  while (existingSlugs.includes(candidate)) {
    attempt += 1;
    candidate = `${baseSlug}-${attempt}`;
  }

  return candidate;
}

function createPage(name: string, existingSlugs: string[]): BuilderProjectPage {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `page-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const slug = generateUniqueSlug(name, existingSlugs);

  return {
    id,
    name,
    slug,
    components: [],
  };
}

function extractSavedPages(project: SavedProject): SavedProjectPage[] {
  if (project.pages && project.pages.length > 0) {
    return project.pages;
  }

  return [
    {
      id:
        project.entryPageId ||
        `page-${sanitizeSlug(project.name || "landing") || "landing"}`,
      name: "Landing",
      slug: "landing",
      components: project.components ?? [],
      code: project.code,
    },
  ];
}

function countSavedProjectComponents(project: SavedProject): number {
  return extractSavedPages(project).reduce(
    (total, page) => total + (page.components?.length ?? 0),
    0,
  );
}

export default function BuilderPageClient() {
  const [pages, setPages] = useState<BuilderProjectPage[]>(() => {
    const initial = createPage("Landing", []);
    return [initial];
  });
  const [activePageId, setActivePageId] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const { user, userHasLicense, loading, initialized } = useAuth();
  const hasFullAccess = true; // PRICE CHANGE - FREE ACCESS FOR NOW

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    if (pages.length === 0) {
      if (activePageId) {
        setActivePageId("");
      }
      return;
    }

    const pageExists = pages.some((page) => page.id === activePageId);
    if (!pageExists) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId]);

  const activePage = useMemo(() => {
    if (!activePageId) {
      return pages[0] ?? null;
    }

    const current = pages.find((page) => page.id === activePageId);
    return current ?? pages[0] ?? null;
  }, [pages, activePageId]);

  const activeComponentCount = activePage?.components.length ?? 0;
  const activePageIndex = activePage
    ? pages.findIndex((page) => page.id === activePage.id)
    : -1;
  const activeRoute =
    activePageIndex === 0 ? "/" : activePage ? `/${activePage.slug}` : "/";

  const handleUnlockAccess = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    window.location.href = "/#pricing";
  };

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000); // 3 second timeout
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeComponentCount === 0 && isTextEditing) {
      setIsTextEditing(false);
    }
  }, [activeComponentCount, isTextEditing]);

  const handleRegisterTextNode = useCallback(
    (componentId: string, nodeId: string, originalText: string) => {
      if (!activePageId) return;

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;

          return {
            ...page,
            components: page.components.map((component) => {
              if (component.id !== componentId) return component;

              const existing = component.textContent?.[nodeId];
              if (existing) {
                if (
                  existing.value === existing.original &&
                  existing.original !== originalText
                ) {
                  return {
                    ...component,
                    textContent: {
                      ...(component.textContent ?? {}),
                      [nodeId]: { original: originalText, value: originalText },
                    },
                  };
                }
                return component;
              }

              return {
                ...component,
                textContent: {
                  ...(component.textContent ?? {}),
                  [nodeId]: { original: originalText, value: originalText },
                },
              };
            }),
          };
        }),
      );
    },
    [activePageId],
  );

  const handleUpdateTextNode = useCallback(
    (componentId: string, nodeId: string, newValue: string) => {
      if (!activePageId) return;

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;

          return {
            ...page,
            components: page.components.map((component) => {
              if (component.id !== componentId) return component;

              const existing = component.textContent?.[nodeId];
              if (existing && existing.value === newValue) {
                return component;
              }

              return {
                ...component,
                textContent: {
                  ...(component.textContent ?? {}),
                  [nodeId]: {
                    original: existing?.original ?? newValue,
                    value: newValue,
                  },
                },
              };
            }),
          };
        }),
      );
    },
    [activePageId],
  );

  const handleAddComponentToPage = useCallback(
    (animationId: string) => {
      const animation = animationRegistry.find(
        (item) => item.id === animationId,
      );
      if (!animation || animation.category !== "blocks") {
        return;
      }

      const newComponent: BuilderComponent = {
        id: `component-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        animationId: animation.id,
        animation,
        textContent: {},
      };

      setPages((prev) => {
        const targetPageId =
          activePageId && prev.some((page) => page.id === activePageId)
            ? activePageId
            : prev[0]?.id;

        if (!targetPageId) {
          return prev;
        }

        return prev.map((page) =>
          page.id === targetPageId
            ? { ...page, components: [...page.components, newComponent] }
            : page,
        );
      });
    },
    [activePageId],
  );

  const handleMobileComponentSelect = useCallback(
    (animationId: string) => {
      handleAddComponentToPage(animationId);
      setMobileSidebarOpen(false);
    },
    [handleAddComponentToPage],
  );

  // Show loading state while checking auth (with timeout)
  if (loading && !loadingTimeout) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (isTextEditing) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isTextEditing) {
      setActiveId(null);
      return;
    }
    const currentPage = activePage;
    if (!currentPage) {
      setActiveId(null);
      return;
    }
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're reordering components within the canvas
    const activeIndex = currentPage.components.findIndex(
      (c) => c.id === activeId,
    );
    const overIndex = currentPage.components.findIndex((c) => c.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      // Reordering existing components
      setPages((prev) =>
        prev.map((page) =>
          page.id === currentPage.id
            ? {
                ...page,
                components: arrayMove(page.components, activeIndex, overIndex),
              }
            : page,
        ),
      );
      setActiveId(null);
      return;
    }

    // Check if dragging from sidebar to canvas
    const animation = animationRegistry.find((a) => a.id === activeId);

    // Only allow blocks category components
    if (animation && animation.category !== "blocks") {
      setActiveId(null);
      return;
    }

    if (animation && (overId === "builder-canvas" || overIndex !== -1)) {
      // Add new component to canvas
      const newComponent: BuilderComponent = {
        id: `component-${Date.now()}-${Math.random()}`,
        animationId: animation.id,
        animation,
        textContent: {},
      };

      // If dropped over a component, insert at that position
      if (overIndex !== -1) {
        setPages((prev) =>
          prev.map((page) => {
            if (page.id !== currentPage.id) return page;
            const newItems = [...page.components];
            newItems.splice(overIndex, 0, newComponent);
            return {
              ...page,
              components: newItems,
            };
          }),
        );
      } else {
        // If dropped on canvas, append to end
        setPages((prev) =>
          prev.map((page) =>
            page.id === currentPage.id
              ? { ...page, components: [...page.components, newComponent] }
              : page,
          ),
        );
      }
    }

    setActiveId(null);
  };

  const handleDeleteComponent = (id: string) => {
    if (!activePage) return;

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              components: page.components.filter(
                (component) => component.id !== id,
              ),
            }
          : page,
      ),
    );
  };

  const handleSelectPage = (pageId: string) => {
    setActivePageId(pageId);
    setIsTextEditing(false);
    setActiveId(null);
  };

  const handleAddPage = () => {
    const defaultName = `Page ${pages.length + 1}`;
    const input = window.prompt("Enter a name for the new page", defaultName);
    const normalized = input?.trim();
    if (!normalized) {
      return;
    }

    const existingSlugs = pages.map((page) => page.slug);
    const newPage = createPage(normalized, existingSlugs);
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setIsTextEditing(false);
    setActiveId(null);
  };

  const handleRenamePage = (pageId: string) => {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;

    const input = window.prompt("Rename page", page.name);
    const normalized = input?.trim();
    if (!normalized || normalized === page.name) {
      return;
    }

    const existingSlugs = pages
      .filter((p) => p.id !== pageId)
      .map((p) => p.slug);
    const newSlug = generateUniqueSlug(normalized, existingSlugs);

    setPages((prev) =>
      prev.map((item) =>
        item.id === pageId
          ? {
              ...item,
              name: normalized,
              slug: newSlug,
            }
          : item,
      ),
    );
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      window.alert("You need at least one page in the project.");
      return;
    }

    const page = pages.find((item) => item.id === pageId);
    if (!page) return;

    const confirmed = window.confirm(`Delete page "${page.name}"?`);
    if (!confirmed) return;

    const remainingPages = pages.filter((item) => item.id !== pageId);
    setPages(remainingPages);
    setIsTextEditing(false);
    setActiveId(null);

    if (activePageId === pageId) {
      setActivePageId(remainingPages[0]?.id ?? "");
    }
  };

  const loadSavedProjects = () => {
    if (!hasFullAccess) {
      handleUnlockAccess();
      return;
    }
    const projects = JSON.parse(
      localStorage.getItem("builderProjects") || "{}",
    );
    const projectList = Object.values(projects) as SavedProject[];
    setSavedProjects(
      projectList.sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      ),
    );
    setLoadDialogOpen(true);
  };

  const loadProject = (project: SavedProject) => {
    const rawPages = extractSavedPages(project);
    const slugsInUse: string[] = [];

    const derivedPages = rawPages.map<BuilderProjectPage>((page, index) => {
      const safeName = page.name?.trim() || `Page ${index + 1}`;
      const slugBase = page.slug?.trim() || safeName;
      const slug = generateUniqueSlug(slugBase, slugsInUse);
      slugsInUse.push(slug);

      const pageId =
        page.id && page.id.length > 0
          ? page.id
          : typeof crypto !== "undefined" &&
              typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `page-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const builderComponents = (page.components ?? [])
        .map<BuilderComponent | null>((comp) => {
          const animation = animationRegistry.find(
            (a) => a.id === comp.animationId,
          );
          if (!animation) {
            return null;
          }

          return {
            id:
              comp.id && comp.id.length > 0
                ? comp.id
                : `component-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            animationId: comp.animationId,
            animation,
            textContent: comp.textContent ?? {},
          };
        })
        .filter((value): value is BuilderComponent => Boolean(value));

      return {
        id: pageId,
        name: safeName,
        slug,
        components: builderComponents,
      };
    });

    const finalPages =
      derivedPages.length > 0 ? derivedPages : [createPage("Landing", [])];

    setPages(finalPages);
    setLoadDialogOpen(false);
    setIsTextEditing(false);
    setActiveId(null);

    const desiredActiveId =
      project.entryPageId &&
      finalPages.some((page) => page.id === project.entryPageId)
        ? project.entryPageId
        : finalPages[0].id;

    setActivePageId(desiredActiveId);
  };

  const deleteProject = (projectName: string) => {
    const projects = JSON.parse(
      localStorage.getItem("builderProjects") || "{}",
    );
    delete projects[projectName];
    localStorage.setItem("builderProjects", JSON.stringify(projects));
    loadSavedProjects(); // Refresh the list
  };

  const previewProject = (projectName: string) => {
    window.open(`/preview/${encodeURIComponent(projectName)}`, "_blank");
  };

  // Get active component info for drag overlay
  const getActiveComponentInfo = () => {
    if (!activeId) return null;

    for (const page of pages) {
      const canvasComponent = page.components.find(
        (component) => component.id === activeId,
      );
      if (canvasComponent) {
        return { name: canvasComponent.animation.name, type: "canvas" };
      }
    }

    const animation = animationRegistry.find((a) => a.id === activeId);
    if (animation) {
      return { name: animation.name, type: "sidebar" };
    }

    return null;
  };

  const activeComponentInfo = getActiveComponentInfo();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Header Bar */}
      <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Page Builder</h1>
            <Dialog
              open={mobileSidebarOpen}
              onOpenChange={setMobileSidebarOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 md:hidden">
                  <Menu className="h-4 w-4" />
                  Library
                </Button>
              </DialogTrigger>
              <DialogContent className="md:hidden inset-x-0 bottom-0 left-0 right-0 top-auto flex h-[calc(100vh-5rem)] max-w-none translate-x-0 translate-y-0 flex-col rounded-t-3xl border border-border bg-background p-0 pb-4 shadow-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Component Library
                    </p>
                    <p className="text-sm font-semibold">Blocks</p>
                  </div>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DialogClose>
                </div>
                <div className="flex-1 overflow-hidden">
                  <BuilderSidebar
                    allowDrag={false}
                    className="flex h-full flex-col bg-background"
                    onSelectComponent={handleMobileComponentSelect}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2">
            {hasFullAccess ? (
              <Button variant="outline" size="sm" onClick={loadSavedProjects}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Load Project
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlockAccess}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                Unlock full access
              </Button>
            )}
            <Button
              variant={isTextEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsTextEditing((prev) => !prev)}
              className="gap-2"
              disabled={activeComponentCount === 0}
            >
              <Type className="h-4 w-4" />
              {isTextEditing ? "Done editing" : "Edit text"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left Sidebar */}
          <BuilderSidebar
            className="hidden h-full w-80 border-r border-border md:flex"
            onSelectComponent={handleAddComponentToPage}
          />

          {/* Main Canvas Area */}
          <div className="flex flex-1 flex-col overflow-y-auto md:overflow-hidden">
            {/* Instructions Banner */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-border bg-muted/30"
                >
                  <Card className="m-4 border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div className="flex-1 space-y-2 text-sm">
                        <h3 className="font-semibold text-foreground">
                          Important Notes
                        </h3>
                        <ul className="space-y-1.5 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span>
                              The builder is currently in beta and may have some
                              bugs and limitations
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span>
                              The builder doesn&apos;t support auto-grid yet
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span>Only blocks are allowed for use</span>
                          </li>
                        </ul>
                        <div className="flex justify-end">
                          <Button
                            variant="default"
                            className="flex justify-start"
                            size="sm"
                            onClick={() => setShowInstructions(false)}
                          >
                            {" "}
                            Hide
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isTextEditing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-4 mb-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
                >
                  Text editing mode enabled. Click highlighted text to edit.
                  Dragging is disabled while this mode is active.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-4 pb-4 md:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1"
                  >
                    <Button
                      size="sm"
                      variant={page.id === activePage?.id ? "default" : "ghost"}
                      className="gap-2"
                      onClick={() => handleSelectPage(page.id)}
                    >
                      {page.name}
                      {index === 0 && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          Home
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleRenamePage(page.id)}
                      aria-label={`Rename ${page.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {pages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeletePage(page.id)}
                        aria-label={`Delete ${page.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleAddPage}
                >
                  <Plus className="h-4 w-4" />
                  Add page
                </Button>
              </div>
              {activePage && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Route:{" "}
                  <span className="font-mono text-foreground">
                    {activeRoute}
                  </span>
                </p>
              )}
            </div>

            <div className="md:flex-1 md:overflow-y-auto p-4 md:p-6">
              <BuilderCanvas
                components={activePage?.components ?? []}
                onDelete={handleDeleteComponent}
                isTextEditing={isTextEditing}
                onRegisterTextNode={handleRegisterTextNode}
                onUpdateTextNode={handleUpdateTextNode}
              />
            </div>

            {/* Code View */}
            {hasFullAccess ? (
              <BuilderCodeView
                pages={pages}
                activePageId={activePage?.id ?? null}
              />
            ) : (
              <div className="border-t border-border bg-muted/30 px-4 py-8 sm:px-6">
                <Card className="mx-auto max-w-3xl border-dashed border-primary/40 bg-background/80 p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Unlock code export & project tools
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in and activate a license to generate code, preview
                      projects, save layouts, and copy snippets.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {!user && (
                        <Button
                          size="sm"
                          className="px-6"
                          onClick={() => setAuthModalOpen(true)}
                        >
                          Sign in
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={user ? "default" : "outline"}
                        className="px-6"
                        onClick={handleUnlockAccess}
                      >
                        {user ? "View pricing" : "Get full access"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeComponentInfo && (
              <div className="rounded-lg border-2 border-primary bg-card p-4 shadow-lg opacity-90">
                <div className="text-sm font-medium">
                  {activeComponentInfo.name}
                </div>
                {activeComponentInfo.type === "canvas" && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Reordering...
                  </div>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Load Projects Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Select a saved project to load into the builder
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {savedProjects.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No saved projects found. Create and save a project first.
              </div>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((project) => {
                  const pagesForProject = extractSavedPages(project);
                  const totalComponents = pagesForProject.reduce(
                    (total, page) => total + (page.components?.length ?? 0),
                    0,
                  );
                  const savedDate = new Date(project.savedAt);

                  return (
                    <Card
                      key={project.name}
                      className="p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {pagesForProject.length}{" "}
                            {pagesForProject.length === 1 ? "page" : "pages"}
                            {" • "}
                            {totalComponents}{" "}
                            {totalComponents === 1 ? "component" : "components"}
                            {" • "}
                            Saved {savedDate.toLocaleDateString()} at{" "}
                            {savedDate.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewProject(project.name)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(`Delete project "${project.name}"?`)
                              ) {
                                deleteProject(project.name);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => loadProject(project)}
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
