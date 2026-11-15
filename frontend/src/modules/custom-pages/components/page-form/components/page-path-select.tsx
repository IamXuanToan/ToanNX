"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormDialog } from "@/shares/components/common/form-dialog/form-dialog";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { Button } from "@/shares/components/ui/button";

import type { PagePath } from "../../../types/custom-pages.types";
import { PagePathForm } from "../../page-path-form/page-path-form";

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
  const t = useTranslations("customPages.pages");
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const selected = paths.find((path) => path.id === value);
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
          onClick={() => setDialog("edit")}
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
          onClick={() => setDialog("create")}
        >
          <Plus />
        </Button>
      ) : null}
      <FormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === "edit" ? t("editPath") : t("createPath")}
      >
        {dialog ? (
          <PagePathForm
            path={dialog === "edit" ? selected : undefined}
            onCancel={() => setDialog(null)}
            onSaved={(path) => {
              onChange(path.id);
              setDialog(null);
            }}
          />
        ) : null}
      </FormDialog>
    </div>
  );
}
