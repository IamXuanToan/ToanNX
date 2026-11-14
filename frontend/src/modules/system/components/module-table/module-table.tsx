"use client";

import { useTranslations } from "next-intl";

import { ErrorState } from "@/shares/components/errors/error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Switch } from "@/shares/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shares/components/ui/table";

import { ModuleIcon } from "../module-icon/module-icon";
import { ModuleIconDialog } from "../module-icon-dialog/module-icon-dialog";
import { useModuleTable } from "./hooks/use-module-table";

/**
 * Bảng module đã cài: icon, phiên bản, phụ thuộc, bật/tắt (module lõi không tắt được).
 *
 * @returns Bảng module.
 */
export function ModuleTable() {
  const t = useTranslations("system.modules");
  const { query, canManage, pendingCode, setEnabled } = useModuleTable();

  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.module")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("columns.version")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("columns.dependencies")}</TableHead>
            <TableHead className="text-right">{t("columns.enabled")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Skeleton className="h-16 w-full" />
              </TableCell>
            </TableRow>
          ) : (
            query.data.map((module) => (
              <TableRow key={module.code}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {canManage ? (
                      <ModuleIconDialog module={module} />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-md border">
                        <ModuleIcon icon={module.icon} iconUrl={module.iconUrl} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{module.name}</span>
                        {module.isCore ? <Badge variant="outline">{t("core")}</Badge> : null}
                      </div>
                      <p className="text-muted-foreground text-xs">{module.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden font-mono text-xs sm:table-cell">
                  {module.version}
                </TableCell>
                <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                  {module.dependencies.join(", ") || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={module.enabled}
                    disabled={!canManage || module.isCore || pendingCode === module.code}
                    onCheckedChange={(checked) => setEnabled(module.code, checked)}
                    aria-label={module.name}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
