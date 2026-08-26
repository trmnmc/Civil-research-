import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archive Lens — Civil War primary-source research",
  description:
    "A research instrument for finding, examining, comparing, and citing original American Civil War sources across major archives.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper-raised focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to main content
        </a>
        <header className="border-b border-rule bg-paper-raised">
          <div className="mx-auto flex max-w-[1400px] items-baseline gap-6 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="doc-serif text-xl font-semibold tracking-tight text-ink"
            >
              Archive Lens
            </Link>
            <span className="hidden text-xs text-ink-faint sm:inline">
              Civil War primary-source research · 1850–1877
            </span>
            <nav aria-label="Primary" className="ml-auto flex gap-1 text-sm">
              <Link
                href="/"
                className="rounded px-3 py-1.5 text-ink-soft hover:bg-paper-sunken hover:text-ink"
              >
                Search
              </Link>
              <Link
                href="/compare"
                className="rounded px-3 py-1.5 text-ink-soft hover:bg-paper-sunken hover:text-ink"
              >
                Compare
              </Link>
              <Link
                href="/notebook"
                className="rounded px-3 py-1.5 text-ink-soft hover:bg-paper-sunken hover:text-ink"
              >
                Notebook
              </Link>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-rule bg-paper-raised">
          <div className="mx-auto max-w-[1400px] space-y-1 px-4 py-4 text-xs text-ink-faint sm:px-6">
            <p>
              Sources are served by their holding archives: Library of
              Congress, Chronicling America, National Archives Catalog, Valley
              of the Shadow (UVA), and Documenting the American South (UNC).
              Archive Lens links to originals and never alters them.
            </p>
            <p>
              This product uses the National Archives Catalog API but is not
              endorsed or certified by the National Archives and Records
              Administration.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
