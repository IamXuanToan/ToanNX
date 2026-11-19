"use client";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { AttachmentLibrary } from "../components/attachment-library/attachment-library";
import { ATTACHMENT_FOLDER_PERMISSIONS } from "../permissions/attachment-folder-permission";
import { ATTACHMENT_PERMISSIONS } from "../permissions/attachment-permission";

/** @returns Thư viện với các khả năng đã kiểm tra ở view; backend vẫn thực thi quyền. */
export function AttachmentLibraryView() {
  const canRead = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  const canDelete = usePermission(ATTACHMENT_PERMISSIONS.delete);
  const canManageAll = usePermission(ATTACHMENT_PERMISSIONS.manageAll);
  const canMove = usePermission(ATTACHMENT_PERMISSIONS.update);
  const folderRead = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderRead);
  const folderCreate = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderCreate);
  const folderUpdate = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderUpdate);
  const folderDelete = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderDelete);
  if (!canRead) return <ForbiddenView />;
  return (
    <AttachmentLibrary
      canRead={canRead}
      canUpload={canUpload}
      canDelete={canDelete}
      canManageAll={canManageAll}
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
