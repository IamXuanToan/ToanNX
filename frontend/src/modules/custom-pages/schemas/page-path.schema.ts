import { z } from "zod";

import type { PagePath, PagePathInput } from "../types/custom-pages.types";

type Translate = (key: "required" | "segment") => string;

/** Segment: 1–32 ký tự a-z, 0-9, dấu gạch ngang giữa các nhóm (khớp BE `normalize_segment`). */
const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Schema form đường dẫn giữa (một form cho trang riêng và dialog tạo/sửa nhanh).
 *
 * @param t - Hàm dịch `customPages.validation`.
 * @returns Zod schema.
 */
export function pagePathSchema(t: Translate) {
  return z.object({
    segment: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, t("required"))
      .max(32)
      .regex(SEGMENT, t("segment")),
    name: z.string().trim().min(1, t("required")).max(100),
    description: z.string().max(300),
    isActive: z.boolean(),
    position: z.number().int().min(0).max(32767),
  });
}

export type PagePathFormValues = z.infer<ReturnType<typeof pagePathSchema>>;

export const PAGE_PATH_DEFAULTS: PagePathFormValues = {
  segment: "",
  name: "",
  description: "",
  isActive: true,
  position: 0,
};

export const PAGE_PATH_FORM_FIELDS = ["segment", "name", "description", "position"] as const;

/** @param path - Đường dẫn có sẵn. @returns Giá trị form. */
export function fromPagePath(path: PagePath): PagePathFormValues {
  return {
    segment: path.segment,
    name: path.name,
    description: path.description,
    isActive: path.isActive,
    position: path.position,
  };
}

/** @param values - Giá trị form. @returns Body gửi BE. */
export function toPagePathInput(values: PagePathFormValues): PagePathInput {
  return { ...values };
}
