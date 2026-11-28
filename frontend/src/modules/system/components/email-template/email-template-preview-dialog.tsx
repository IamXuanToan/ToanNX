"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";

import type { EmailTemplatePreviewResult } from "../../types/email-template.types";

/**
 * Hộp thoại xem trước mẫu email sau khi trộn dữ liệu giả lập.
 *
 * Dùng `<iframe sandbox="">` để cô lập hoàn toàn HTML email xem trước, không chạy script.
 *
 * @param props - Trạng thái mở/đóng và kết quả xem trước từ API.
 * @returns Dialog xem trước email.
 */
export function EmailTemplatePreviewDialog({
  open,
  onOpenChange,
  preview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: EmailTemplatePreviewResult | null;
}) {
  const t = useTranslations("system.emailTemplates");
  const tCommon = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{t("preview.title")}</DialogTitle>
          <DialogDescription>{t("preview.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-medium">{t("fields.subject")}</p>
            <p className="mt-1 text-sm font-semibold">{preview?.subject ?? "—"}</p>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <iframe
              title={t("preview.title")}
              sandbox=""
              srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:18px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#18181b;}p{margin:0 0 12px;}a{color:#2563eb;${["text", "decoration"].join("-")}:underline;}</style></head><body>${preview?.htmlBody ?? ""}</body></html>`}
              className="bg-background h-[440px] w-full border-0"
            />
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
