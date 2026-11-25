import { describe, expect, it } from "vitest";

import { donationKeys } from "@/modules/utilities/constants/query-keys";
import { DonationPublicFeed } from "@/modules/utilities/components/page/donation-public-feed";

describe("donationKeys and DonationPublicFeed", () => {
  it("exports donationKeys with feed method", () => {
    expect(donationKeys).toBeDefined();
    expect(typeof donationKeys.feed).toBe("function");
    expect(donationKeys.feed("test-id")).toEqual(["utilities", "donations", "feed", "test-id"]);
  });

  it("exports DonationPublicFeed component", () => {
    expect(DonationPublicFeed).toBeDefined();
    expect(typeof DonationPublicFeed).toBe("function");
  });
});
