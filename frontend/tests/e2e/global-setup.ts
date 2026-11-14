import { execFileSync } from "node:child_process";
import path from "node:path";

import { E2E_ADMIN } from "./helpers";

/**
 * Đảm bảo có tài khoản superuser dành riêng cho E2E (tạo bằng lệnh `createsuperuser` chính thức).
 * Bỏ qua nếu tài khoản đã tồn tại.
 */
export default function globalSetup() {
  try {
    execFileSync(
      "uv",
      ["run", "python", "manage.py", "createsuperuser", "--noinput", "--email", E2E_ADMIN.email],
      {
        cwd: path.resolve(__dirname, "../../../backend"),
        env: { ...process.env, DJANGO_SUPERUSER_PASSWORD: E2E_ADMIN.password },
        stdio: "pipe",
      },
    );
  } catch (error) {
    const output = String((error as { stderr?: Buffer }).stderr ?? "");
    if (!output.includes("already taken")) throw error;
  }
}
