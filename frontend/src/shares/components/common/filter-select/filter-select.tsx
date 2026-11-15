"use client";

import { cn } from "cn";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/shares/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";

import {
  FORM_CONTROL_OPTION_CLASS,
  FORM_CONTROL_TRIGGER_CLASS,
} from "../form-control/form-control.styles";
import type { SelectOption } from "../select-field/select-field";
import { useFilterSelect } from "./hooks/use-filter-select";

/**
 * Bộ lọc chọn nhiều chuẩn của bảng (mọi bộ lọc trên toolbar dùng component này).
 * Ô cao 40px như mọi control: chưa chọn thì hiện tên bộ lọc; chọn một thì hiện "Tên: giá trị";
 * chọn nhiều thì hiện "Tên" + số đã chọn. Popover có danh sách checkbox, ô tìm (bỏ dấu) khi
 * nhiều lựa chọn, dòng "Chọn tất cả" (có trạng thái chọn một phần) và "Xoá lọc". Điều khiển
 * (controlled), giá trị là mảng.
 *
 * @param props - Tên bộ lọc, lựa chọn, giá trị và callback.
 * @returns Bộ lọc chọn nhiều.
 */
export function FilterSelect({
  label,
  options,
  value,
  onValueChange,
  searchable,
  disabled,
  className,
}: {
  /** Tên bộ lọc, cũng là `aria-label`. */
  label: string;
  options: SelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Ép có/không ô tìm; mặc định tự bật khi có từ 8 lựa chọn. */
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.filter");
  const tSelect = useTranslations("common.select");
  const state = useFilterSelect({ options, value, onValueChange, searchable });
  const single = state.selected.length === 1 ? state.selected[0] : undefined;

  return (
    <Popover open={state.open} onOpenChange={state.onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-expanded={state.open}
          aria-controls={state.listId}
          disabled={disabled}
          data-active={state.selected.length > 0 || undefined}
          className={cn(
            FORM_CONTROL_TRIGGER_CLASS,
            "data-active:border-primary/40 data-active:bg-primary-light/60 w-auto max-w-72 justify-between",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("shrink-0", state.selected.length === 0 && "text-foreground")}>
              {label}
              {single ? ":" : null}
            </span>
            {single ? (
              <span className="text-primary min-w-0 truncate font-medium">{single.label}</span>
            ) : null}
            {state.selected.length > 1 ? (
              <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
                {state.selected.length}
              </span>
            ) : null}
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 rounded-xl p-1">
        {state.isSearchable ? (
          <>
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <input
                autoFocus
                value={state.keyword}
                onChange={(event) => state.setKeyword(event.target.value)}
                placeholder={tSelect("search")}
                aria-label={tSelect("search")}
                aria-controls={state.listId}
                className="placeholder:text-muted-foreground h-10 w-full rounded-lg bg-transparent pr-3 pl-9 text-sm outline-none"
              />
            </div>
            <div className="bg-border -mx-1 h-px" />
          </>
        ) : null}
        <ul
          id={state.listId}
          role="listbox"
          aria-multiselectable
          aria-label={label}
          className="max-h-64 overflow-y-auto"
        >
          {state.filtered.length > 1 && !state.keyword ? (
            <li role="option" aria-selected={state.allSelected}>
              <label
                className={cn(FORM_CONTROL_OPTION_CLASS, "hover:bg-accent font-medium")}
                data-testid="filter-select-all"
              >
                <Checkbox
                  checked={state.allSelected ? true : state.value.length ? "indeterminate" : false}
                  onCheckedChange={() => state.toggleAll()}
                />
                <span className="flex-1">{t("selectAll")}</span>
              </label>
            </li>
          ) : null}
          {state.filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">
              {tSelect("empty")}
            </li>
          ) : (
            state.filtered.map((option) => {
              const checked = state.value.includes(option.value);
              return (
                <li key={option.value} role="option" aria-selected={checked}>
                  <label
                    className={cn(
                      FORM_CONTROL_OPTION_CLASS,
                      "hover:bg-accent",
                      option.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={option.disabled}
                      onCheckedChange={() => state.toggle(option.value)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description ? (
                        <span className="text-muted-foreground block truncate text-xs">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
        {state.value.length ? (
          <>
            <div className="bg-border -mx-1 h-px" />
            <button
              type="button"
              onClick={state.clear}
              className={cn(FORM_CONTROL_OPTION_CLASS, "hover:bg-accent justify-center")}
            >
              {t("clear")}
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
