"use client";
import type { ComponentProps } from "react";
import { FileUploadField } from "@/shares/components/common/file-upload-field/file-upload-field";
import { useAttachmentUploadField } from "./hooks/use-attachment-upload-field";
/** Adapter file-upload chung nối với Attachment thật của ToanNX. */
export function AttachmentUploadField(
  props: Omit<ComponentProps<typeof FileUploadField>, "onUpload" | "formatError">,
) {
  const upload = useAttachmentUploadField();
  return <FileUploadField {...props} onUpload={upload.upload} formatError={upload.formatError} />;
}
