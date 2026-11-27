"use client";

import { cn } from "cn";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { InlineHelpTooltip } from "./inline-help-tooltip";
import { mergeTags, splitTags, useTagsInput } from "./hooks/use-tags-input";

export { splitTags, mergeTags };

/**
 * Ô nhập nhiều thẻ (nhãn, email người nhận…): thẻ nằm trong cùng khung với ô gõ; Enter hoặc `,`
 * để thêm, dán danh sách nhiều dòng/có dấu phẩy để thêm hàng loạt, Backspace khi ô trống để xoá thẻ
 * cuối, bỏ trùng, kèm biểu tượng chấm than Tooltip giải thích phím Enter. Điều khiển (controlled).
 *
 * @param props - Danh sách thẻ, callback, placeholder, hướng dẫn và trạng thái.
 * @returns Ô nhập thẻ.
 */
export function TagsInput({
  value,
  onChange,
  placeholder,
  tooltip,
  tooltipLabel,
  disabled,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  tooltip?: ReactNode;
  tooltipLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const t = useTranslations("common.tagsInput");
  const { draft, setDraft, removeTag, handleKeyDown, handlePaste, handleBlur } = useTagsInput({
    value,
    onChange,
  });

  return (
    <div
      aria-invalid={invalid || undefined}
      className={cn(
        "border-input bg-card focus-within:border-ring focus-within:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 flex min-h-10 w-full items-center gap-1.5 rounded-xl border px-2 py-1.5 focus-within:ring-3",
        disabled && "opacity-50",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-secondary text-secondary-foreground inline-flex h-7 max-w-full items-center gap-1 rounded-lg pr-1 pl-2.5 text-sm"
          >
            <span className="truncate">{tag}</span>
            {!disabled ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("remove", { tag })}
                className="hover:bg-foreground/10 size-5 rounded-md p-0"
                onClick={() => removeTag(tag)}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </span>
        ))}
        <Input
          value={draft}
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder ?? t("placeholder")}
          placeholder={value.length ? undefined : (placeholder ?? t("placeholder"))}
          className="placeholder:text-muted-foreground h-7 min-w-24 flex-1 rounded-none border-0 bg-transparent px-1 text-sm shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
        />
      </div>
      <div className="flex shrink-0 items-center pr-0.5">
        <InlineHelpTooltip content={tooltip ?? t("hint")} label={tooltipLabel ?? t("hintLabel")} />
      </div>
    </div>
  );
}
