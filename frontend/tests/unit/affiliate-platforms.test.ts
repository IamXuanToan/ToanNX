import { describe, expect, it } from "vitest";

import {
  DEFAULT_AFFILIATE_PLATFORMS,
  getAffiliatePlatformName,
  isValidPlatformRegex,
  matchAffiliatePlatformByUrl,
  resolvePageAffiliatePlatforms,
} from "@/modules/utilities/constants/affiliate-platforms";
import type { AffiliatePlatformConfig } from "@/modules/utilities/types/page.types";

describe("affiliate-platforms (Nơi bán riêng của từng trang + Regex URL)", () => {
  it("tự động nhận diện link Shopee rút gọn/đầy đủ và nơi bán custom riêng theo Regex", () => {
    const customPagePlatforms: AffiliatePlatformConfig[] = [
      ...DEFAULT_AFFILIATE_PLATFORMS,
      {
        id: "plat-myshop",
        code: "my_shop",
        name: "Cửa hàng riêng",
        urlPattern: "(myshop\\.vn|shop\\.custom\\.io)",
        sortOrder: 5,
        isVisible: true,
      },
    ];

    expect(matchAffiliatePlatformByUrl("https://s.shopee.vn/2Vte3c9icI", customPagePlatforms)).toBe(
      "shopee",
    );
    expect(
      matchAffiliatePlatformByUrl("https://myshop.vn/san-pham/ban-phim-1", customPagePlatforms),
    ).toBe("my_shop");
    expect(matchAffiliatePlatformByUrl("https://example.org/unknown", customPagePlatforms)).toBe(
      "custom",
    );
  });

  it("mỗi trang giữ danh sách nơi bán độc lập, trang cũ fallback mặc định và kiểm tra regex an toàn", () => {
    const customOnly: AffiliatePlatformConfig[] = [
      {
        id: "p1",
        code: "local_store",
        name: "Local Store",
        urlPattern: "localstore\\.vn",
        sortOrder: 0,
        isVisible: true,
      },
    ];

    expect(resolvePageAffiliatePlatforms(undefined)).toEqual(DEFAULT_AFFILIATE_PLATFORMS);
    expect(resolvePageAffiliatePlatforms({ platforms: customOnly })).toEqual(customOnly);
    expect(getAffiliatePlatformName("local_store", customOnly, "Khác")).toBe("Local Store");
    expect(isValidPlatformRegex("(shopee\\.vn|shp\\.ee)")).toBe(true);
    expect(isValidPlatformRegex("[invalid(")).toBe(false);
  });
});
