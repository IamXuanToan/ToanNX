import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { NOVEL_API_ENDPOINTS } from "@/modules/novel/constants/api-endpoints";
import { GenreDetailView } from "@/modules/novel/views/genre-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.genres" });

export default async function AdminGenreDetailPage({
  params,
}: PageProps<"/[locale]/admin/genres/[id]">) {
  const { id } = await params;
  return (
    <GenreDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${NOVEL_API_ENDPOINTS.genres}/${id}/history`}
          fieldPrefix="novel.genres.fields"
        />
      }
    />
  );
}
