import { CUSTOM_PAGES_API_ENDPOINTS } from "@/modules/custom-pages/constants/api-endpoints";
import { PageDetailView } from "@/modules/custom-pages/views/page-detail-view";
import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { QrCodeTiptapPlugin } from "@/modules/qr-codes/views/qr-code-tiptap-plugin";
import { ShortLinkTiptapPlugin } from "@/modules/short-links/views/short-link-tiptap-plugin";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "customPages.nav.pages" });

/**
 * Trang soạn (Custom Pages) ghép plugin editor của module cùng cấp (Mã QR, nút link rút gọn) và lịch sử
 * thay đổi (Journal) qua slot — các module không import lẫn nhau.
 *
 * @param props - Tham số route.
 * @returns PageDetailView.
 */
export default async function CustomPageDetailPage({
  params,
}: PageProps<"/[locale]/admin/pages/[id]">) {
  const { id } = await params;
  return (
    <PageDetailView
      id={id}
      editorPlugins={
        <>
          <QrCodeTiptapPlugin />
          <ShortLinkTiptapPlugin />
        </>
      }
      history={
        <RecordHistoryView
          path={`${CUSTOM_PAGES_API_ENDPOINTS.pages}/${id}/history`}
          fieldPrefix="customPages.pages.fields"
        />
      }
    />
  );
}
