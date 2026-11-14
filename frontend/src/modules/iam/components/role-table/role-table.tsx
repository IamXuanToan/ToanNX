"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shares/components/common/empty-state";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Skeleton } from "@/shares/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shares/components/ui/table";
import { APP_ROUTES } from "@/shares/constants/routes";

import { useRoleTable } from "./hooks/use-role-table";

/**
 * Bảng vai trò.
 *
 * @returns Bảng vai trò.
 */
export function RoleTable() {
  const t = useTranslations("iam.roles");
  const tStatus = useTranslations("common.status");
  const { query } = useRoleTable();

  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.role")}</TableHead>
            <TableHead className="text-right">{t("columns.permissions")}</TableHead>
            <TableHead className="text-right">{t("columns.users")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
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
            query.data.items.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Link
                    href={APP_ROUTES.adminRoleDetail(role.id)}
                    className="font-medium hover:underline"
                  >
                    {role.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">{role.code}</span>
                    {role.isSystem ? <Badge variant="outline">{t("system")}</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{role.permissionCount}</TableCell>
                <TableCell className="text-right tabular-nums">{role.userCount}</TableCell>
                <TableCell>
                  <Badge variant={role.isActive ? "secondary" : "destructive"}>
                    {role.isActive ? tStatus("active") : tStatus("inactive")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {query.data && query.data.items.length === 0 ? <EmptyState title={t("empty")} /> : null}
    </div>
  );
}
