"use client";

import { Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataPagination } from "@/shares/components/common/data-pagination";
import { EmptyState } from "@/shares/components/common/empty-state";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Input } from "@/shares/components/ui/input";
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

import { useUserTable } from "./hooks/use-user-table";

/**
 * Bảng người dùng có tìm kiếm và phân trang.
 *
 * @returns Bảng người dùng.
 */
export function UserTable() {
  const t = useTranslations("account.users");
  const tCommon = useTranslations("common.status");
  const format = useFormatter();
  const { query, search, onSearchChange, setPage } = useUserTable();

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="pl-8"
        />
      </div>
      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.user")}</TableHead>
                <TableHead>{t("columns.access")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.lastLogin")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending
                ? Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : query.data?.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link
                          href={APP_ROUTES.adminUserDetail(user.id)}
                          className="font-medium hover:underline"
                        >
                          {user.fullName || user.email}
                        </Link>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.isSuperuser ? <Badge>{t("superuser")}</Badge> : null}
                          {user.isStaff && !user.isSuperuser ? (
                            <Badge variant="secondary">{t("staff")}</Badge>
                          ) : null}
                          {user.isNovel ? <Badge variant="outline">{t("novel")}</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "secondary" : "destructive"}>
                          {user.isActive ? tCommon("active") : tCommon("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                        {user.lastLogin ? format.relativeTime(new Date(user.lastLogin)) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {query.data && query.data.items.length === 0 ? <EmptyState title={t("empty")} /> : null}
        </div>
      )}
      {query.data ? (
        <DataPagination
          pagination={query.data.pagination}
          onPageChange={setPage}
          disabled={query.isFetching}
        />
      ) : null}
    </div>
  );
}
