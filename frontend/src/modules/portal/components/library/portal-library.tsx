"use client";

import { AttachmentLibrary } from "@/modules/system/components/attachment/attachment-library";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_FOLDER_PERMISSIONS } from "@/modules/system/permissions/attachment-folder-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";

/**
 * Thư viện tệp cá nhân trong Client Portal:
 * Tái sử dụng nguyên vẹn giao diện và tính năng của AttachmentLibrary hệ thống (như bên Quản trị):
 * Xem dạng lưới/bảng, phân trang, lọc theo định dạng, quản lý thư mục, upload kéo thả, xem chi tiết và thao tác hàng loạt.
 * Khóa canManageAll = false để đảm bảo 100% Owner Isolation chỉ thao tác trên tệp của chính mình.
 *
 * @returns Component Thư viện.
 */
export function PortalLibrary() {
  const canRead = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  const canDelete = usePermission(ATTACHMENT_PERMISSIONS.delete);
  const canMove = usePermission(ATTACHMENT_PERMISSIONS.update);
  const folderRead = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderRead);
  const folderCreate = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderCreate);
  const folderUpdate = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderUpdate);
  const folderDelete = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderDelete);

  return (
    <AttachmentLibrary
      canRead={canRead}
      canUpload={canUpload}
      canDelete={canDelete}
      canManageAll={false}
      canMove={canMove}
      folders={{
        canRead: folderRead,
        canCreate: folderCreate,
        canUpdate: folderUpdate,
        canDelete: folderDelete,
        canDeleteFiles: canDelete,
      }}
    />
  );
}
