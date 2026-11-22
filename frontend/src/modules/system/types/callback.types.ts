/** URL callback một module khai báo (BE `ModuleDescriptor.callbacks`). */
export type SystemCallback = {
  code: string;
  module: string;
  name: string;
  provider: string;
  path: string;
  /** URL đầy đủ theo origin FE đang dùng (đổi site vẫn đúng). */
  url: string;
  description: string;
  setup: string[];
  configured: boolean;
};
