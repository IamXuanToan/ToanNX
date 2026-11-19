import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { NOVEL_API_ENDPOINTS } from "@/modules/novel/constants/api-endpoints";
import { ChapterDetailView } from "@/modules/novel/views/chapter-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.chapters" });

export default async function AdminChapterDetailPage({
  params,
}: PageProps<"/[locale]/admin/chapters/[id]">) {
  const { id } = await params;
  return (
    <ChapterDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${NOVEL_API_ENDPOINTS.chapters}/${id}/history`}
          fieldPrefix="novel.chapters.fields"
        />
      }
    />
  );
}
