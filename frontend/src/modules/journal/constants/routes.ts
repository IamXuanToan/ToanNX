/** Route của module Journal. */
export const JOURNAL_ROUTES = {
  entries: "/admin/journal",
  entryDetail: (id: string) => ({ pathname: "/admin/journal/[id]" as const, params: { id } }),
} as const;

/** Pathname theo ngôn ngữ của module Journal (gộp vào `routing.pathnames`). */
export const JOURNAL_PATHNAMES = {
  "/admin/journal": { vi: "/quan-tri/nhat-ky", en: "/admin/journal" },
  "/admin/journal/[id]": { vi: "/quan-tri/nhat-ky/[id]", en: "/admin/journal/[id]" },
} as const;
