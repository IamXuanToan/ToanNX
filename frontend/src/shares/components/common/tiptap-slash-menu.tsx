"use client";

import { cn } from "cn";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Table,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import type { TiptapSlashCommandId, TiptapSlashEntry } from "./tiptap-editor.types";
import type { TiptapSlashState } from "./hooks/use-tiptap-slash-command";

const ICON_MAP: Record<TiptapSlashCommandId, typeof Pilcrow> = {
  paragraph: Pilcrow,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  bulletList: List,
  orderedList: ListOrdered,
  taskList: ListChecks,
  blockquote: Quote,
  codeBlock: Code2,
  table: Table,
  horizontalRule: Minus,
  imageUrl: ImagePlus,
  youtube: Video,
};

/**
 * Menu lệnh nổi Slash (`/`) dùng chung cho mọi editor bật chế độ Notion-like: hiển thị dưới con trỏ,
 * gộp cả khối cơ bản, media và mục mở rộng do module truyền vào.
 */
export function TiptapSlashMenu({ slash }: { slash: TiptapSlashState }) {
  const t = useTranslations("common.editor");
  if (!slash.isOpen) return null;

  const groups: { key: TiptapSlashEntry["group"]; title: string }[] = [
    { key: "basic", title: t("slashGroupBasic") },
    { key: "media", title: t("slashGroupMedia") },
    { key: "module", title: t("slashGroupModule") },
  ];

  return (
    <div
      role="listbox"
      aria-label={t("slashTitle")}
      style={{ top: slash.coords.top, left: slash.coords.left }}
      onMouseDown={(event) => event.preventDefault()}
      className="bg-popover/95 border-border/80 animate-in fade-in-0 zoom-in-95 fixed z-50 w-72 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md duration-100"
    >
      <div className="border-border/60 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {t("slashTitle")}
        </span>
        {slash.query ? (
          <span className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[11px]">
            /{slash.query}
          </span>
        ) : null}
      </div>

      <div className="max-h-64 overflow-y-auto p-1.5">
        {slash.items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">{t("slashEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const groupItems = slash.items.filter((item) => item.group === group.key);
              if (groupItems.length === 0) return null;
              return (
                <div key={group.key} className="space-y-0.5">
                  <p className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                    {group.title}
                  </p>
                  {groupItems.map((item) => {
                    const globalIdx = slash.items.findIndex((entry) => entry.key === item.key);
                    const active = globalIdx === slash.selectedIndex;
                    const Icon =
                      item.customItem?.icon ?? (item.commandId ? ICON_MAP[item.commandId] : Plus);
                    return (
                      <Button
                        key={item.key}
                        type="button"
                        variant="ghost"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => slash.setSelectedIndex(globalIdx)}
                        onClick={() => slash.selectItem(item)}
                        className={cn(
                          "h-auto w-full justify-start gap-2.5 rounded-lg px-2 py-1.5 text-left",
                          active && "bg-accent text-accent-foreground",
                        )}
                      >
                        <span className="bg-muted border-border/60 flex size-7 shrink-0 items-center justify-center rounded-md border">
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">{item.label}</span>
                          <span className="text-muted-foreground block truncate text-[11px] font-normal">
                            {item.desc}
                          </span>
                        </span>
                      </Button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-border/60 bg-muted/40 text-muted-foreground border-t px-3 py-1.5 text-[10px]">
        {t("slashHint")}
      </div>
    </div>
  );
}
