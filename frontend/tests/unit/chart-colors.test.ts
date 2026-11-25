import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CHART_COLORS, chartColor } from "@/modules/finance/constants/chart-colors";

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

describe("Bảng màu biểu đồ đa sắc", () => {
  it("CHART_COLORS có đủ 8 token riêng biệt và không lặp lại trong 8 mục đầu", () => {
    expect(CHART_COLORS.length).toBe(8);
    expect(new Set(CHART_COLORS).size).toBe(8);
    const firstEight = Array.from({ length: 8 }, (_, index) => chartColor(index));
    expect(new Set(firstEight).size).toBe(8);
    expect(chartColor(8)).toBe(chartColor(0));
  });

  it("globals.css khai báo đủ --color-chart-1..8 và biến --chart-1..8 đa sắc ở cả :root và .dark", () => {
    for (let i = 1; i <= 8; i += 1) {
      expect(CSS).toContain(`--color-chart-${i}: var(--chart-${i});`);
      const matches = [
        ...CSS.matchAll(new RegExp(`--chart-${i}:\\s*oklch\\([^)]+\\s+([\\d.]+)\\)`, "g")),
      ];
      expect(matches.length, `Thiếu --chart-${i} ở :root hoặc .dark`).toBe(2);
    }

    const lightHues = Array.from({ length: 8 }, (_, idx) => {
      const m = CSS.match(
        new RegExp(`:root[\\s\\S]*?--chart-${idx + 1}:\\s*oklch\\([^)]+\\s+([\\d.]+)\\)`),
      );
      return Number(m?.[1]);
    });
    expect(new Set(lightHues).size).toBe(8);
  });
});
