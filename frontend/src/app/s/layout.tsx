import "../globals.css";

import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";

import { loadMessages } from "@/i18n/messages";
import { LOCALE_COOKIE, resolveRequestLocale } from "@/i18n/request-locale";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { AppProviders } from "@/shares/components/providers/app-providers";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans", display: "swap" });

/**
 * Khung trung gian công khai cho URL ngắn:
 * Không header hay footer website, bố cục không gian đa tầng với ánh sáng ambient,
 * sử dụng thuần semantic tokens (primary, canvas, card, border), chuẩn shadcn UI và Tailwind CSS.
 */
export default async function ShortLinkLayout({ children }: LayoutProps<"/s">) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const locale = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language"),
  );
  const messages = await loadMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <body className="bg-canvas text-foreground selection:bg-primary/20 relative h-svh min-h-svh overflow-hidden font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
          <AppProviders>
            {/* Không gian ánh sáng ambient dùng chuẩn token primary */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            >
              {/* Lưới grid pattern tinh tế */}
              <div className="text-foreground/[0.03] dark:text-foreground/[0.04] absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:32px_32px]" />

              {/* Vùng hào quang chính: Gradient màu primary của hệ thống */}
              <div className="from-primary/20 via-primary/5 dark:from-primary/25 absolute top-1/4 left-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b to-transparent blur-[120px] sm:size-[560px]" />

              {/* Vùng hào quang phụ: Ánh sáng primary nhẹ ở góc */}
              <div className="from-primary/10 via-primary/5 dark:from-primary/15 absolute right-1/4 bottom-1/4 size-[260px] rounded-full bg-gradient-to-tr to-transparent blur-[100px] sm:size-[420px]" />

              {/* Vệt sáng quét ngang đỉnh màn hình bằng token primary */}
              <div className="via-primary/30 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            </div>

            {/* Thanh điều khiển nổi tinh giản cố định góc trên bên phải, không chiếm chiều cao layout */}
            <header className="fixed top-3 right-3 z-30 sm:top-5 sm:right-6">
              <div className="border-border/60 bg-card/80 hover:border-border flex items-center gap-1 rounded-full border p-1 shadow-md shadow-black/[0.02] backdrop-blur-xl transition-all dark:shadow-none">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </header>

            {/* Nội dung trung tâm: Căn giữa gọn gàng trong 100vh */}
            <main className="relative flex h-svh min-h-svh w-full items-center justify-center overflow-y-auto p-3 sm:p-5">
              {children}
            </main>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
