"use client";

import type { Editor } from "@tiptap/react";
import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { useTiptapInsertItem } from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-plugins";
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

import { SHORT_LINK_PERMISSIONS } from "../permissions/short-link-permission";
import { useShortLinkOptions } from "../hooks/use-short-link-options";

/** Dialog chọn link rút gọn của mình và nhãn nút. */
function ShortLinkButtonInsert() {
  const t = useTranslations("shortLinks.editor");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [linkId, setLinkId] = useState("");
  const [label, setLabel] = useState("");
  const options = useShortLinkOptions("", editor !== null);
  useTiptapInsertItem({
    key: "short-link-button",
    label: t("insert"),
    icon: Link2,
    run: setEditor,
  });
  const links = options.data ?? [];
  const selected = links.find((link) => link.id === linkId);
  const close = () => {
    setEditor(null);
    setLinkId("");
    setLabel("");
  };
  return (
    <Dialog open={editor !== null} onOpenChange={(open) => !open && close()}>
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
            onValueChange={(value) => {
              setLinkId(value);
              if (!label) setLabel(links.find((link) => link.id === value)?.name ?? "");
            }}
            disabled={options.isPending}
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
          <Button
            type="button"
            disabled={!selected || !label.trim()}
            onClick={() => {
              if (!selected) return;
              // Lưu `shortLinkId`: BE dựng `href` theo slug hiện tại và bỏ nút khi link tắt/hết hạn.
              editor
                ?.chain()
                .focus()
                .insertContent({
                  type: "button",
                  attrs: {
                    label: label.trim(),
                    href: selected.shortUrl,
                    shortLinkId: selected.id,
                    variant: "primary",
                  },
                })
                .run();
              close();
            }}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Plugin editor: chèn nút trỏ tới link rút gọn của mình. Page ghép vào editor của Custom Pages qua slot.
 *
 * @returns Plugin (không render gì khi không có quyền xem link).
 */
export function ShortLinkTiptapPlugin() {
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  return canRead ? <ShortLinkButtonInsert /> : null;
}
