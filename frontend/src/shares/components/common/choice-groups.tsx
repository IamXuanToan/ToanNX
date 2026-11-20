"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shares/components/ui/accordion";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import { ChoiceList } from "./choice-list";
import type { ChoiceControl, ChoiceItem, ChoiceLayout } from "./choice-list.types";
import { useChoiceGroups } from "./hooks/use-choice-groups";

/** Một nhóm mục (module của quyền…). */
export type ChoiceGroup = {
  key: string;
  label: string;
  /** Mã nhóm hiển thị mờ bên phải tiêu đề. */
  code?: string;
  items: ChoiceItem[];
};

/**
 * Danh sách chọn **chia nhóm** chuẩn (quyền theo module…): mỗi nhóm một mục accordion trong card,
 * mặc định mở, có Mở/Thu gọn tất cả; đầu nhóm hiện số đã chọn / tổng (hoặc tổng khi chỉ xem); nhóm có
 * nút Chọn cả nhóm / Bỏ chọn cả nhóm; mục bên trong là `ChoiceList`.
 *
 * @param props - Nhóm, giá trị, callback, kiểu control/bố cục, hàng công cụ trái/phải.
 * @returns Danh sách chọn chia nhóm.
 */
export function ChoiceGroups({
  groups,
  value,
  onChange,
  control = "checkbox",
  layout = "grid",
  disabled,
  toolbar,
  actions,
}: {
  groups: ChoiceGroup[];
  value: readonly string[];
  /** Không truyền = chỉ xem. */
  onChange?: (value: string[]) => void;
  control?: ChoiceControl;
  layout?: ChoiceLayout;
  disabled?: boolean;
  /** Bên trái hàng công cụ (ô tìm, bộ lọc). */
  toolbar?: ReactNode;
  /** Bên phải hàng công cụ, trước Mở/Thu gọn tất cả. */
  actions?: ReactNode;
}) {
  const t = useTranslations("common.choice");
  const state = useChoiceGroups({ groups, value, onChange });
  const readOnly = !onChange || control === "none";

  return (
    <div className="space-y-4">
      {toolbar || actions || groups.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {actions}
            {groups.length ? (
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={state.allOpen ? state.collapseAll : state.expandAll}
              >
                {state.allOpen ? t("collapseAll") : t("expandAll")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {groups.length ? (
        <Accordion
          type="multiple"
          value={state.openKeys}
          onValueChange={state.setOpenKeys}
          className="gap-3"
        >
          {groups.map((group) => {
            const count = state.selectedCount(group);
            const selectable = state.selectableValues(group);
            const allSelected = selectable.length > 0 && count >= selectable.length;
            return (
              <AccordionItem
                key={group.key}
                value={group.key}
                className="bg-card overflow-hidden rounded-xl border not-last:border-b"
              >
                <AccordionTrigger className="hover:bg-surface-hover items-center rounded-none px-5 py-4 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-base font-semibold">{group.label}</span>
                    <Badge
                      variant="secondary"
                      className={cn("tabular-nums", count && "bg-primary-light text-primary")}
                    >
                      {readOnly ? group.items.length : `${count}/${group.items.length}`}
                    </Badge>
                    {group.code ? (
                      <span className="text-muted-foreground ml-auto hidden pr-3 font-mono text-xs font-normal sm:inline">
                        {group.code}
                      </span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 border-t px-5 pt-4 pb-5">
                  {!readOnly && !disabled && selectable.length > 1 ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => state.toggleGroup(group, !allSelected)}
                      >
                        {allSelected ? t("unselectGroup") : t("selectGroup")}
                      </Button>
                    </div>
                  ) : null}
                  <ChoiceList
                    items={group.items}
                    value={value}
                    onToggle={readOnly ? undefined : state.toggle}
                    control={readOnly ? "none" : control}
                    layout={layout}
                    disabled={disabled}
                    aria-label={group.label}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : null}
    </div>
  );
}
