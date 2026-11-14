/** Query key tập trung cho React Query. Không hardcode key rải rác. */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const accountKeys = {
  all: ["account"] as const,
  users: (filters: object) => [...accountKeys.all, "users", filters] as const,
  user: (id: string) => [...accountKeys.all, "user", id] as const,
};

export const iamKeys = {
  all: ["iam"] as const,
  userRoles: (userId: string) => [...iamKeys.all, "user-roles", userId] as const,
  roles: (filters: object) => [...iamKeys.all, "roles", filters] as const,
  role: (id: string) => [...iamKeys.all, "role", id] as const,
  permissions: () => [...iamKeys.all, "permissions"] as const,
};

export const systemKeys = {
  all: ["system"] as const,
  modules: () => [...systemKeys.all, "modules"] as const,
};
