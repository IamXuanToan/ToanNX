import { z } from "zod";

/** Schema kiểm tra dữ liệu form tạo/cập nhật mẫu email đa ngôn ngữ. */
export const emailTemplateFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_]+$/),
  name: z.string().trim().max(150).optional(),
  description: z.string().max(300).optional(),
  locale: z.string().trim().min(2).max(10),
  scope: z.enum(["SYSTEM", "PERSONAL"]),
  category: z.enum(["AUTH", "NOTIFICATION", "FEEDBACK_THANKS", "CUSTOM"]),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  subject: z.string().trim().max(200).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  htmlBody: z.string().optional(),
  variables: z.array(z.string().trim().min(1)).optional(),
});

/** Kiểu dữ liệu form mẫu email. */
export type EmailTemplateFormValues = z.infer<typeof emailTemplateFormSchema>;
