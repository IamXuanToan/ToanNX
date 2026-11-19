/**
 * Cấu hình route nội bộ và URL quốc tế hóa của module Novel (Truyện chữ).
 */

/** Danh mục các đường dẫn nội bộ của module Novel. */
export const NOVEL_ROUTES = {
  /** Trang danh mục tiểu thuyết công khai (`/novels`) */
  catalog: "/novels",
  /** Trang lịch sử đọc truyện (`/novels/history`) */
  history: "/novels/history",
  /** Trang danh sách tiểu thuyết yêu thích (`/novels/favorites`) */
  favorites: "/novels/favorites",
  /**
   * Đường dẫn chi tiết tiểu thuyết
   * @param slug - Slug của tiểu thuyết
   */
  detail: (slug: string) => ({ pathname: "/novels/[slug]" as const, params: { slug } }),
  /**
   * Đường dẫn đọc nội dung một chương
   * @param slug - Slug của tiểu thuyết
   * @param chapterNumber - Số thứ tự chương
   */
  chapter: (slug: string, chapterNumber: number | string) => ({
    pathname: "/novels/[slug]/[chapterNumber]" as const,
    params: { slug, chapterNumber: String(chapterNumber) },
  }),
  /** Trang quản trị danh sách tiểu thuyết (`/admin/novels`) */
  adminNovels: "/admin/novels",
} as const;

/**
 * Khai báo ánh xạ URL theo ngôn ngữ của module Novel (gộp vào `routing.pathnames`).
 */
export const NOVEL_PATHNAMES = {
  "/novels": { vi: "/truyen", en: "/novels" },
  "/novels/history": { vi: "/truyen/lich-su", en: "/novels/history" },
  "/novels/favorites": { vi: "/truyen/yeu-thich", en: "/novels/favorites" },
  "/novels/[slug]": { vi: "/truyen/[slug]", en: "/novels/[slug]" },
  "/novels/[slug]/[chapterNumber]": {
    vi: "/truyen/[slug]/[chapterNumber]",
    en: "/novels/[slug]/[chapterNumber]",
  },
  "/admin/novels": { vi: "/quan-tri/truyen", en: "/admin/novels" },
} as const;
