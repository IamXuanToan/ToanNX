"use client";

import { useMemo, useState } from "react";

import { normalizeSearchText } from "@/shares/lib/search-text";

import type { AffiliateCategory, AffiliateItem, PublicPage } from "../../../types/page.types";

/**
 * Hook quản lý trạng thái tìm kiếm tức thì và lọc danh mục cho trang Affiliate công khai.
 *
 * @param page - Dữ liệu trang công khai.
 * @returns Trạng thái lọc, danh mục, và danh sách sản phẩm sau lọc.
 */
export function useAffiliatePageRenderer(page: PublicPage) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const config = page.contentConfig as unknown as Record<string, unknown> | undefined;

  const categories: AffiliateCategory[] = useMemo(() => {
    const rawCategories = (config?.categories ?? []) as Array<Record<string, unknown>>;
    return rawCategories.map((c) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? ""),
      slug: String(c.slug ?? ""),
      sortOrder: Number(c.sortOrder ?? c.sort_order ?? 0),
      isVisible: c.isVisible !== false && c.is_visible !== false,
    }));
  }, [config?.categories]);

  const items: AffiliateItem[] = useMemo(() => {
    const rawItems = (config?.items ?? []) as Array<Record<string, unknown>>;
    return rawItems
      .filter((item) => item.isVisible !== false && item.is_visible !== false)
      .map((item) => ({
        id: String(item.id ?? ""),
        displayMode: (item.displayMode ?? item.display_mode ?? "product") as "product" | "link",
        title: String(item.title ?? ""),
        platform: (item.platform ?? "custom") as AffiliateItem["platform"],
        destinationUrl: String(item.destinationUrl ?? item.destination_url ?? ""),
        imageUrl: item.imageUrl
          ? String(item.imageUrl)
          : item.image_url
            ? String(item.image_url)
            : undefined,
        categoryId: String(item.categoryId ?? item.category_id ?? "default"),
        sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
        isFeatured: Boolean(item.isFeatured ?? item.is_featured),
        isVisible: true,
        originalPrice:
          item.originalPrice !== undefined
            ? Number(item.originalPrice)
            : item.original_price !== undefined
              ? Number(item.original_price)
              : undefined,
        salePrice:
          item.salePrice !== undefined
            ? Number(item.salePrice)
            : item.sale_price !== undefined
              ? Number(item.sale_price)
              : undefined,
        discountBadge: item.discountBadge
          ? String(item.discountBadge)
          : item.discount_badge
            ? String(item.discount_badge)
            : undefined,
        priceConfig: (item.priceConfig ??
          item.price_config ?? { mode: "fixed", amount: 0 }) as AffiliateItem["priceConfig"],
        buttonConfig: (item.buttonConfig ??
          item.button_config ??
          {}) as AffiliateItem["buttonConfig"],
        badge: item.badge as AffiliateItem["badge"],
        description: item.description ? String(item.description) : undefined,
      }));
  }, [config?.items]);

  const filteredItems = useMemo(() => {
    const query = normalizeSearchText(searchQuery.trim());
    return items.filter((item) => {
      const matchCat = selectedCategory === "all" || item.categoryId === selectedCategory;
      if (!matchCat) return false;
      if (!query) return true;
      const targetText = `${item.title} ${item.description ?? ""} ${item.platform}`;
      return normalizeSearchText(targetText).includes(query);
    });
  }, [items, selectedCategory, searchQuery]);

  return {
    categories,
    items,
    filteredItems,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
  };
}
