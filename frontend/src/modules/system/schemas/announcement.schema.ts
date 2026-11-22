import { z } from "zod";

type Translate = (key: "required" | "link" | "roles") => string;

/** @param t - Hàm dịch `system.notifications.announcements.validation`. @returns Schema form thông báo hệ thống. */
export function announcementSchema(t: Translate) {
  return z
    .object({
      title: z.string().trim().min(1, t("required")).max(200),
      body: z.string().max(2000),
      level: z.enum(["INFO", "WARNING", "ERROR"]),
      link: z
        .string()
        .refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")), t("link")),
      target: z.enum(["ALL", "ROLES"]),
      roleIds: z.array(z.string()),
      expiresAt: z.string(),
    })
    .superRefine((value, ctx) => {
      if (value.target === "ROLES" && !value.roleIds.length)
        ctx.addIssue({ code: "custom", path: ["roleIds"], message: t("roles") });
    });
}

export type AnnouncementFormValues = z.infer<ReturnType<typeof announcementSchema>>;
