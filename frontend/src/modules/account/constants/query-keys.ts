import { createResourceKeys } from "@/shares/lib/api/resource-keys";

const users = createResourceKeys("account", "users");

/** Query key React Query của module Account. */
export const accountKeys = {
  all: ["account"] as const,
  users: (filters: object) => users.list(filters),
  user: (id: string) => users.detail(id),
  userHistory: (id: string) => users.history(id),
};
