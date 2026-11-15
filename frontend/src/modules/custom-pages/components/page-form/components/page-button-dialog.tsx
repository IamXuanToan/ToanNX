"use client";

import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { isAllowedLink } from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-toolbar";
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

/**
 * Dialog chèn nút liên kết thường vào trang (nhãn + URL). Nút link rút gọn do module Short Links cắm qua plugin.
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
  const t = useTranslations("customPages.editor");
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("https://");
  const [error, setError] = useState("");
  return (
    <Dialog open={editor !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("buttonTitle")}</DialogTitle>
        </DialogHeader>
        <form
          id="page-button-dialog"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!label.trim()) return setError(t("buttonLabelRequired"));
            if (!isAllowedLink(href.trim())) return setError(t("buttonUrlInvalid"));
            editor
              ?.chain()
              .focus()
              .insertContent({
                type: "button",
                attrs: { label: label.trim(), href: href.trim(), variant: "primary" },
              })
              .run();
            setLabel("");
            setHref("https://");
            setError("");
            onClose();
          }}
        >
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
