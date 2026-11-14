"use client";

import { ExternalLink, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shares/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";
import { Separator } from "@/shares/components/ui/separator";

import type { ModuleInfo } from "../../types/system.types";
import { ModuleIcon } from "../module-icon/module-icon";
import { SVG_ACCEPT, useModuleIconDialog } from "./hooks/use-module-icon-dialog";

const LUCIDE_ICONS_URL = "https://lucide.dev/icons";

/**
 * Dialog đổi icon module: chọn icon lucide-react theo tên hoặc upload file SVG.
 *
 * @param props - Module cần đổi icon.
 * @returns Nút icon + dialog.
 */
export function ModuleIconDialog({ module }: { module: ModuleInfo }) {
  const t = useTranslations("system.icon");
  const tCommon = useTranslations("common.actions");
  const dialog = useModuleIconDialog(module);
  const inputId = `module-icon-${module.code}`;
  const fileId = `module-icon-file-${module.code}`;

  return (
    <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("edit", { name: module.name })}>
          <ModuleIcon icon={module.icon} iconUrl={module.iconUrl} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { name: module.name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <ModuleIcon
            icon={dialog.previewName}
            iconUrl={module.iconUrl}
            className="size-8"
            label={module.name}
          />
          <p className="text-muted-foreground text-sm">
            {module.iconUrl ? t("usingSvg") : t("usingLucide", { icon: module.icon })}
          </p>
        </div>

        <Field data-invalid={!dialog.isNameValid}>
          <FieldLabel htmlFor={inputId}>{t("lucideLabel")}</FieldLabel>
          <div className="flex gap-2">
            <Input
              id={inputId}
              value={dialog.iconName}
              onChange={(event) => dialog.setIconName(event.target.value)}
              placeholder="shield-check"
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="button"
              onClick={dialog.saveIconName}
              disabled={!dialog.isNameValid || dialog.isBusy}
            >
              {dialog.isBusy ? <Loader2 className="animate-spin" /> : null}
              {tCommon("save")}
            </Button>
          </div>
          <FieldDescription>
            {t("lucideHint")}{" "}
            <a
              href={LUCIDE_ICONS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              lucide.dev/icons
              <ExternalLink className="size-3" />
            </a>
          </FieldDescription>
          {!dialog.isNameValid ? <FieldError>{t("invalidName")}</FieldError> : null}
        </Field>

        <Separator />

        <Field>
          <FieldLabel htmlFor={fileId}>{t("svgLabel")}</FieldLabel>
          <FieldDescription>{t("svgHint")}</FieldDescription>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild disabled={dialog.isBusy}>
              <label htmlFor={fileId} className="cursor-pointer">
                <Upload />
                {t("upload")}
              </label>
            </Button>
            <input
              id={fileId}
              type="file"
              accept={SVG_ACCEPT}
              className="sr-only"
              onChange={dialog.onFileChange}
              disabled={dialog.isBusy}
            />
            {module.iconUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={dialog.removeSvg}
                disabled={dialog.isBusy}
              >
                {t("removeSvg")}
              </Button>
            ) : null}
          </div>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
