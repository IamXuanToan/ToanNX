/** Route của module Journal. */
export const JOURNAL_ROUTES = {
  entries: "/admin/journal",
} as const;

/** Pathname theo ngôn ngữ của module Journal (gộp vào `routing.pathnames`). */
export const JOURNAL_PATHNAMES = {
  "/admin/journal": { vi: "/quan-tri/nhat-ky", en: "/admin/journal" },
} as const;
