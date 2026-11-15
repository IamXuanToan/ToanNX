"use client";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { useUploadAttachment } from "../../../hooks/use-upload-attachment";
/** Ghép mutation Attachment với hợp đồng file của common, giữ chi tiết API trong module. */
export function useAttachmentUploadField() {
  const mutation = useUploadAttachment();
  return {
    formatError: useApiErrorMessage(),
    upload: async (file: File) => {
      const attachment = await mutation.mutateAsync(file);
      return {
        id: attachment.id,
        url: attachment.url,
        name: attachment.originalName,
        size: attachment.size,
        contentType: attachment.contentType,
      };
    },
  };
}
