import { AttachmentLibraryView } from "@/modules/attachment/views/attachment-library-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.attachments" });

/** Trang thư viện tệp trong nhóm Hệ thống. */
export default function AttachmentsPage() {
  return <AttachmentLibraryView />;
}
