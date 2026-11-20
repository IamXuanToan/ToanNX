import { z } from "zod";

import { slugField } from "@/shares/lib/field-schemas";

import {
  PAGE_STATUSES,
  PAGE_TEMPLATES,
  type PageDetail,
  type PageInput,
} from "../types/page.types";

type Translate = (key: "required" | "slug" | "color") => string;

const HEX = /^#[0-9a-fA-F]{6}$/;
const optionalColor = (message: string) =>
  z.string().refine((value) => value === "" || HEX.test(value), message);
const image = z.object({ id: z.string(), url: z.string(), name: z.string() }).nullable();

/**
 * Schema form trang (một form cho tạo và sửa). Nội dung Tiptap kiểm ở BE (danh sách node cho phép).
 *
 * @param t - Hàm dịch `utilities.customPages.validation`.
 * @returns Zod schema.
 */
export function pageSchema(t: Translate) {
  return z.object({
    pathId: z.string().min(1, t("required")),
    title: z.string().trim().min(1, t("required")).max(150),
    slug: slugField(t("slug"), { required: false }),
    description: z.string().max(1000),
    status: z.enum(PAGE_STATUSES),
    template: z.enum(PAGE_TEMPLATES),
    seoTitle: z.string().max(160),
    seoDescription: z.string().max(300),
    themeMode: z.enum(["system", "light", "dark"]),
    primaryColor: optionalColor(t("color")),
    backgroundColor: optionalColor(t("color")),
    textColor: optionalColor(t("color")),
    buttonStyle: z.enum(["rounded", "square", "pill"]),
    avatar: image,
    cover: image,
    content: z.custom<NonNullable<PageInput["content"]>>(),
  });
}

export type PageFormValues = z.infer<ReturnType<typeof pageSchema>>;

export const PAGE_FORM_DEFAULTS: PageFormValues = {
  pathId: "",
  title: "",
  slug: "",
  description: "",
  status: "DRAFT",
  template: "blank",
  seoTitle: "",
  seoDescription: "",
  themeMode: "system",
  primaryColor: "#2563eb",
  backgroundColor: "",
  textColor: "",
  buttonStyle: "rounded",
  avatar: null,
  cover: null,
  content: { type: "doc", content: [{ type: "paragraph" }] },
};

/** Ô của form nhận lỗi theo field từ BE. */
export const PAGE_FORM_FIELDS = [
  "pathId",
  "title",
  "slug",
  "description",
  "seoTitle",
  "seoDescription",
] as const;

/** @param page - Trang có sẵn. @returns Giá trị form. */
export function fromPage(page: PageDetail): PageFormValues {
  return {
    ...PAGE_FORM_DEFAULTS,
    pathId: page.path.id,
    title: page.title,
    slug: page.slug,
    description: page.description,
    status: page.status,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    themeMode: page.theme.mode ?? "system",
    primaryColor: page.theme.primaryColor ?? PAGE_FORM_DEFAULTS.primaryColor,
    backgroundColor: page.theme.backgroundColor ?? "",
    textColor: page.theme.textColor ?? "",
    buttonStyle: page.theme.buttonStyle ?? "rounded",
    avatar: page.avatar ? { ...page.avatar, name: "" } : null,
    cover: page.cover ? { ...page.cover, name: "" } : null,
    content: page.content,
  };
}

/**
 * @param values - Giá trị form.
 * @param page - Trang đang sửa (để gửi `contentVersion` và chỉ gửi nội dung khi đổi).
 * @param contentDirty - Nội dung đã đổi.
 * @returns Body tạo/sửa.
 */
export function toPageInput(
  values: PageFormValues,
  page?: PageDetail,
  contentDirty = false,
): PageInput {
  const theme = {
    mode: values.themeMode,
    buttonStyle: values.buttonStyle,
    ...(values.primaryColor ? { primaryColor: values.primaryColor } : {}),
    ...(values.backgroundColor ? { backgroundColor: values.backgroundColor } : {}),
    ...(values.textColor ? { textColor: values.textColor } : {}),
  };
  const base: PageInput = {
    pathId: values.pathId,
    title: values.title,
    slug: values.slug || undefined,
    description: values.description,
    status: values.status,
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    theme,
    avatarId: values.avatar?.id ?? null,
    coverId: values.cover?.id ?? null,
  };
  if (!page) return { ...base, template: values.template };
  return contentDirty
    ? { ...base, content: values.content, contentVersion: page.contentVersion }
    : base;
}
