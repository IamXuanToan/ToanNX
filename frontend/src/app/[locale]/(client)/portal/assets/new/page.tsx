import { AssetCreateView } from "@/modules/workspace/views/asset/asset-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "workspace.assets.createTitle" });

/** Trang tạo Thiết bị cá nhân mới. */
export default function AssetCreatePage() {
  return <AssetCreateView />;
}
