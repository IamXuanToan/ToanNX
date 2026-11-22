import { describe, expect, it } from "vitest";

import { watermarkShadowColor } from "@/modules/system/lib/watermark-shadow";

describe("watermarkShadowColor", () => {
  it("chữ sáng đổ bóng tối, chữ tối đổ bóng sáng", () => {
    expect(watermarkShadowColor("#FFFFFF")).toBe("rgba(0, 0, 0, 0.75)");
    expect(watermarkShadowColor("#FACC15")).toBe("rgba(0, 0, 0, 0.75)");
    expect(watermarkShadowColor("#000000")).toBe("rgba(255, 255, 255, 0.75)");
    expect(watermarkShadowColor("#1D4ED8")).toBe("rgba(255, 255, 255, 0.75)");
  });

  it("mã màu sai định dạng: coi như màu sáng (bóng tối)", () => {
    expect(watermarkShadowColor("xyz")).toBe("rgba(0, 0, 0, 0.75)");
  });
});
