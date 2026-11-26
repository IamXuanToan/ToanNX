import { z } from "zod";

import { MONITOR_METHODS } from "../constants/defaults";

type Translate = (
  key: "required" | "url" | "expectedStatus" | "timeoutSeconds" | "checkInterval",
) => string;

const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** Tên trường form Endpoint giám sát Uptime. */
export const MONITOR_TARGET_FORM_FIELDS = [
  "name",
  "url",
  "method",
  "expectedStatus",
  "timeoutSeconds",
  "checkIntervalMinutes",
  "isActive",
] as const;

/**
 * Schema form Endpoint giám sát Uptime/HTTP.
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function monitorTargetSchema(t: Translate) {
  return z
    .object({
      name: z.string().trim().min(1, t("required")).max(200),
      url: z
        .string()
        .trim()
        .min(1, t("required"))
        .max(1000)
        .refine((v) => HTTP_URL.test(v), t("url")),
      method: z.enum(MONITOR_METHODS),
      expectedStatus: z.string().trim(),
      timeoutSeconds: z.string().trim(),
      checkIntervalMinutes: z.string().trim(),
      isActive: z.boolean(),
    })
    .superRefine((value, ctx) => {
      const code = Number(value.expectedStatus);
      if (!/^\d+$/.test(value.expectedStatus) || code < 100 || code > 599) {
        ctx.addIssue({ code: "custom", path: ["expectedStatus"], message: t("expectedStatus") });
      }
      const timeout = Number(value.timeoutSeconds);
      if (!/^\d+$/.test(value.timeoutSeconds) || timeout < 1 || timeout > 4) {
        ctx.addIssue({ code: "custom", path: ["timeoutSeconds"], message: t("timeoutSeconds") });
      }
      const interval = Number(value.checkIntervalMinutes);
      if (!/^\d+$/.test(value.checkIntervalMinutes) || interval < 15 || interval > 1440) {
        ctx.addIssue({
          code: "custom",
          path: ["checkIntervalMinutes"],
          message: t("checkInterval"),
        });
      }
    });
}

export type MonitorTargetFormValues = z.infer<ReturnType<typeof monitorTargetSchema>>;
