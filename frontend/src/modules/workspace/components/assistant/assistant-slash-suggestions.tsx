"use client";

import { useTranslations } from "next-intl";

import { cn } from "cn";

import type { ResolvedAssistantSlashCommand } from "../../constants/defaults";
import { AssistantCommandBadge } from "./assistant-command-badge";

/**
 * Danh sách gợi ý câu lệnh nhanh hiện ngay phía trên ô nhập chat khi người dùng gõ `/`:
 * cho phép chọn bằng chuột hoặc bàn phím (`↑↓`, `Tab`, `Enter`, `Esc`).
 *
 * @param props - Danh sách lệnh khớp, chỉ số đang chọn, handler hover và handler chọn lệnh.
 * @returns Menu gợi ý câu lệnh hoặc `null` nếu không mở.
 */
export function AssistantSlashSuggestions({
  suggestions,
  activeIndex,
  onHoverIndex,
  onSelect,
}: {
  suggestions: readonly ResolvedAssistantSlashCommand[];
  activeIndex: number;
  onHoverIndex: (index: number) => void;
  onSelect: (item: ResolvedAssistantSlashCommand) => void;
}) {
  const t = useTranslations("workspace.assistant");

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      role="listbox"
      aria-label={t("slashSuggestTitle")}
      data-testid="assistant-slash-suggestions"
      className="border-border bg-popover text-popover-foreground absolute right-0 bottom-full left-0 z-30 mb-1.5 overflow-hidden rounded-xl border shadow-lg"
    >
      <div className="border-border/60 bg-muted/40 flex items-center justify-between border-b px-3 py-1.5 text-[11px]">
        <span className="text-muted-foreground font-medium">{t("slashSuggestTitle")}</span>
        <span className="text-muted-foreground/80 hidden sm:inline">{t("slashSuggestHint")}</span>
      </div>

      <ul className="divide-border/40 max-h-56 divide-y overflow-y-auto p-1">
        {suggestions.map((item, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <li
              key={item.key}
              role="option"
              aria-selected={isSelected}
              data-testid={`slash-option-${item.key}`}
              onMouseEnter={() => onHoverIndex(idx)}
              onMouseDown={(event) => {
                // Giữ focus trong ô nhập khi nhấn gợi ý bằng chuột.
                event.preventDefault();
                onSelect(item);
              }}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <AssistantCommandBadge
                    commandKey={item.key}
                    label={t(`slashBadges.${item.key}`)}
                    className="h-5 px-2 text-[10px]"
                  />
                  <code className="text-foreground font-mono font-semibold">{item.syntax}</code>
                </div>
                <code className="text-muted-foreground font-mono text-[10px]">{item.alias}</code>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {t(`slashCommands.${item.key}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
