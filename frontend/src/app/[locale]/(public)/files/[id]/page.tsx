import { FileAccessView } from "@/modules/system/views/file-access-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.fileAccess.title",
  index: false,
});

/**
 * Link chia sẻ của file riêng tư (`/tep/{id}`): có quyền thì mở file, không thì báo không có quyền.
 *
 * @param props - Tham số route.
 * @returns FileAccessView.
 */
export default async function FileAccessPage({ params }: PageProps<"/[locale]/files/[id]">) {
  const { id } = await params;
  return <FileAccessView id={id} />;
}
