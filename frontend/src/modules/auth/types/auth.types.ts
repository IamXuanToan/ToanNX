import type { User } from "@/modules/account/types/account.types";
import type { RoleSummary } from "@/modules/iam/types/iam.types";
import type { ModuleInfo } from "@/modules/system/types/system.types";

/** Dữ liệu `/auth/me`: người dùng, vai trò, quyền hiệu lực và module đang bật. */
export type CurrentUser = {
  user: User;
  roles: RoleSummary[];
  permissions: string[];
  modules: ModuleInfo[];
};

/** Thông tin đăng nhập. */
export type LoginCredentials = {
  email: string;
  password: string;
};
