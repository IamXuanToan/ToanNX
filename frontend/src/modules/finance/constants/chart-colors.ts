/** Màu biểu đồ theo token `--chart-1..5` (shadcn chart), lặp lại khi nhiều nền tảng. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** @param index - Thứ tự. @returns Màu token. */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
