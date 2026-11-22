import { Users } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  ADMIN_MODULE_NAVIGATION,
  groupNavSections,
} from "@/modules/manage-app/constants/admin-navigation";
import type { AdminNavItem } from "@/shares/types/navigation.types";

/** Module nhiều mục hơn mốc này phải chia cụm cho mọi mục (rule frontend §1). */
const MAX_ITEMS_WITHOUT_SECTIONS = 5;

const item = (href: string, section?: `${string}.${string}`): AdminNavItem => ({
  labelKey: "common.nav.users",
  href: href as AdminNavItem["href"],
  icon: Users,
  section,
});

describe("groupNavSections", () => {
  it("gom mục liền nhau cùng cụm, giữ thứ tự", () => {
    const sections = groupNavSections([
      item("/admin/a", "x.a"),
      item("/admin/b", "x.a"),
      item("/admin/c", "x.b"),
    ]);
    expect(sections.map((section) => [section.labelKey, section.items.length])).toEqual([
      ["x.a", 2],
      ["x.b", 1],
    ]);
  });

  it("mục không khai cụm thành một cụm không nhãn", () => {
    expect(groupNavSections([item("/admin/a"), item("/admin/b")])).toHaveLength(1);
  });
});

describe("ADMIN_MODULE_NAVIGATION", () => {
  it.each(ADMIN_MODULE_NAVIGATION.map((navigation) => [navigation.module, navigation]))(
    "%s: nhiều mục thì mọi mục có cụm, mục cùng cụm liền nhau",
    (_, navigation) => {
      if (navigation.items.length > MAX_ITEMS_WITHOUT_SECTIONS) {
        expect(navigation.items.every((navItem) => navItem.section)).toBe(true);
      }
      const labels = groupNavSections(navigation.items).map((section) => section.labelKey);
      expect(new Set(labels).size).toBe(labels.length);
    },
  );
});
