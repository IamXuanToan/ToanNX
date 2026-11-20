import type { TiptapDocument } from "@/shares/components/common/tiptap-editor.types";
import type { ListParams } from "@/shares/types/api.types";
import type { AttachmentSummary } from "@/shares/types/attachment.types";

export const PAGE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"] as const;
export const PAGE_TEMPLATES = ["blank", "link_in_bio", "about", "donate"] as const;

export type PageStatus = (typeof PAGE_STATUSES)[number];
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];

/** Theme có cấu trúc (BE `validate_theme`). */
export type PageTheme = {
  mode?: "light" | "dark" | "system";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
};

/** Một dòng danh sách trang. */
export type Page = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  path: { id: string; segment: string; name: string };
  publicUrl: string;
  owner: { id: string; email: string; fullName: string };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết cho editor. */
export type PageDetail = Page & {
  description: string;
  seoTitle: string;
  seoDescription: string;
  theme: PageTheme;
  avatar: AttachmentSummary | null;
  cover: AttachmentSummary | null;
  content: TiptapDocument;
  contentVersion: number;
};

export type PageFilters = ListParams & {
  status?: PageStatus[];
  path?: string[];
  owner?: string[];
};

export type PageInput = {
  pathId: string;
  title: string;
  slug?: string;
  description?: string;
  status?: PageStatus;
  seoTitle?: string;
  seoDescription?: string;
  theme?: PageTheme;
  avatarId?: string | null;
  coverId?: string | null;
  content?: TiptapDocument;
  contentVersion?: number;
  template?: PageTemplate;
};

/** Trang công khai (BE `PagePublicResponseSerializer`). */
export type PublicPage = {
  segment: string;
  slug: string;
  status: PageStatus;
  preview: boolean;
  title: string;
  description: string;
  canonicalUrl: string;
  seoTitle: string;
  seoDescription: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  theme: PageTheme;
  content: TiptapDocument;
};
