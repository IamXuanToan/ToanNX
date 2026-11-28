import { z } from "zod";

/** Schema kiểm tra dữ liệu form tạo/cập nhật Ngôn ngữ (`Language`). */
export const languageFormSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(16)
    .regex(/^[a-z]{2,10}(-[a-z0-9]{2,10})?$/),
  name: z.string().trim().min(1).max(100),
  nativeName: z.string().max(100).optional(),
  flagEmoji: z.string().max(16).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

/** Kiểu dữ liệu form ngôn ngữ. */
export type LanguageFormValues = z.infer<typeof languageFormSchema>;
