"use client";

import { useFormatter, useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { PageHeader } from "@/shares/components/common/page-header";
import { SelectField } from "@/shares/components/common/select-field";
import { ErrorState } from "@/shares/components/errors/error-state";
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

import { INCOME_PERMISSIONS } from "../../permissions/income-permission";
import { useFinanceReport } from "./hooks/use-finance-report";
import { IncomeTable } from "../income/income-table";
import { MoneyText } from "../income/money-text";
import { YearSelect } from "../dashboard/year-select";

const MONTHS = 12;

/**
 * Báo cáo năm/tháng: tổng thu nhập, đã khấu trừ (+ tiền thuế bị khấu trừ), chưa khấu trừ (+ chưa nhận diện),
 * cần xử lý; bảng theo nền tảng (dòng con theo %), theo tháng, theo tiền tệ; danh sách giao dịch của kỳ.
 * Không tính thuế phải nộp.
 *
 * @returns Báo cáo.
 */
export function FinanceReport() {
  const t = useTranslations("finance.report");
  const format = useFormatter();
  const state = useFinanceReport();
  const canReadIncomes = usePermission(INCOME_PERMISSIONS.read);
  const canUpdate = usePermission(INCOME_PERMISSIONS.update);
  const data = state.query.data;
  const monthOptions = [
    { value: "", label: t("allMonths") },
    ...Array.from({ length: MONTHS }, (_, index) => ({
      value: String(index + 1),
      label: format.dateTime(new Date(state.year, index, 1), { month: "long" }),
    })),
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex flex-wrap gap-2">
            {state.canFilterOwner ? (
              <FilterSelect
                label={t("owner")}
                options={state.ownerOptions}
                value={state.owner}
                onValueChange={state.setOwner}
              />
            ) : null}
            <YearSelect value={state.year} years={state.years} onChange={state.setYear} />
            <SelectField
              className="w-40"
              aria-label={t("month")}
              options={monthOptions}
              value={state.month ? String(state.month) : ""}
              onValueChange={(value) => state.setMonth(value ? Number(value) : null)}
            />
          </div>
        }
      />
      {state.query.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : state.query.isError || !data ? (
        <ErrorState onRetry={() => state.query.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">{t("total")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MoneyText value={data.totals.total} className="text-2xl font-semibold" />
                <p className="text-muted-foreground text-xs">
                  {t("count", { count: data.totals.count })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">{t("withheld")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MoneyText value={data.totals.withheld} className="text-2xl font-semibold" />
                <p className="text-muted-foreground text-xs">
                  {t("tax")}: <MoneyText value={data.totals.tax} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">{t("notWithheld")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MoneyText value={data.totals.notWithheld} className="text-2xl font-semibold" />
                <p className="text-muted-foreground text-xs">
                  {t("unclassified")}: <MoneyText value={data.totals.unclassified} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">{t("needsReview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={
                    data.totals.needsReview
                      ? "text-warning text-2xl font-semibold"
                      : "text-2xl font-semibold"
                  }
                >
                  {data.totals.needsReview}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("byPlatform")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("platform")}</TableHead>
                    <TableHead>{t("rate")}</TableHead>
                    <TableHead className="text-end">{t("countShort")}</TableHead>
                    <TableHead className="text-end">{t("total")}</TableHead>
                    <TableHead className="text-end">{t("tax")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byPlatform.map((row) => (
                    <TableRow key={`${row.platformId}-${row.taxRate}-${row.taxWithheld}`}>
                      <TableCell>{row.platform || t("unclassified")}</TableCell>
                      <TableCell>
                        {row.taxWithheld ? `${Number(row.taxRate)}%` : t("noWithholding")}
                      </TableCell>
                      <TableCell className="text-end">{row.count}</TableCell>
                      <TableCell className="text-end">
                        <MoneyText value={row.total} />
                      </TableCell>
                      <TableCell className="text-end">
                        <MoneyText value={row.tax} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.byMonth.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("byMonth")}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("month")}</TableHead>
                        <TableHead className="text-end">{t("total")}</TableHead>
                        <TableHead className="text-end">{t("withheld")}</TableHead>
                        <TableHead className="text-end">{t("tax")}</TableHead>
                        <TableHead className="text-end">{t("notWithheld")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byMonth.map((row) => (
                        <TableRow
                          key={row.month}
                          className="cursor-pointer"
                          onClick={() => state.setMonth(row.month)}
                        >
                          <TableCell>{row.month}</TableCell>
                          <TableCell className="text-end">
                            <MoneyText value={row.total} />
                          </TableCell>
                          <TableCell className="text-end">
                            <MoneyText value={row.withheld} />
                          </TableCell>
                          <TableCell className="text-end">
                            <MoneyText value={row.tax} />
                          </TableCell>
                          <TableCell className="text-end">
                            <MoneyText value={row.notWithheld} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("byCurrency")}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("currency")}</TableHead>
                      <TableHead className="text-end">{t("countShort")}</TableHead>
                      <TableHead className="text-end">{t("original")}</TableHead>
                      <TableHead className="text-end">{t("total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byCurrency.map((row) => (
                      <TableRow key={row.currency}>
                        <TableCell>{row.currency}</TableCell>
                        <TableCell className="text-end">{row.count}</TableCell>
                        <TableCell className="text-end">
                          <MoneyText
                            value={row.original}
                            currency={row.currency}
                            decimals={row.decimalPlaces}
                          />
                        </TableCell>
                        <TableCell className="text-end">
                          <MoneyText value={row.total} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          {canReadIncomes ? (
            <IncomeTable
              tableId="finance-report-incomes"
              canUpdate={canUpdate}
              canDelete={false}
              scope={{
                year: state.year,
                month: state.month ?? undefined,
                owner: state.ownerQuery ?? undefined,
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
