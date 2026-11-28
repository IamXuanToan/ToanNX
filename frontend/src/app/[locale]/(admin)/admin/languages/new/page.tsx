import { LanguageCreateView } from "@/modules/system/views/language/language-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.languages.createTitle" });

/**
 * Trang thêm mới ngôn ngữ (Quản trị).
 *
 * @returns LanguageCreateView.
 */
export default function AdminLanguageCreatePage() {
  return <LanguageCreateView />;
}
