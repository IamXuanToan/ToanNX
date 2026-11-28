import { LanguageListView } from "@/modules/system/views/language/language-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.languages.nav" });

/**
 * Trang danh sách Ngôn ngữ hệ thống (Quản trị).
 *
 * @returns LanguageListView.
 */
export default function AdminLanguagesPage() {
  return <LanguageListView />;
}
