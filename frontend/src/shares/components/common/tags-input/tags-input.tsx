"use client";

import { cn } from "cn";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Tách chuỗi người dùng gõ/dán thành các thẻ (phân cách bằng dấu phẩy hoặc xuống dòng).
 *
 * @param raw - Chuỗi gốc.
 * @returns Danh sách thẻ đã trim, bỏ rỗng.
 */
export function splitTags(raw: string): string[] {
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Thêm thẻ vào danh sách, bỏ trùng không phân biệt hoa thường, giữ thứ tự.
 *
 * @param current - Danh sách hiện tại.
 * @param items - Thẻ mới.
 * @returns Danh sách mới.
 */
export function mergeTags(current: string[], items: string[]): string[] {
  const seen = new Set(current.map((item) => item.toLowerCase()));
  const next = [...current];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

/**
 * Ô nhập nhiều thẻ (nhãn, email người nhận…): thẻ nằm trong cùng khung với ô gõ; Enter hoặc `,`
 * để thêm, dán danh sách nhiều dòng/có dấu phẩy để thêm hàng loạt, Backspace khi ô trống để xoá thẻ
 * cuối, bỏ trùng. Điều khiển (controlled).
 *
 * @param props - Danh sách thẻ, callback, placeholder, trạng thái.
 * @returns Ô nhập thẻ.
 */
export function TagsInput({
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const t = useTranslations("common.tagsInput");
  const [draft, setDraft] = useState("");
  const commit = (raw: string) => {
    const items = splitTags(raw);
    if (items.length) onChange(mergeTags(value, items));
    setDraft("");
  };

  return (
    <div
      aria-invalid={invalid || undefined}
      className={cn(
        "border-input bg-card focus-within:border-ring focus-within:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border px-2 py-1.5 focus-within:ring-3",
        disabled && "opacity-50",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="bg-secondary text-secondary-foreground inline-flex h-7 max-w-full items-center gap-1 rounded-lg pr-1 pl-2.5 text-sm"
        >
          <span className="truncate">{tag}</span>
          {!disabled ? (
            <button
              type="button"
              aria-label={t("remove", { tag })}
              className="hover:bg-foreground/10 rounded-md p-0.5"
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </span>
      ))}
      <input
        value={draft}
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder ?? t("placeholder")}
        placeholder={value.length ? undefined : (placeholder ?? t("placeholder"))}
        className="placeholder:text-muted-foreground h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit(draft);
          } else if (event.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onPaste={(event) => {
          const text = event.clipboardData.getData("text");
          if (!/[\n,]/.test(text)) return;
          event.preventDefault();
          commit(text);
        }}
        onBlur={() => draft.trim() && commit(draft)}
      />
    </div>
  );
}
