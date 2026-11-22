import { AuthorListView } from "@/modules/novel/views/author/author-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.authors" });

export default function AdminAuthorListPage() {
  return <AuthorListView />;
}
