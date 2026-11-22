import type { ReportMonth, ReportMonthly } from "../types/finance-report.types";

/** Một điểm biểu đồ theo tháng (VNĐ là số). */
export type MonthPoint = {
  month: number;
  label: string;
  total: number;
  withheld: number;
  notWithheld: number;
  tax: number;
  count: number;
  previousTotal: number;
  previousWithheld: number;
  previousNotWithheld: number;
  cumulativeTotal: number;
  cumulativeWithheld: number;
  cumulativeNotWithheld: number;
  average: number;
  growth: number | null;
};

const PERCENT = 100;

function value(
  row: ReportMonth | undefined,
  key: "total" | "withheld" | "notWithheld" | "tax",
): number {
  return row ? Number(row[key]) : 0;
}

/**
 * Dựng chuỗi 12 tháng cho dashboard: năm chọn + năm trước, lũy kế, trung bình mỗi giao dịch, % tăng/giảm so
 * với tháng trước (null khi tháng trước bằng 0).
 *
 * @param data - Dữ liệu `/finance/reports/monthly`.
 * @param monthLabel - Nhãn tháng.
 * @returns 12 điểm.
 */
export function buildMonthSeries(
  data: ReportMonthly,
  monthLabel: (month: number) => string,
): MonthPoint[] {
  let total = 0;
  let withheld = 0;
  let notWithheld = 0;
  return data.months.map((row, index) => {
    const previousYear = data.previousMonths.find((item) => item.month === row.month);
    total += value(row, "total");
    withheld += value(row, "withheld");
    notWithheld += value(row, "notWithheld");
    const before = index > 0 ? value(data.months[index - 1], "total") : 0;
    return {
      month: row.month,
      label: monthLabel(row.month),
      total: value(row, "total"),
      withheld: value(row, "withheld"),
      notWithheld: value(row, "notWithheld"),
      tax: value(row, "tax"),
      count: row.count,
      previousTotal: value(previousYear, "total"),
      previousWithheld: value(previousYear, "withheld"),
      previousNotWithheld: value(previousYear, "notWithheld"),
      cumulativeTotal: total,
      cumulativeWithheld: withheld,
      cumulativeNotWithheld: notWithheld,
      average: row.count ? Math.round(value(row, "total") / row.count) : 0,
      growth:
        index > 0 && before
          ? Math.round(((value(row, "total") - before) / before) * PERCENT)
          : null,
    };
  });
}

/**
 * Thu nhập theo nền tảng từng tháng → dạng cột cho biểu đồ vùng chồng.
 *
 * @param data - Dữ liệu tháng.
 * @param unclassified - Nhãn cho khoản chưa nhận diện.
 * @returns Danh sách nền tảng và 12 dòng `{ month, [nền tảng]: VNĐ }`.
 */
export function buildPlatformSeries(data: ReportMonthly, unclassified: string) {
  const platforms = Array.from(new Set(data.byPlatform.map((row) => row.platform || unclassified)));
  const rows = data.months.map((month) => {
    const row: Record<string, number> = { month: month.month };
    for (const platform of platforms) row[platform] = 0;
    for (const item of data.byPlatform.filter((entry) => entry.month === month.month)) {
      row[item.platform || unclassified] += Number(item.total);
    }
    return row;
  });
  return { platforms, rows };
}

/** @returns % thay đổi so với năm trước (null khi năm trước bằng 0). */
export function changePercent(current: number, previous: number): number | null {
  return previous ? Math.round(((current - previous) / previous) * PERCENT) : null;
}
