import { AssetListView } from "@/modules/workspace/views/asset/asset-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "workspace.assets.title" });

/** Trang danh sách Thiết bị & Tài sản cá nhân. */
export default function AssetsPage() {
  return <AssetListView />;
}
