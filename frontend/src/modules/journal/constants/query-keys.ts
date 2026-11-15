import { createResourceKeys } from "@/shares/lib/api/resource-keys";

const entries = createResourceKeys("journal", "entries");

/** Query key React Query của module Journal. */
export const journalKeys = {
  all: ["journal"] as const,
  entries: (filters: object) => entries.list(filters),
  entry: (id: string) => entries.detail(id),
  resources: () => ["journal", "resources"] as const,
  /** Lịch sử của một bản ghi theo path `…/{id}/history` của tài nguyên đó. */
  record: (path: string) => ["journal", "record", path] as const,
};
