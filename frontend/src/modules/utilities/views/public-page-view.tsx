import { PreviewNotice } from "../components/preview-notice";
import { PublicPage } from "../components/public-page";
import type { PublicPage as PublicPageData } from "../types/page.types";

/**
 * Trang công khai `toannx.com/<segment>/<slug>`; bản nháp (chỉ người có quyền thấy) kèm toast nhắc.
 *
 * @param props - Dữ liệu đã tải ở server.
 * @returns Trang.
 */
export function PublicPageView({ page }: { page: PublicPageData }) {
  return (
    <>
      <PublicPage page={page} />
      {page.preview ? <PreviewNotice status={page.status} /> : null}
    </>
  );
}
