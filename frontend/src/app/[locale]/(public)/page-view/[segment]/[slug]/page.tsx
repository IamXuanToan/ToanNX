import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";
import type { PublicPage } from "@/modules/utilities/types/page.types";
import { PublicPageView } from "@/modules/utilities/views/page/public-page-view";
import { serverApiGet } from "@/shares/lib/api/server-api";

type Params = { locale: string; segment: string; slug: string };

/** Tải một lần cho cả metadata và nội dung (kèm cookie: người có quyền xem được bản nháp). */
const loadPage = cache(async (segment: string, slug: string): Promise<PublicPage | null> => {
  const result = await serverApiGet<PublicPage>(
    UTILITIES_API_ENDPOINTS.pagePublic(segment, slug),
    await headers(),
    { opaqueKeys: ["content"] },
  );
  return result.data;
});

/** Metadata từ SEO của trang; bản nháp không index. */
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { segment, slug } = await params;
  const page = await loadPage(segment, slug);
  if (!page) return { robots: { index: false, follow: false } };
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: page.canonicalUrl },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url: page.canonicalUrl,
      ...(page.coverUrl ? { images: [page.coverUrl] } : {}),
    },
    robots: page.preview ? { index: false, follow: false } : undefined,
  };
}

/**
 * Route nội bộ của trang công khai; người xem mở `toannx.com/<segment>/<slug>` và `proxy.ts` rewrite sang đây.
 *
 * @param props - Tham số route.
 * @returns Trang công khai hoặc 404.
 */
export default async function PublicCustomPage({ params }: { params: Promise<Params> }) {
  const { segment, slug } = await params;
  const page = await loadPage(segment, slug);
  if (!page) notFound();
  return <PublicPageView page={page} />;
}
