/** Query key React Query của module Account. */
export const accountKeys = {
  all: ["account"] as const,
  users: (filters: object) => [...accountKeys.all, "users", filters] as const,
  user: (id: string) => [...accountKeys.all, "user", id] as const,
};
