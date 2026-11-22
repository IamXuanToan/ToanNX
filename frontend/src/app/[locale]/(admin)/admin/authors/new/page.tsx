import { AuthorCreateView } from "@/modules/novel/views/author/author-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "novel.nav.authors" });

export default function AdminAuthorCreatePage() {
  return <AuthorCreateView />;
}
