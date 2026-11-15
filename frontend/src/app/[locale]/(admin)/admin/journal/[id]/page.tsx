import { JournalEntryDetailView } from "@/modules/journal/views/journal-entry-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "journal.detail.title" });

/**
 * Trang chi tiết một mục nhật ký.
 *
 * @param props - Tham số route.
 * @returns JournalEntryDetailView.
 */
export default async function JournalEntryPage({
  params,
}: PageProps<"/[locale]/admin/journal/[id]">) {
  const { id } = await params;
  return <JournalEntryDetailView id={id} />;
}
