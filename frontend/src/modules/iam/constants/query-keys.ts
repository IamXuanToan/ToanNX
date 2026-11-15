/** Query key React Query của module IAM. */
export const iamKeys = {
  all: ["iam"] as const,
  userRoles: (userId: string) => [...iamKeys.all, "user-roles", userId] as const,
  roles: (filters: object) => [...iamKeys.all, "roles", filters] as const,
  roleOptions: () => [...iamKeys.all, "role-options"] as const,
  role: (id: string) => [...iamKeys.all, "role", id] as const,
  permissions: () => [...iamKeys.all, "permissions"] as const,
};
