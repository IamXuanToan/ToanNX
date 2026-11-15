/** Endpoint API của module Short Links (tương đối với `env.apiBasePath`). */
export const SHORT_LINKS_API_ENDPOINTS = {
  links: "/short_links/links",
  resolve: (slug: string) => `/short_links/resolve/${encodeURIComponent(slug)}`,
} as const;
