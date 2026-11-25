import { PublicPageView } from "@/modules/utilities/views/page/public-page-view";

type Params = { locale: string; segment: string; slug: string };

/**
 * Route nội bộ của trang công khai; người xem mở `toannx.com/<segment>/<slug>` và `proxy.ts` rewrite sang đây.
 * Dữ liệu trang được fetch 100% phía client qua React Query (hiển thị rõ trên tab Network, không gọi API ở SSR).
 *
 * @param props - Tham số route.
 * @returns Trang công khai.
 */
export default async function PublicCustomPage({ params }: { params: Promise<Params> }) {
  const { segment, slug } = await params;
  return <PublicPageView segment={segment} slug={slug} />;
}
