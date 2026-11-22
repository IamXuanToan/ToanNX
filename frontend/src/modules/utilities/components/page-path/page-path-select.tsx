"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { FormDialog } from "@/shares/components/common/form-dialog";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";

import type { PagePath } from "../../types/page-path.types";
import { PagePathForm } from "./page-path-form";
import { usePagePathSelect } from "./hooks/use-page-path-select";

/**
 * Ô chọn đường dẫn giữa kèm **tạo nhanh** (`+`) và **sửa nhanh** (`✎`): mở dialog chứa đúng `PagePathForm`
 * đầy đủ; lưu xong tự chọn bản ghi, form cha không mất dữ liệu đang nhập.
 *
 * @param props - Giá trị, danh mục, callback, quyền tạo/sửa.
 * @returns Ô chọn.
 */
export function PagePathSelect({
  id,
  value,
  onChange,
  paths,
  disabled,
  invalid,
  canCreate,
  canUpdate,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  paths: PagePath[];
  disabled?: boolean;
  invalid?: boolean;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const { dialog, selected, openCreate, openEdit, closeDialog } = usePagePathSelect(paths, value);

  return (
    <div className="flex gap-2">
      <SelectField
        id={id}
        className="flex-1"
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
        invalid={invalid}
        searchable
        options={paths.map((path) => ({
          value: path.id,
          label: `/${path.segment} — ${path.name}`,
          description: path.isActive ? path.description : t("pathInactive"),
          disabled: !path.isActive && path.id !== value,
        }))}
      />
      {canUpdate && selected ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t("editPath")}
          title={t("editPath")}
          disabled={disabled}
          onClick={openEdit}
        >
          <Pencil />
        </Button>
      ) : null}
      {canCreate ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t("createPath")}
          title={t("createPath")}
          disabled={disabled}
          onClick={openCreate}
        >
          <Plus />
        </Button>
      ) : null}
      <FormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && closeDialog()}
        title={dialog === "edit" ? t("editPath") : t("createPath")}
      >
        {dialog ? (
          <PagePathForm
            path={dialog === "edit" ? selected : undefined}
            onCancel={closeDialog}
            onSaved={(path) => {
              onChange(path.id);
              closeDialog();
            }}
          />
        ) : null}
      </FormDialog>
    </div>
  );
}
