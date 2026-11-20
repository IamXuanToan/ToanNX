"use client";

import { useTranslations } from "next-intl";

import { ChoiceList } from "@/shares/components/common/choice-list";
import { FormSection } from "@/shares/components/common/form-section";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useUserRolePicker } from "./hooks/use-user-role-picker";

/**
 * Card "Vai trò" trong form người dùng (cắm qua slot `extensions` của Account), giống nhau ở tạo và sửa:
 * khối trải ngang dưới hai cột, hiện **hết** vai trò dạng lưới card `ChoiceList` (tên, mã, mô tả; có ô tìm
 * khi nhiều vai trò), đếm đã chọn/tổng ở đầu card, tick để chọn, lưu cùng form.
 *
 * @param props - Id người dùng đang sửa / nguồn sao chép, quyền đọc và gán vai trò.
 * @returns Card vai trò.
 */
export function UserRolePicker(props: {
  userId?: string;
  copyFrom?: string;
  canRead: boolean;
  canAssign: boolean;
}) {
  const t = useTranslations("iam.userRoles");
  const tChoice = useTranslations("common.choice");
  const state = useUserRolePicker(props);

  return (
    <FormSection
      title={t("title")}
      headerAction={
        state.items.length ? (
          <span className="bg-primary-light text-primary rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {t("selectedCount", { count: state.value.length, total: state.items.length })}
          </span>
        ) : null
      }
    >
      <p className="text-muted-foreground text-sm">
        {state.isSuperuser ? t("superuserHint") : t("hint")}
      </p>
      {state.isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}
      {state.isError ? <ErrorState onRetry={state.retry} /> : null}
      {!state.readOnly && !state.isLoading && !state.isError && state.items.length ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={state.disabled}
            onClick={state.selectAll}
          >
            {tChoice("selectAll")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={state.disabled || !state.value.length}
            onClick={() => state.setValue([])}
          >
            {tChoice("clearAll")}
          </Button>
        </div>
      ) : null}
      {!state.isLoading && !state.isError ? (
        <ChoiceList
          items={state.items}
          value={state.value}
          onToggle={
            state.readOnly
              ? undefined
              : (role, selected) =>
                  state.setValue(
                    selected ? [...state.value, role] : state.value.filter((id) => id !== role),
                  )
          }
          control={state.readOnly ? "none" : "checkbox"}
          layout="grid"
          disabled={state.disabled}
          aria-label={t("title")}
        />
      ) : null}
    </FormSection>
  );
}
