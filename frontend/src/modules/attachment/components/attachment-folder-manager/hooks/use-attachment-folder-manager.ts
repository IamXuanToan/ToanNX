"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";
import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";

import {
  useAttachmentFolders,
  useAttachmentFolderMutations,
} from "../../../hooks/use-attachment-folders";
import type { AttachmentFolder } from "../../../types/attachment.types";
import { canParentFolder, folderPath } from "../../../utils/folder-path";
import { UNFILED_FOLDER } from "../../../constants/media-types";

/** @param canRead - Quyền đọc danh mục. @returns Form tên nhóm và các thao tác nhỏ ngay trong thư viện. */
export function useAttachmentFolderManager(canRead: boolean) {
  const t = useTranslations("attachment");
  const currentUser = useCurrentUser();
  const errorMessage = useApiErrorMessage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AttachmentFolder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AttachmentFolder | null>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("folderNameRequired")).max(150, t("folderNameMax")),
        parentId: z.string(),
      }),
    [t],
  );
  const form = useForm<{ name: string; parentId: string }>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", parentId: UNFILED_FOLDER },
  });
  const query = useAttachmentFolders(canRead && open);
  const mutations = useAttachmentFolderMutations();
  const cancelEdit = () => {
    setEditing(null);
    form.reset({ name: "", parentId: UNFILED_FOLDER });
  };
  const save = form.handleSubmit(async ({ name, parentId }) => {
    const data = { name, parentId: parentId === UNFILED_FOLDER ? null : parentId };
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, ...data });
      else await mutations.create.mutateAsync(data);
      cancelEdit();
    } catch (error) {
      const message = isApiError(error) ? error.fieldErrors().name : undefined;
      form.setError(message ? "name" : "root", { message: message ?? errorMessage(error) });
    }
  });
  const folders = query.data ?? [];
  const parentOptions = folders
    .filter(
      (folder) =>
        folder.createdById === (editing?.createdById ?? currentUser.data?.user.id) &&
        (!editing || canParentFolder(folder, editing.id, folders)),
    )
    .map((folder) => ({ value: folder.id, label: folderPath(folder, folders) }));
  return {
    open,
    setOpen,
    editing,
    pendingDelete,
    setPendingDelete: (folder: AttachmentFolder | null) => {
      setDeleteFiles(false);
      setPendingDelete(folder);
    },
    deleteFiles,
    setDeleteFiles,
    parentOptions,
    form,
    save,
    query,
    cancelEdit,
    busy: mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending,
    edit: (folder: AttachmentFolder) => {
      setEditing(folder);
      form.reset({ name: folder.name, parentId: folder.parentId ?? UNFILED_FOLDER });
    },
    confirmDelete: () => {
      if (pendingDelete)
        mutations.remove.mutate(
          { id: pendingDelete.id, deleteFiles },
          {
            onSuccess: () => {
              cancelEdit();
              setPendingDelete(null);
            },
          },
        );
    },
  };
}
