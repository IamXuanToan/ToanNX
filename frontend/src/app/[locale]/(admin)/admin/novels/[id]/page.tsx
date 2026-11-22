import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { NOVEL_API_ENDPOINTS } from "@/modules/novel/constants/api-endpoints";
import { NovelEditView } from "@/modules/novel/views/novel/novel-edit-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.novels" });

export default async function AdminNovelDetailPage({
  params,
}: PageProps<"/[locale]/admin/novels/[id]">) {
  const { id } = await params;
  return (
    <NovelEditView
      id={id}
      history={
        <RecordHistoryView
          path={`${NOVEL_API_ENDPOINTS.novels}/${id}/history`}
          fieldPrefix="novel.novelForm.fields"
        />
      }
    />
  );
}
