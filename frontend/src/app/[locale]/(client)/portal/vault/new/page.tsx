import { VaultItemCreateView } from "@/modules/workspace/views/vault-item/vault-item-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.vault.createTitle",
});

/** Trang thêm mục Két sắt bí mật. */
export default function VaultCreatePage() {
  return <VaultItemCreateView />;
}
