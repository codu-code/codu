"use client";

import { ReactNode } from "react";
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-neutral-700 dark:text-neutral-200">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Main content card */}
      <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        {children}

        {/* Action bar */}
        {actionBar && (
          <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            {actionBar}
          </div>
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
