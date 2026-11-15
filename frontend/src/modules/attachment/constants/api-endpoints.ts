/** Endpoint Attachment sẵn có của backend. */
export const ATTACHMENT_API_ENDPOINTS = {
  bulkDelete: "/attachments/bulk-delete",
  bulkUpdate: "/attachments/bulk-update",
  folders: "/attachments/folders",
  folder: (id: string) => `/attachments/folders/${id}`,
  folderDelete: (id: string) => `/attachments/folders/${id}/delete`,
  files: "/attachments",
  file: (id: string) => "/attachments/" + id,
} as const;
