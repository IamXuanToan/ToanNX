import { z } from "zod";

type Translate = (key: "required" | "codeFormat") => string;

/**
 * Schema vai trò.
 *
 * @param t - Hàm dịch `iam.validation`.
 * @returns Zod schema.
 */
export function roleSchema(t: Translate) {
  return z.object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z][A-Z0-9_]{1,63}$/, t("codeFormat")),
    name: z.string().trim().min(1, t("required")).max(150),
    description: z.string().trim(),
    isActive: z.boolean(),
  });
}

export type RoleFormValues = z.infer<ReturnType<typeof roleSchema>>;
