"use client";

import { useTranslations } from "next-intl";

import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Field, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { useShortLinkButtonInsert } from "./hooks/use-short-link-button-insert";

/** Dialog chọn link rút gọn của mình và nhãn nút. */
export function ShortLinkButtonInsert() {
  const t = useTranslations("utilities.shortLinks.editor");
  const {
    isOpen,
    close,
    linkId,
    label,
    setLabel,
    handleSelectLink,
    links,
    selected,
    isPending,
    handleConfirm,
  } = useShortLinkButtonInsert();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="short-link-button-link">{t("link")}</FieldLabel>
          <SelectField
            id="short-link-button-link"
            searchable
            value={linkId || undefined}
            onValueChange={handleSelectLink}
            disabled={isPending}
            options={links.map((link) => ({
              value: link.id,
              label: link.name,
              description: link.shortUrl,
            }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="short-link-button-label">{t("label")}</FieldLabel>
          <Input
            id="short-link-button-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={120}
          />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={!selected || !label.trim()} onClick={handleConfirm}>
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
