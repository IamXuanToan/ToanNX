import type { ListParams } from "@/shares/types/api.types";

import type { VAULT_CATEGORIES } from "../constants/defaults";

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

/** Mục két sắt bí mật (không bao giờ trả secret rõ khi list/retrieve; khớp `VaultItemResponse`). */
export type VaultItem = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  title: string;
  category: VaultCategory;
  username: string;
  secretLast4: string;
  url: string;
  notes: string;
  tags: string[];
  lastRevealedAt: string | null;
  lastRevealedById: string | null;
  lastRevealedByEmail: string;
  createdAt: string;
  updatedAt: string;
};

/** Kết quả giải mã có kiểm quyền `workspace.vault_item.reveal` (khớp `VaultItemRevealResponse`). */
export type VaultItemReveal = {
  id: string;
  title: string;
  username: string;
  secret: string;
  url: string;
  revealedAt: string;
  revealedByEmail: string;
};

/** Đầu vào tạo mục két sắt. */
export type VaultItemCreateInput = {
  title: string;
  category?: VaultCategory;
  username?: string;
  secret: string;
  url?: string;
  notes?: string;
  tags?: string[];
};

/** Đầu vào cập nhật mục két sắt (chỉ đổi secret khi nhập giá trị mới). */
export type VaultItemUpdateInput = {
  title?: string;
  category?: VaultCategory;
  username?: string;
  secret?: string;
  url?: string;
  notes?: string;
  tags?: string[];
};

/** Bộ lọc Két sắt. */
export type VaultItemFilters = ListParams & {
  category?: readonly string[];
  owner?: string;
};
