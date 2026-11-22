import { GenreListView } from "@/modules/novel/views/genre-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.genres" });

export default function AdminGenreListPage() {
  return <GenreListView />;
}
