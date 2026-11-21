/**
 * Đường dẫn các tài nguyên tĩnh SVG/hình ảnh dùng chung trong hệ thống (rule frontend §3.2).
 * Đặt file trong `public/`, nơi dùng gọi qua `<Image src={ICON_PATHS.xxx} />`.
 */
export const ICON_PATHS = {
  google: "/icons/google.svg",
  github: "/icons/github.svg",
} as const;
