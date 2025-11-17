import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/logos/logo-black.svg"
                alt="UI-TripleD"
                width={120}
                height={120}
                className="block h-8 w-auto dark:hidden"
              />
              <Image
                src="/logos/logo.svg"
                alt="UI-TripleD"
                width={120}
                height={120}
                className="hidden h-8 w-auto dark:block"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Production-ready UI components and templates built with modern web
              technologies.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/components"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Components
                </Link>
              </li>
              <li>
                <Link
                  href="/templates"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Connect</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://x.com/moumensoliman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/uitripled"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  TripleD Studio
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@tripled.work"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              © 2025 UI-TripleD. All rights reserved. Built by{" "}
              <a
                href="https://x.com/uitripled"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition-colors hover:text-primary/80"
              >
                TripleD Studio
              </a>
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://x.com/moumensoliman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow us on Twitter"
              >
                <Image
                  src="/logos/x-black.svg"
                  alt="Twitter"
                  width={16}
                  height={16}
                  className="block dark:hidden"
                />
                <Image
                  src="/logos/x.svg"
                  alt="Twitter"
                  width={16}
                  height={16}
                  className="hidden dark:block"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
