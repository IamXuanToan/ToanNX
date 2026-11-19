"use client";

import type { ComponentProps } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { AttachmentImageUpload } from "../components/attachment-image-upload/attachment-image-upload";
import { ATTACHMENT_FOLDER_PERMISSIONS } from "../permissions/attachment-folder-permission";
import { ATTACHMENT_PERMISSIONS } from "../permissions/attachment-permission";

/** @param props - Ô ảnh của form sử dụng Attachment. @returns Adapter chọn ảnh theo quyền Thư viện. */
export function AttachmentImageUploadView(
  props: Omit<ComponentProps<typeof AttachmentImageUpload>, "canRead" | "canUpload" | "folders">,
) {
  const canRead = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  const canReadFolders = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderRead);
  const canCreateFolders = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderCreate);
  const canUpdateFolders = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderUpdate);
  const canDeleteFolders = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderDelete);
  const canDeleteFiles = usePermission(ATTACHMENT_PERMISSIONS.delete);
  return (
    <AttachmentImageUpload
      {...props}
      canRead={canRead}
      canUpload={canUpload && canRead}
      folders={{
        canRead: canReadFolders,
        canCreate: canCreateFolders,
        canUpdate: canUpdateFolders,
        canDelete: canDeleteFolders,
        canDeleteFiles,
      }}
    />
  );
}
