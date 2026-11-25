import { PublicPage } from "../../components/page/public-page";
import type { PublicPage as PublicPageData } from "../../types/page.types";

/**
 * Trang công khai `toannx.com/<segment>/<slug>`; bản nháp (chỉ người có quyền thấy) kèm toast nhắc.
 *
 * @param props - Dữ liệu đã tải hoặc segment + slug để tải phía client.
 * @returns Trang.
 */
export function PublicPageView({
  page,
  segment,
  slug,
}: {
  page?: PublicPageData | null;
  segment?: string;
  slug?: string;
}) {
  return <PublicPage page={page} segment={segment} slug={slug} showPreviewNotice />;
}
