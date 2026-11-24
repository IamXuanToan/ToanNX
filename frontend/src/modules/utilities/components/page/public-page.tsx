"use client";

import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { useMemo } from "react";

import { keysToCamel } from "@/shares/lib/api/case-conversion";

import { usePublicPage } from "../../hooks/use-public-page";
import type { PublicPage as PublicPageData } from "../../types/page.types";
import { PageRendererDispatcher } from "./page-renderer-dispatcher";

/**
 * Trang công khai đã render: tự động điều phối renderer theo `pageType`.
 * Hỗ trợ fetch trực tiếp phía client qua `usePublicPage` khi không truyền sẵn `initialPage`.
 *
 * @param props - Dữ liệu công khai hoặc segment + slug.
 * @returns Trang đã render.
 */
export function PublicPage({
  page: initialPage,
  segment,
  slug,
}: {
  page?: PublicPageData | null;
  segment?: string;
  slug?: string;
}) {
  const query = usePublicPage(segment ?? "", slug ?? "", !initialPage && Boolean(segment && slug));
  const rawPage = initialPage ?? query.data ?? null;

  const page = useMemo(() => {
    if (!rawPage) return null;
    return {
      ...rawPage,
      contentConfig: keysToCamel<Record<string, unknown>>(
        (rawPage.contentConfig as Record<string, unknown>) ?? {},
      ),
      styleConfig: keysToCamel<Record<string, unknown>>(
        (rawPage.styleConfig as Record<string, unknown>) ?? {},
      ),
      responsiveConfig: keysToCamel<Record<string, unknown>>(
        (rawPage.responsiveConfig as Record<string, unknown>) ?? {},
      ),
    } as PublicPageData;
  }, [rawPage]);

  if (!initialPage && query.isLoading) {
    return (
      <div className="flex h-svh w-full items-center justify-center p-6">
        <Loader2 className="text-primary size-10 animate-spin" />
      </div>
    );
  }

  if (!page) {
    if (query.isError) notFound();
    return null;
  }

  return <PageRendererDispatcher page={page} />;
}
