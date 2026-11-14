/** Module đã cài kèm cấu hình runtime. */
export type ModuleInfo = {
  code: string;
  name: string;
  description: string;
  version: string;
  /** Nhóm module, ví dụ `system`. */
  group: string;
  isCore: boolean;
  installed: boolean;
  enabled: boolean;
  /** Tên icon lucide-react kebab-case hiệu lực, ví dụ `shield-check`. */
  icon: string;
  /** URL tuyệt đối của icon SVG tự upload (ưu tiên hơn `icon`), hoặc null. */
  iconUrl: string | null;
  dependencies: string[];
  permissions: string[];
};

/** Dữ liệu cập nhật module (gửi ít nhất một field). */
export type ModuleUpdateInput = {
  enabled?: boolean;
  /** Tên icon lucide; chuỗi rỗng = icon mặc định của module. */
  icon?: string;
  /** Id attachment SVG; null = gỡ icon SVG. */
  iconId?: string | null;
};
