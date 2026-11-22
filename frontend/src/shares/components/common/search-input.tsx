"use client";

import { cn } from "cn";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { useSearchInput } from "./hooks/use-search-input";

/**
 * Ô tìm chuẩn: Enter áp dụng từ khóa, gõ không gọi tìm kiếm; nút xóa áp dụng từ khóa rỗng.
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
  const search = useSearchInput(value, onValueChange);
  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
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
  );
}
