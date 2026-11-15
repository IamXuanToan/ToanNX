import type { User } from "@/modules/account/types/account.types";
import type { RoleSummary } from "@/modules/iam/types/iam.types";

/** Dữ liệu `/auth/me`: người dùng, vai trò và quyền hiệu lực. */
export type CurrentUser = {
  user: User;
  roles: RoleSummary[];
  permissions: string[];
};

/** Thông tin đăng nhập. */
export type LoginCredentials = {
  /** Email hoặc tên người dùng. */
  identifier: string;
  password: string;
};
