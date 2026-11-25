"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { FieldError } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

/**
 * Dialog nhập URL ảnh ngoài hoặc video YouTube được mở khi chọn lệnh tương ứng từ Slash Menu `/`.
 */
export function TiptapNotionUrlDialog({
  kind,
  value,
  error,
  onValueChange,
  onClose,
  onSubmit,
}: {
  kind: "image" | "youtube" | null;
  value: string;
  error: string;
  onValueChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("common.editor");

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === "youtube" ? t("insertYoutubeTitle") : t("insertImageTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                onSubmit();
              }
            }}
            placeholder={t("urlPlaceholder")}
            autoFocus
          />
          <FieldError>{error}</FieldError>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button type="button" onClick={onSubmit}>
            {t("insertUrlAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
