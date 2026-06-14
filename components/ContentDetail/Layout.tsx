"use client";

import type { ReactNode } from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContentDetailLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
  actionBar?: ReactNode;
  discussion?: ReactNode;
  sideInfo?: ReactNode;
}

const ContentDetailLayout = ({
  breadcrumbs,
  children,
  actionBar,
  discussion,
  sideInfo,
}: ContentDetailLayoutProps) => {
  return (
    <div className="mx-auto max-w-3xl px-0 py-4 sm:px-4 sm:py-8">
      {/* Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-sm text-muted"
        >
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-fg">
                  {item.label}
                </Link>
              ) : (
                <span className="text-fg">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Main content card */}
      <article className="rounded-lg border border-hairline bg-surface p-6">
        {children}

        {/* Action bar */}
        {actionBar && (
          <div className="mt-6 border-t border-hairline pt-4">{actionBar}</div>
        )}
      </article>

      {/* Side info (author bio or source info) */}
      {sideInfo && <div className="mt-6">{sideInfo}</div>}

      {/* Discussion section */}
      {discussion && (
        <section id="discussion" className="mt-6">
          {discussion}
        </section>
      )}
    </div>
  );
};

export default ContentDetailLayout;
