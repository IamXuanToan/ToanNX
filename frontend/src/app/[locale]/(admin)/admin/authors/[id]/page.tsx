import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { NOVEL_API_ENDPOINTS } from "@/modules/novel/constants/api-endpoints";
import { AuthorDetailView } from "@/modules/novel/views/author-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.authors" });

export default async function AdminAuthorDetailPage({
  params,
}: PageProps<"/[locale]/admin/authors/[id]">) {
  const { id } = await params;
  return (
    <AuthorDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${NOVEL_API_ENDPOINTS.authors}/${id}/history`}
          fieldPrefix="novel.authors.fields"
        />
      }
    />
  );
}
