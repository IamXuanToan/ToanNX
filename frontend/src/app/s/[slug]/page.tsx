import type { Metadata } from "next";

import { ShortLinkLandingView } from "@/modules/utilities/views/short-link/short-link-landing-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * `/s/{slug}` hiển thị trang trung gian gọi API công khai phía client qua React Query.
 * Request API hiển thị trực tiếp trên tab Network của trình duyệt để dễ dàng debug.
 */
export default async function ShortLinkPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  return <ShortLinkLandingView slug={slug} />;
}
