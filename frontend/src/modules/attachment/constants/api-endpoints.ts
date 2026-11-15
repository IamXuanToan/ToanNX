/**
 * Endpoint Attachment của backend (tương đối với `env.apiBasePath`).
 * Tài nguyên CRUD chỉ khai path gốc; `{id}`, `bulk-*`, `history` dựng theo router BE.
 */
export const ATTACHMENT_API_ENDPOINTS = {
  files: "/attachments",
  folders: "/attachments/folders",
  folder: (id: string) => `/attachments/folders/${id}`,
  folderDelete: (id: string) => `/attachments/folders/${id}/delete`,
} as const;
