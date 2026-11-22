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

  // ================= Quản trị Tiểu thuyết =================
  /** Trang quản trị danh sách tiểu thuyết (`/admin/novels`) */
  adminNovels: "/admin/novels",
  /** Trang tạo tiểu thuyết mới (`/admin/novels/new`) */
  adminNovelCreate: "/admin/novels/new",
  /**
   * Trang chỉnh sửa tiểu thuyết
   * @param id - UUID tiểu thuyết
   */
  adminNovelDetail: (id: string) => ({ pathname: "/admin/novels/[id]" as const, params: { id } }),

  // ================= Quản trị Tác giả =================
  /** Trang quản trị danh sách tác giả (`/admin/authors`) */
  adminAuthors: "/admin/authors",
  /** Trang tạo tác giả mới (`/admin/authors/new`) */
  adminAuthorCreate: "/admin/authors/new",
  /**
   * Trang chi tiết/chỉnh sửa tác giả
   * @param id - UUID tác giả
   */
  adminAuthorDetail: (id: string) => ({ pathname: "/admin/authors/[id]" as const, params: { id } }),

  // ================= Quản trị Thể loại =================
  /** Trang quản trị danh sách thể loại (`/admin/genres`) */
  adminGenres: "/admin/genres",
  /** Trang tạo thể loại mới (`/admin/genres/new`) */
  adminGenreCreate: "/admin/genres/new",
  /**
   * Trang chi tiết/chỉnh sửa thể loại
   * @param id - UUID thể loại
   */
  adminGenreDetail: (id: string) => ({ pathname: "/admin/genres/[id]" as const, params: { id } }),

  // ================= Quản trị Thẻ =================
  /** Trang quản trị danh sách thẻ (`/admin/tags`) */
  adminTags: "/admin/tags",
  /** Trang tạo thẻ mới (`/admin/tags/new`) */
  adminTagCreate: "/admin/tags/new",
  /**
   * Trang chi tiết/chỉnh sửa thẻ
   * @param id - UUID thẻ
   */
  adminTagDetail: (id: string) => ({ pathname: "/admin/tags/[id]" as const, params: { id } }),

  // ================= Quản trị Chương truyện =================
  /** Trang quản trị danh sách chương truyện (`/admin/chapters`) */
  adminChapters: "/admin/chapters",
  /** Trang tạo chương truyện mới (`/admin/chapters/new`) */
  adminChapterCreate: "/admin/chapters/new",
  /**
   * Trang chi tiết/chỉnh sửa chương truyện
   * @param id - UUID chương
   */
  adminChapterDetail: (id: string) => ({
    pathname: "/admin/chapters/[id]" as const,
    params: { id },
  }),
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

  // Quản trị
  "/admin/novels": { vi: "/quan-tri/truyen/tac-pham", en: "/admin/novel/novels" },
  "/admin/novels/new": { vi: "/quan-tri/truyen/tac-pham/them-moi", en: "/admin/novel/novels/new" },
  "/admin/novels/[id]": { vi: "/quan-tri/truyen/tac-pham/[id]", en: "/admin/novel/novels/[id]" },

  "/admin/authors": { vi: "/quan-tri/truyen/tac-gia", en: "/admin/novel/authors" },
  "/admin/authors/new": { vi: "/quan-tri/truyen/tac-gia/them-moi", en: "/admin/novel/authors/new" },
  "/admin/authors/[id]": { vi: "/quan-tri/truyen/tac-gia/[id]", en: "/admin/novel/authors/[id]" },

  "/admin/genres": { vi: "/quan-tri/truyen/the-loai", en: "/admin/novel/genres" },
  "/admin/genres/new": { vi: "/quan-tri/truyen/the-loai/them-moi", en: "/admin/novel/genres/new" },
  "/admin/genres/[id]": { vi: "/quan-tri/truyen/the-loai/[id]", en: "/admin/novel/genres/[id]" },

  "/admin/tags": { vi: "/quan-tri/truyen/the", en: "/admin/novel/tags" },
  "/admin/tags/new": { vi: "/quan-tri/truyen/the/them-moi", en: "/admin/novel/tags/new" },
  "/admin/tags/[id]": { vi: "/quan-tri/truyen/the/[id]", en: "/admin/novel/tags/[id]" },

  "/admin/chapters": { vi: "/quan-tri/truyen/chuong-truyen", en: "/admin/novel/chapters" },
  "/admin/chapters/new": {
    vi: "/quan-tri/truyen/chuong-truyen/them-moi",
    en: "/admin/novel/chapters/new",
  },
  "/admin/chapters/[id]": {
    vi: "/quan-tri/truyen/chuong-truyen/[id]",
    en: "/admin/novel/chapters/[id]",
  },
} as const;
