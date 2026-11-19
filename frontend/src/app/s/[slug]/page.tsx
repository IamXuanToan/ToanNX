import type { Metadata } from "next";
import { headers } from "next/headers";

import { SHORT_LINKS_API_ENDPOINTS } from "@/modules/short-links/constants/api-endpoints";
import type { PublicShortLink } from "@/modules/short-links/types/short-link.types";
import { LinkUnavailableView } from "@/modules/short-links/views/link-unavailable-view";
import { ShortLinkLandingView } from "@/modules/short-links/views/short-link-landing-view";
import { serverApiGet } from "@/shares/lib/api/server-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** `/s/{slug}` luôn hiển thị trang trung gian hoặc lý do không khả dụng. */
export default async function ShortLinkPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const result = await serverApiGet<PublicShortLink>(
    SHORT_LINKS_API_ENDPOINTS.resolve(slug),
    await headers(),
  );
  if (!result.data) {
    const reason = result.status === 410 ? "expired" : result.status === 429 ? "busy" : "not-found";
    return <LinkUnavailableView reason={reason} />;
  }
  return <ShortLinkLandingView slug={slug} link={result.data} />;
}
