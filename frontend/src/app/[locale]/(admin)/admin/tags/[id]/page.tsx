import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { NOVEL_API_ENDPOINTS } from "@/modules/novel/constants/api-endpoints";
import { TagDetailView } from "@/modules/novel/views/tag-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.tags" });

export default async function AdminTagDetailPage({
  params,
}: PageProps<"/[locale]/admin/tags/[id]">) {
  const { id } = await params;
  return (
    <TagDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${NOVEL_API_ENDPOINTS.tags}/${id}/history`}
          fieldPrefix="novel.tags.fields"
        />
      }
    />
  );
}
