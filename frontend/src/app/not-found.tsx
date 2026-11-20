import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import "./globals.css";

import { DEFAULT_LOCALE } from "@/i18n/routing";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

/**
 * Trang 404 cấp gốc (khi URL không có locale hợp lệ).
 *
 * @returns Giao diện 404 chuẩn hóa theo Shadcn UI có liên kết về trang chủ mặc định.
 */
export default function RootNotFound() {
  return (
    <html lang={DEFAULT_LOCALE}>
      <title>Không tìm thấy trang · Page not found · TOANNX</title>
      <body className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center p-4 text-center antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <Badge variant="outline" className="mb-2 rounded-full px-3 py-1 font-mono text-xs">
            404 · NOT FOUND
          </Badge>

          <p className="text-muted-foreground/20 text-8xl font-black tracking-tighter select-none sm:text-9xl">
            404
          </p>

          <div className="bg-muted/70 border-border/60 -mt-10 mb-4 flex size-16 items-center justify-center rounded-3xl border shadow-xs backdrop-blur-xs">
            <FileQuestion className="text-muted-foreground size-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Không tìm thấy trang · Page not found
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
            Đường dẫn không tồn tại hoặc đã bị xóa.
            <br />
            The requested URL was not found on this server.
          </p>

          <Button asChild className="mt-6 h-10 rounded-xl px-5 font-medium shadow-xs">
            <Link href={`/${DEFAULT_LOCALE}`}>
              <Home className="size-4" />
              Về trang chủ · Back to home
            </Link>
          </Button>
        </div>
      </body>
    </html>
  );
}
