"use client";

import { cn } from "cn";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { SEARCH_MAX_LENGTH, SEARCH_MAX_TERMS } from "@/shares/lib/search-text";

import { useSearchInput } from "./hooks/use-search-input";
import { InlineHelpTooltip } from "./inline-help-tooltip";

/**
 * Ô tìm chuẩn: Enter áp dụng từ khóa, gõ không gọi tìm kiếm; nút xóa áp dụng từ khóa rỗng.
 * Tự chặn gửi từ khóa vượt quá giới hạn độ dài / số từ của backend.
 *
 * @param props - Giá trị, callback, placeholder.
 * @returns Ô tìm.
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const t = useTranslations("common.search");
  const errorId = useId();
  const search = useSearchInput(value, onValueChange);
  return (
    <div className={cn("w-full sm:max-w-sm", className)}>
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          maxLength={SEARCH_MAX_LENGTH}
          value={search.draft}
          onChange={(event) => search.setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              search.submit();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={search.hasError || undefined}
          aria-describedby={search.hasError ? errorId : undefined}
          className={cn(
            "pl-9 [&::-webkit-search-cancel-button]:hidden",
            search.draft ? "pr-16" : "pr-10",
          )}
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
          {search.draft ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={search.clear}
              aria-label={t("clear")}
              className="text-muted-foreground size-7 rounded-lg"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : null}
          <InlineHelpTooltip content={t("hint")} label={t("hintLabel")} />
        </div>
      </div>
      {search.hasError ? (
        <p id={errorId} role="alert" className="text-destructive mt-1 text-xs">
          {t("limitExceeded", { maxTerms: SEARCH_MAX_TERMS, maxLength: SEARCH_MAX_LENGTH })}
        </p>
      ) : null}
    </div>
  );
}
