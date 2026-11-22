import { GenreCreateView } from "@/modules/novel/views/genre-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.genres" });

export default function AdminGenreCreatePage() {
  return <GenreCreateView />;
}
