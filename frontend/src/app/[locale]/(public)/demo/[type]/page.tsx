import { notFound } from "next/navigation";

import { createPageMetadata } from "@/shares/lib/seo";
import {
  DEMO_TEMPLATE_TYPES,
  isDemoTemplateType,
} from "@/modules/utilities/constants/page-constants";
import { TemplateDemoView } from "@/modules/utilities/views/page/template-demo-view";

export const generateMetadata = createPageMetadata({
  title: "utilities.customPages.pages.viewLiveDemo",
  index: true,
});

/**
 * Sinh danh sách đường dẫn tĩnh cho các loại template được hỗ trợ.
 *
 * @returns Mảng các param type tương ứng.
 */
export function generateStaticParams() {
  return DEMO_TEMPLATE_TYPES.map((type) => ({ type }));
}

/**
 * Trang xem trước trực tiếp từng loại mẫu template theo URL chuẩn (/demo/affiliate, /demo/bio, /demo/donation).
 * Loại bỏ toàn bộ magic strings và kiểm tra chặt chẽ qua isDemoTemplateType; trả 404 nếu không hợp lệ.
 *
 * @param props - Tham số route dạng async.
 * @returns TemplateDemoView.
 */
export default async function DemoTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isDemoTemplateType(type)) {
    notFound();
  }

  return <TemplateDemoView type={type} />;
}
