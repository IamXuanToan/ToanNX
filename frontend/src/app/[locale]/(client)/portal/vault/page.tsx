import { VaultItemListView } from "@/modules/workspace/views/vault-item/vault-item-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "workspace.vault.title" });

/** Trang danh sách Két sắt bí mật. */
export default function VaultPage() {
  return <VaultItemListView />;
}
