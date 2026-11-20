"use client";

import { History } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shares/components/ui/table";

import { JOURNAL_ROUTES } from "../constants/routes";
import { JournalValue } from "./journal-value";
import { useJournalEntryDetail } from "./hooks/use-journal-entry-detail";

/**
 * Chi tiết một mục nhật ký: ai làm, lúc nào, trên bản ghi nào, và bảng từng field đổi từ giá trị nào sang
 * giá trị nào (danh sách tô phần thêm/bỏ, JSON dàn trang).
 *
 * @param props - Id mục nhật ký.
 * @returns Trang chi tiết.
 */
export function JournalEntryDetail({ id }: { id: string }) {
  const t = useTranslations("journal");
  const format = useFormatter();
  const { query, entry, resourceName, changes, journal } = useJournalEntryDetail(id);

  if (query.isPending) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (query.isError || !entry) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={JOURNAL_ROUTES.entries}
      />
    );
  }

  const meta: Array<[string, React.ReactNode]> = [
    [
      t("columns.createdAt"),
      <time key="time" dateTime={entry.createdAt}>
        {format.dateTime(new Date(entry.createdAt), { dateStyle: "full", timeStyle: "medium" })}
      </time>,
    ],
    [t("columns.actor"), entry.actorLabel || t("system")],
    [
      t("columns.action"),
      <Badge key="action" variant={entry.action === "DELETE" ? "destructive" : "secondary"}>
        {journal.action(entry)}
      </Badge>,
    ],
    [t("columns.resource"), resourceName ? `${resourceName} (${entry.resource})` : entry.resource],
    [t("detail.object"), entry.objectLabel || "—"],
    [
      t("detail.objectId"),
      <code key="id" className="font-mono text-xs break-all">
        {entry.objectId}
      </code>,
    ],
    [
      t("detail.requestId"),
      entry.requestId ? (
        <code key="req" className="font-mono text-xs break-all">
          {entry.requestId}
        </code>
      ) : (
        "—"
      ),
    ],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("detail.title")}
        backHref={JOURNAL_ROUTES.entries}
        actions={
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: JOURNAL_ROUTES.entries,
                query: { resource: entry.resource, search: entry.objectId },
              }}
            >
              <History />
              {t("detail.recordHistory")}
            </Link>
          </Button>
        }
      />
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>{t("detail.summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr]">
            {meta.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>{t("detail.changes")}</CardTitle>
        </CardHeader>
        <CardContent>
          {changes.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">{t("detail.field")}</TableHead>
                    <TableHead>{t("detail.before")}</TableHead>
                    <TableHead>{t("detail.after")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changes.map((change) => (
                    <TableRow key={change.field} className="align-top">
                      <TableCell className="font-medium whitespace-normal">
                        {change.label}
                        <p className="text-muted-foreground font-mono text-xs">{change.field}</p>
                      </TableCell>
                      {change.diff ? (
                        <>
                          <TableCell className="whitespace-normal">
                            <JournalValue
                              value={change.before ?? []}
                              marked={change.diff.removed}
                              tone="removed"
                            />
                            {change.diff.removed.length ? (
                              <p className="text-destructive mt-2 text-xs">
                                {t("detail.removed", { count: change.diff.removed.length })}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <JournalValue
                              value={change.after}
                              marked={change.diff.added}
                              tone="added"
                            />
                            {change.diff.added.length ? (
                              <p className="text-success mt-2 text-xs">
                                {t("detail.added", { count: change.diff.added.length })}
                              </p>
                            ) : null}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-muted-foreground whitespace-normal">
                            <JournalValue value={change.before} />
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <JournalValue value={change.after} />
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("detail.noChanges")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
