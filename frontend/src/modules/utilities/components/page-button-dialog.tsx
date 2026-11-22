"use client";

import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { usePageButtonDialog } from "./hooks/use-page-button-dialog";

/**
 * Dialog chèn nút liên kết thường vào trang (nhãn + URL). Nút link rút gọn do `ShortLinkTiptapPlugin` cung cấp.
 *
 * @param props - Editor cần chèn (null = đóng) và callback đóng.
 * @returns Dialog.
 */
export function PageButtonDialog({
  editor,
  onClose,
}: {
  editor: Editor | null;
  onClose: () => void;
}) {
  const t = useTranslations("utilities.customPages.editor");
  const { label, setLabel, href, setHref, error, handleSubmit } = usePageButtonDialog({
    editor,
    onClose,
  });

  return (
    <Dialog open={editor !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("buttonTitle")}</DialogTitle>
        </DialogHeader>
        <form id="page-button-dialog" className="space-y-4" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="page-button-label">{t("buttonLabel")}</FieldLabel>
            <Input
              id="page-button-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="page-button-href">{t("buttonUrl")}</FieldLabel>
            <Input
              id="page-button-href"
              type="url"
              value={href}
              onChange={(event) => setHref(event.target.value)}
            />
          </Field>
          <FieldError>{error}</FieldError>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="page-button-dialog">
            {t("insert")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
