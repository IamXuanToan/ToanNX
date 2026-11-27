import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CHART_COLORS,
  chartColor,
  contrastRatio,
  hexLuminance,
  platformChartConfigItem,
  resolveLightDarkChartColor,
} from "@/modules/finance/constants/chart-colors";

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

  it("resolveLightDarkChartColor giữ độ tương phản chuẩn cho mọi mã HEX ở cả Light và Dark", () => {
    for (const hex of ["#000000", "#FEF08A", "#2563EB", "#DC2626", "#DB2777"]) {
      const pair = resolveLightDarkChartColor(hex);
      expect(contrastRatio(hexLuminance(pair.light), 1.0)).toBeGreaterThanOrEqual(3.4);
      expect(contrastRatio(hexLuminance(pair.dark), 0.008)).toBeGreaterThanOrEqual(4.7);
    }
  });

  it("platformChartConfigItem dùng theme light/dark nếu có HEX và fallback chartColor khi rỗng", () => {
    const custom = platformChartConfigItem("Donate", "#DB2777", 0);
    expect(custom).toEqual({
      label: "Donate",
      theme: resolveLightDarkChartColor("#DB2777"),
    });

    const fallback = platformChartConfigItem("Khác", "", 2);
    expect(fallback).toEqual({ label: "Khác", color: chartColor(2) });
  });
});
