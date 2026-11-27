"use client";

import {
  Bot,
  ChevronDown,
  ChevronUp,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import type { ActivityItem, ActivityTone } from "@/shares/types/activity-timeline.types";

import { ActivityChangeRow } from "./activity-change-row";

const DEFAULT_VISIBLE_GRID_FIELDS = 6;
const COLLAPSE_THRESHOLD = 9;

const TONE_CIRCLE_CLASSES: Record<ActivityTone, string> = {
  create: "border-success/25 bg-success-bg text-success",
  restore: "border-success/25 bg-success-bg text-success",
  delete: "border-destructive/25 bg-destructive/10 text-destructive",
  event: "border-info/25 bg-info-bg text-info",
  update: "border-border bg-muted text-muted-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
};

const TONE_BADGE_CLASSES: Record<ActivityTone, string> = {
  create: "border-success/25 bg-success-bg text-success",
  restore: "border-success/25 bg-success-bg text-success",
  delete: "border-destructive/25 bg-destructive/10 text-destructive",
  event: "border-info/25 bg-info-bg text-info",
  update: "border-border bg-muted/70 text-foreground",
  neutral: "border-border bg-muted/70 text-foreground",
};

function renderToneIcon(tone: ActivityTone) {
  switch (tone) {
    case "create":
      return <Plus className="size-4" />;
    case "restore":
      return <RotateCcw className="size-4" />;
    case "delete":
      return <Trash2 className="size-4" />;
    case "event":
      return <Sparkles className="size-4" />;
    case "update":
      return <Pencil className="size-3.5" />;
    default:
      return <History className="size-4" />;
  }
}

/**
 * Một mốc sự kiện trên dòng thời gian lịch sử thay đổi:
 * vòng tròn 32px kèm icon phân loại hành động, đường nối 2px thẳng hàng,
 * tiêu đề tác nhân (`fullname (username)` / `Hệ thống`), mốc thời gian `dd/MM/yyyy HH:mm:ss (tương đối)`
 * và khối diff chi tiết từng trường.
 *
 * @param props - Mốc sự kiện và cờ hiển thị đường nối bên dưới.
 * @returns Phần tử `<li>` trên dòng thời gian.
 */
export function ActivityTimelineItem({
  item,
  showConnector,
}: {
  item: ActivityItem;
  showConnector: boolean;
}) {
  const t = useTranslations("common.timeline");
  const [expanded, setExpanded] = useState(false);

  const tone: ActivityTone = item.tone ?? "update";
  const totalChanges = item.changes.length;
  const isCreation = tone === "create";
  const useGrid = totalChanges >= (isCreation ? 2 : 4);
  const gridColumns: 2 | 3 = isCreation ? 3 : 2;
  const canCollapse = totalChanges > COLLAPSE_THRESHOLD;
  const visibleChanges =
    canCollapse && !expanded ? item.changes.slice(0, DEFAULT_VISIBLE_GRID_FIELDS) : item.changes;

  return (
    <li className="relative flex gap-3 pb-6 last:pb-0 sm:gap-3.5">
      {showConnector ? (
        <span aria-hidden="true" className="bg-border absolute top-10 bottom-1 left-[15px] w-0.5" />
      ) : null}

      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full border",
          TONE_CIRCLE_CLASSES[tone],
        )}
      >
        {renderToneIcon(tone)}
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {item.actionBadge ? (
              <Badge
                variant="outline"
                className={cn(
                  "h-5 rounded-md px-1.5 text-[11px] font-medium",
                  TONE_BADGE_CLASSES[tone],
                )}
              >
                {item.actionBadge}
              </Badge>
            ) : null}

            <p className="text-foreground min-w-0 text-sm leading-5 break-words">
              <span className="inline-flex items-center gap-1 font-medium">
                {item.isSystem ? (
                  <Bot aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
                ) : (
                  <User aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
                )}
                <span>{item.actor}</span>
              </span>{" "}
              <span className="text-muted-foreground">{item.action}</span>
            </p>

            {totalChanges > 0 ? (
              <span className="text-muted-foreground text-xs">
                · {t("changesCount", { count: totalChanges })}
              </span>
            ) : null}
          </div>

          <div className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {item.dateTime ? <TimestampText value={item.dateTime} /> : item.time}
          </div>
        </div>

        {totalChanges > 0 ? (
          <div className="border-border/70 bg-muted/25 mt-2.5 overflow-hidden rounded-xl border">
            {useGrid ? (
              <dl
                className={cn(
                  "grid grid-cols-1 gap-x-6 gap-y-3 p-3.5",
                  gridColumns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2",
                )}
              >
                {visibleChanges.map((change) => (
                  <ActivityChangeRow
                    key={change.field}
                    change={change}
                    isCreation={isCreation}
                    variant="cell"
                    columns={gridColumns}
                  />
                ))}
              </dl>
            ) : (
              <dl className="divide-border/50 divide-y">
                {visibleChanges.map((change) => (
                  <ActivityChangeRow
                    key={change.field}
                    change={change}
                    isCreation={isCreation}
                    variant="row"
                  />
                ))}
              </dl>
            )}
            {canCollapse ? (
              <div className="border-border/50 bg-muted/30 border-t px-3.5 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs font-medium"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="size-3.5" />
                      <span>{t("collapseFields")}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" />
                      <span>{t("showAllFields", { count: totalChanges })}</span>
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
