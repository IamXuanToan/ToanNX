"use client";

import { cn } from "cn";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { SEARCH_MAX_LENGTH, SEARCH_MAX_TERMS } from "@/shares/lib/search-text";

import { useSearchInput } from "./hooks/use-search-input";

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
          className="pr-11 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {search.draft ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={search.clear}
            aria-label={t("clear")}
            className="text-muted-foreground absolute top-1/2 right-0.5 size-9 -translate-y-1/2 rounded-lg"
          >
            <X />
          </Button>
        ) : null}
      </div>
      {search.hasError ? (
        <p id={errorId} role="alert" className="text-destructive mt-1 text-xs">
          {t("limitExceeded", { maxTerms: SEARCH_MAX_TERMS, maxLength: SEARCH_MAX_LENGTH })}
        </p>
      ) : null}
    </div>
  );
}
