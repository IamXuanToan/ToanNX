"use client";

import { FolderCog, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { DataTable } from "@/shares/components/common/data-table";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { Button } from "@/shares/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { SelectField } from "@/shares/components/common/select-field";

import type { FolderCapabilities } from "../types/attachment-folder.types";
import { UNFILED_FOLDER } from "../constants/media-types";
import { folderPath } from "../utils/folder-path";
import { useAttachmentFolderManager } from "./hooks/use-attachment-folder-manager";

/** @param props - Quyền folder độc lập với quyền file. @returns Quản lý tên nhóm ngay tại chỗ, không rời form đang chọn ảnh. */
export function AttachmentFolderManager({
  capabilities,
  disabled,
}: {
  capabilities?: FolderCapabilities;
  disabled?: boolean;
}) {
  const t = useTranslations("attachment");
  const state = useAttachmentFolderManager(Boolean(capabilities?.canRead));
  if (
    !capabilities?.canRead ||
    !(capabilities.canCreate || capabilities.canUpdate || capabilities.canDelete)
  )
    return null;
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => state.setOpen(true)}
      >
        <FolderCog />
        {t("manageFolders")}
      </Button>
      <Dialog open={state.open} onOpenChange={(open) => !state.busy && state.setOpen(open)}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("manageFolders")}</DialogTitle>
            <DialogDescription>{t("folderDescription")}</DialogDescription>
          </DialogHeader>
          {capabilities.canCreate || state.editing ? (
            <Form
              onSubmit={(event) => {
                event.stopPropagation();
                void state.save(event);
              }}
              className="space-y-3"
            >
              <FormField control={state.form.control} name="name" label={t("folderName")} required>
                {(field) => <Input {...field} maxLength={150} disabled={state.busy} />}
              </FormField>
              <FormField control={state.form.control} name="parentId" label={t("parentFolder")}>
                {(field) => (
                  <SelectField
                    id={field.id}
                    value={field.value}
                    onValueChange={field.onChange}
                    searchable
                    disabled={state.busy || state.query.isPending || state.query.isError}
                    options={[
                      { value: UNFILED_FOLDER, label: t("rootFolder") },
                      ...state.parentOptions,
                    ]}
                  />
                )}
              </FormField>
              {state.form.formState.errors.root ? (
                <p role="alert" className="text-destructive text-sm">
                  {state.form.formState.errors.root.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                {state.editing ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={state.busy}
                    onClick={state.cancelEdit}
                  >
                    {t("cancel")}
                  </Button>
                ) : null}
                <Button type="submit" disabled={state.busy}>
                  {state.busy ? <Loader2 className="animate-spin" /> : null}
                  {state.editing ? t("saveFolder") : t("createFolder")}
                </Button>
              </div>
            </Form>
          ) : null}
          <DataTable
            tableId="attachment-folders"
            columns={[
              {
                id: "name",
                header: t("folderName"),
                mobile: "title",
                cell: (folder) => (
                  <span className="block max-w-xs font-medium break-all">
                    {folderPath(folder, state.query.data ?? [])}
                  </span>
                ),
              },
              {
                id: "count",
                header: t("fileCount"),
                align: "end",
                cell: (folder) => folder.fileCount,
              },
            ]}
            rows={state.query.data}
            getRowId={(folder) => folder.id}
            getRowLabel={(folder) => folder.name}
            isLoading={state.query.isPending}
            error={state.query.isError ? { onRetry: () => state.query.refetch() } : null}
            onReload={() => state.query.refetch()}
            onEdit={capabilities.canUpdate && !state.busy ? state.edit : undefined}
            rowActions={
              capabilities.canDelete
                ? [
                    {
                      key: "delete",
                      label: t("deleteFolder"),
                      icon: Trash2,
                      destructive: true,
                      onClick: (folder) => !state.busy && state.setPendingDelete(folder),
                    },
                  ]
                : undefined
            }
            empty={{ title: t("noFolders") }}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={state.busy}
              onClick={() => state.setOpen(false)}
            >
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(state.pendingDelete)}
        onOpenChange={(open) => !open && state.setPendingDelete(null)}
        title={t("deleteFolder")}
        description={
          <span className="flex flex-col gap-3">
            <span className="break-all">
              {state.pendingDelete?.name}: {t("deleteFolderDescription")}
            </span>
            <SelectField
              aria-label={t("folderDeleteMode")}
              value={state.deleteFiles ? "DELETE" : "KEEP"}
              onValueChange={(value) => state.setDeleteFiles(value === "DELETE")}
              disabled={state.busy}
              options={[
                { value: "KEEP", label: t("keepFiles") },
                {
                  value: "DELETE",
                  label: t("deleteFolderFiles"),
                  disabled: !capabilities.canDeleteFiles,
                },
              ]}
            />
            <span>{state.deleteFiles ? t("deleteDescription") : t("keepFilesDescription")}</span>
            {!capabilities.canDeleteFiles ? <span>{t("requiresFileDelete")}</span> : null}
          </span>
        }
        confirmLabel={t("deleteFolder")}
        onConfirm={state.confirmDelete}
        isPending={state.busy}
      />
    </>
  );
}
