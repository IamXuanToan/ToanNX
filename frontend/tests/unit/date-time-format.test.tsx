// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";

import { TimestampText } from "@/shares/components/common/timestamp-text";
import {
  formatDateTimeWithRelative,
  formatExplicitDate,
  formatExplicitDateTime,
} from "@/shares/lib/date-time-format";

afterEach(() => {
  cleanup();
});

describe("date-time-format và TimestampText", () => {
  it("định dạng ngày thuần theo mẫu dd/MM/yyyy và trả fallback khi rỗng", () => {
    expect(formatExplicitDate("2026-11-27")).toBe("27/11/2026");
    expect(formatExplicitDate(new Date("2026-11-27T13:24:05+07:00"))).toBe("27/11/2026");
    expect(formatExplicitDate(null)).toBe("—");
    expect(formatExplicitDate("invalid-date", "Trống")).toBe("Trống");
  });

  it("định dạng ngày giờ đầy đủ theo mẫu dd/MM/yyyy HH:mm:ss kèm thời gian đếm trong ngoặc", () => {
    const sample = new Date("2026-11-27T06:24:05Z");
    const now = new Date("2026-11-27T06:24:11Z");

    expect(formatExplicitDateTime(sample)).toBe("27/11/2026 13:24:05");
    expect(
      formatDateTimeWithRelative(sample, {
        now,
        locale: "vi",
      }),
    ).toBe("27/11/2026 13:24:05 (6 giây trước)");

    expect(
      formatDateTimeWithRelative(sample, {
        customStatusLabel: "Đang trực tuyến",
      }),
    ).toBe("27/11/2026 13:24:05 (Đang trực tuyến)");

    expect(formatDateTimeWithRelative(undefined)).toBe("—");
  });

  it("TimestampText render thẻ time theo mẫu dd/MM/yyyy HH:mm:ss (thời gian đếm)", () => {
    const sample = new Date("2026-11-27T06:24:05Z");
    const fixedNow = new Date("2026-11-27T06:24:11Z");

    render(
      <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" now={fixedNow} messages={{}}>
        <TimestampText value={sample} />
      </NextIntlClientProvider>,
    );

    const el = screen.getByText(/27\/11\/2026 13:24:05/).closest("time");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("27/11/2026 13:24:05 (6 giây trước)");
  });
});
