import { z } from "zod";

import { keysToCamel } from "@/shares/lib/api/case-conversion";
import { slugField } from "@/shares/lib/field-schemas";

import { DEFAULT_AFFILIATE_PLATFORMS } from "../constants/affiliate-platforms";
import {
  ALL_PAGE_TYPES,
  PAGE_STATUSES,
  PAGE_TEMPLATES,
  PAGE_TYPE,
  type PageDetail,
  type PageInput,
} from "../types/page.types";

type Translate = (key: "required" | "slug" | "color") => string;

const HEX = /^#[0-9a-fA-F]{6}$/;
const optionalColor = (message: string) =>
  z.string().refine((value) => value === "" || HEX.test(value), message);
const image = z.object({ id: z.string(), url: z.string(), name: z.string() }).nullable();

/**
 * Schema form trang (một form cho tạo và sửa).
 *
 * @param t - Hàm dịch `utilities.customPages.validation`.
 * @returns Zod schema.
 */
export function pageSchema(t: Translate) {
  return z.object({
    pathId: z.string().min(1, t("required")),
    title: z.string().trim().min(1, t("required")).max(150),
    slug: slugField(t("slug"), { required: false, preserveCase: true }),
    description: z.string().max(1000),
    status: z.enum(PAGE_STATUSES),
    template: z.enum(PAGE_TEMPLATES),
    pageType: z.enum(ALL_PAGE_TYPES),
    templateKey: z.string(),
    templateVersion: z.number().int().min(1),
    contentConfig: z.record(z.string(), z.unknown()),
    styleConfig: z.record(z.string(), z.unknown()),
    responsiveConfig: z.record(z.string(), z.unknown()),
    seoTitle: z.string().max(160),
    seoDescription: z.string().max(300),
    themeMode: z.enum(["system", "light", "dark"]),
    primaryColor: optionalColor(t("color")),
    backgroundColor: optionalColor(t("color")),
    textColor: optionalColor(t("color")),
    buttonStyle: z.enum(["rounded", "square", "pill"]),
    avatar: image,
    cover: image,
    backgroundImage: image,
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
  pageType: PAGE_TYPE.AFFILIATE,
  templateKey: "product_grid",
  templateVersion: 1,
  contentConfig: {
    categories: [
      { id: "cat-1", name: "Tất cả", slug: "all", sortOrder: 0, isVisible: true },
      { id: "cat-2", name: "Đồ công nghệ", slug: "do-cong-nghe", sortOrder: 1, isVisible: true },
    ],
    platforms: DEFAULT_AFFILIATE_PLATFORMS,
    items: [],
  },
  styleConfig: {
    themePreset: "forest_green",
    primaryColor: "#3D812E",
    cardRadius: "12px",
    layout: "grid",
    showSearch: true,
    showPrice: true,
    showImage: true,
  },
  responsiveConfig: {
    desktopColumns: 4,
    tabletColumns: 3,
    mobileColumns: 2,
    hideDescriptionOnMobile: true,
  },
  seoTitle: "",
  seoDescription: "",
  themeMode: "system",
  primaryColor: "#3D812E",
  backgroundColor: "",
  textColor: "",
  buttonStyle: "rounded",
  avatar: null,
  cover: null,
  backgroundImage: null,
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
  "pageType",
  "templateKey",
] as const;

const CARD_RADIUS_ALIASES: Record<string, string> = {
  rounded: "12px",
  pill: "20px",
  square: "0px",
};

/** @param page - Trang có sẵn. @returns Giá trị form. */
export function fromPage(page: PageDetail): PageFormValues {
  const rawStyleConfig = keysToCamel<Record<string, unknown>>(
    (page.styleConfig as Record<string, unknown>) ?? PAGE_FORM_DEFAULTS.styleConfig,
  );
  if (
    typeof rawStyleConfig.cardRadius === "string" &&
    CARD_RADIUS_ALIASES[rawStyleConfig.cardRadius]
  ) {
    rawStyleConfig.cardRadius = CARD_RADIUS_ALIASES[rawStyleConfig.cardRadius];
  }
  return {
    ...PAGE_FORM_DEFAULTS,
    pathId: page.path.id,
    title: page.title,
    slug: page.slug,
    description: page.description,
    status: page.status,
    pageType: page.pageType ?? PAGE_TYPE.LEGACY_PAGE,
    templateKey: page.templateKey ?? "blank",
    templateVersion: page.templateVersion ?? 1,
    contentConfig: keysToCamel<Record<string, unknown>>(
      (page.contentConfig as Record<string, unknown>) ?? PAGE_FORM_DEFAULTS.contentConfig,
    ),
    styleConfig: rawStyleConfig,
    responsiveConfig: keysToCamel<Record<string, unknown>>(
      (page.responsiveConfig as Record<string, unknown>) ?? PAGE_FORM_DEFAULTS.responsiveConfig,
    ),
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    themeMode: page.theme.mode ?? "system",
    primaryColor: page.theme.primaryColor ?? PAGE_FORM_DEFAULTS.primaryColor,
    backgroundColor: page.theme.backgroundColor ?? "",
    textColor: page.theme.textColor ?? "",
    buttonStyle: page.theme.buttonStyle ?? "rounded",
    avatar: page.avatar ? { ...page.avatar, name: "" } : null,
    cover: page.cover ? { ...page.cover, name: "" } : null,
    backgroundImage: page.backgroundImage ? { ...page.backgroundImage, name: "" } : null,
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
    pageType: values.pageType,
    templateKey: values.templateKey,
    templateVersion: values.templateVersion,
    contentConfig: values.contentConfig,
    styleConfig: values.styleConfig,
    responsiveConfig: values.responsiveConfig,
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    theme,
    avatarId: values.avatar?.id ?? null,
    coverId: values.cover?.id ?? null,
    backgroundImageId: values.backgroundImage?.id ?? null,
  };
  if (!page) return { ...base, template: values.template };
  return contentDirty
    ? { ...base, content: values.content, contentVersion: page.contentVersion }
    : base;
}
