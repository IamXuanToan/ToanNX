/** Route của module QR Codes. */
export const QR_CODES_ROUTES = {
  codes: "/admin/qr-codes",
  codeCreate: "/admin/qr-codes/new",
  codeDetail: (id: string) => ({ pathname: "/admin/qr-codes/[id]" as const, params: { id } }),
} as const;

/** Pathname theo ngôn ngữ của module QR Codes (gộp vào `routing.pathnames`). */
export const QR_CODES_PATHNAMES = {
  "/admin/qr-codes": { vi: "/quan-tri/ma-qr", en: "/admin/qr-codes" },
  "/admin/qr-codes/new": { vi: "/quan-tri/ma-qr/tao-moi", en: "/admin/qr-codes/new" },
  "/admin/qr-codes/[id]": { vi: "/quan-tri/ma-qr/[id]", en: "/admin/qr-codes/[id]" },
} as const;
