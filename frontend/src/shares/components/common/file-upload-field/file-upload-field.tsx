"use client";
import { useId } from "react";
import { useTranslations } from "next-intl";
import { Field, FieldLabel, FieldError } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";
import { Button } from "@/shares/components/ui/button";
import { useFileUploadField } from "./hooks/use-file-upload-field";
import type { FileUploadOptions } from "./types";
/** Upload chung nhận callback; module Attachment cung cấp callback upload thực tế. */
export function FileUploadField({
  label,
  accept,
  disabled,
  ...props
}: FileUploadOptions & { label: string; accept?: string; disabled?: boolean }) {
  const id = useId();
  const t = useTranslations("common.components");
  const upload = useFileUploadField(props);
  const full = props.files.length >= (props.maxFiles ?? 1);
  return (
    <Field data-invalid={!!upload.error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="file"
        accept={accept}
        multiple={(props.maxFiles ?? 1) > 1}
        disabled={disabled || upload.pending || full}
        aria-invalid={!!upload.error}
        aria-describedby={upload.error ? id + "-error" : undefined}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void upload.upload(files);
        }}
      />
      <div aria-busy={upload.pending}>
        {props.files.map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-3 text-sm">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate underline"
            >
              {file.name}
            </a>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled || upload.pending}
              onClick={() => upload.remove(file.id)}
              aria-label={t("removeFile", { name: file.name })}
            >
              {t("remove")}
            </Button>
          </div>
        ))}
      </div>
      {upload.pending ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t("uploading")}
        </p>
      ) : null}
      <FieldError id={id + "-error"}>{upload.error}</FieldError>
    </Field>
  );
}
