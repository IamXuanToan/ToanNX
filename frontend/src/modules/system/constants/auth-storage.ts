/** Khóa lưu trữ sessionStorage và chế độ dùng trong luồng OAuth/đăng nhập. */
export const OAUTH_STORAGE_KEYS = {
  state: "oauth_state",
  mode: "oauth_mode",
  next: "oauth_next",
} as const;

export const OAUTH_MODE = {
  login: "login",
  link: "link",
} as const;

/** Tham số query URL điều khiển mở và chuyển tab bên trong modal Hồ sơ cá nhân (tách riêng khỏi `tab` của trang chính). */
export const PROFILE_DIALOG_QUERY = {
  openParam: "profile",
  openValue: "open",
  tabParam: "profileTab",
  socialTab: "social",
} as const;

/** Đường dẫn điều hướng nội bộ tối thiểu để `system` phân biệt không gian làm việc mà không import module phụ thuộc. */
export const AUTH_WORKSPACE_PATHS = {
  home: "/",
  admin: "/admin",
  adminViPrefix: "/quan-tri",
  portal: "/portal",
  portalViPrefix: "/ca-nhan",
} as const;
