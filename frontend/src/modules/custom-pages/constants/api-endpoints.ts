/** Endpoint API của module Custom Pages (tương đối với `env.apiBasePath`). */
export const CUSTOM_PAGES_API_ENDPOINTS = {
  paths: "/custom_pages/paths",
  pages: "/custom_pages/pages",
  public: (segment: string, slug: string) =>
    `/custom_pages/public/${encodeURIComponent(segment)}/${encodeURIComponent(slug)}`,
} as const;
