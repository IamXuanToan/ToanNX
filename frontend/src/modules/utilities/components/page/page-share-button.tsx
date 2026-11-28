"use client";

import { Check, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";

/**
 * Nút chia sẻ nhanh ở góc trên trang công khai: hỗ trợ Web Share API hoặc copy URL.
 *
 * @param props - Tiêu đề và URL công khai của trang.
 * @returns Nút chia sẻ nổi gọn.
 */
export function PageShareButton({ title, url }: { title: string; url: string }) {
  const t = useTranslations("utilities.customPages.pages");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        /* Người dùng hủy hoặc trình duyệt từ chối -> fallback copy */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <AppTooltip content={t("sharePage")}>
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => void handleShare()}
        aria-label={t("sharePage")}
        className="bg-card/80 border-border/70 hover:bg-card size-9 rounded-full shadow-sm backdrop-blur-md"
      >
        {copied ? <Check className="text-primary size-4" /> : <Share2 className="size-4" />}
      </Button>
    </AppTooltip>
  );
}
