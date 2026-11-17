"use client";

import type { ComponentProps } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { AttachmentImageUpload } from "../components/attachment-image-upload/attachment-image-upload";
import { ATTACHMENT_PERMISSIONS } from "../constants/attachment-permissions";

/** @param props - Ô ảnh của form sử dụng Attachment. @returns Adapter chọn ảnh theo quyền Thư viện. */
export function AttachmentImageUploadView(
  props: Omit<ComponentProps<typeof AttachmentImageUpload>, "canRead" | "canUpload" | "folders">,
) {
  const canRead = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  const canReadFolders = usePermission(ATTACHMENT_PERMISSIONS.folderRead);
  const canCreateFolders = usePermission(ATTACHMENT_PERMISSIONS.folderCreate);
  const canUpdateFolders = usePermission(ATTACHMENT_PERMISSIONS.folderUpdate);
  const canDeleteFolders = usePermission(ATTACHMENT_PERMISSIONS.folderDelete);
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
