import { PAGE_TYPE } from "../../constants/page-constants";
import type { PublicPage } from "../../types/page.types";
import { AffiliatePageRenderer } from "./affiliate-page-renderer";
import { BioPageRenderer } from "./bio-page-renderer";
import { DonationPageRenderer } from "./donation-page-renderer";
import { LegacyTiptapPageRenderer } from "./legacy-tiptap-page-renderer";

/**
 * Bộ điều phối hiển thị trang: chọn đúng Renderer tương ứng theo `page.pageType`.
 * Đảm bảo các trang Legacy Tiptap cũ tiếp tục hoạt động 100% trơn tru.
 *
 * @param props - Dữ liệu trang công khai.
 * @returns Component renderer tương ứng.
 */
export function PageRendererDispatcher({ page }: { page: PublicPage }) {
  switch (page.pageType) {
    case PAGE_TYPE.AFFILIATE:
    case PAGE_TYPE.PRODUCT_CATALOG:
      return <AffiliatePageRenderer page={page} />;
    case PAGE_TYPE.BIO:
    case PAGE_TYPE.PORTFOLIO:
      return <BioPageRenderer page={page} />;
    case PAGE_TYPE.DONATION:
      return <DonationPageRenderer page={page} />;
    case PAGE_TYPE.LEGACY_PAGE:
    default:
      return <LegacyTiptapPageRenderer page={page} />;
  }
}
