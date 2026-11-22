/** Webhook một module khai báo (BE `ModuleDescriptor.webhooks`). */
export type SystemWebhook = {
  code: string;
  module: string;
  name: string;
  provider: string;
  method: string;
  path: string;
  /** URL đầy đủ theo domain backend đang chạy (đổi site vẫn đúng). */
  url: string;
  description: string;
  auth: string;
  setup: string[];
};
