"use client";

import Image from "next/image";
import { QrCode as QrCodeIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/shares/components/common/empty-state";
import { SearchInput } from "@/shares/components/common/search-input";
import { Card } from "@/shares/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";

import type { QrCode } from "../../types/qr-code.types";
import { useQrCodePicker } from "./hooks/use-qr-code-picker";

/**
 * Dialog chọn một mã QR của mình (lưới ảnh, tìm theo tên). Chọn xong trả về mã QR; nơi gọi chèn ảnh của nó.
 *
 * @param props - Trạng thái mở và callback chọn.
 * @returns Dialog.
 */
export function QrCodePicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (code: QrCode) => void;
}) {
  const t = useTranslations("utilities.qrCodes.picker");
  const { search, setSearch, items, isPending } = useQrCodePicker({ open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <SearchInput value={search} onValueChange={setSearch} placeholder={t("search")} />
        {isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((code) => (
              <Card
                key={code.id}
                role="button"
                tabIndex={0}
                onClick={() => onPick(code)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPick(code);
                  }
                }}
                className="hover:border-primary focus-visible:ring-ring group min-w-0 cursor-pointer rounded-xl border p-2 text-left transition-all select-none focus-visible:ring-2 focus-visible:outline-hidden"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                  <Image
                    src={code.image.url}
                    alt={code.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain p-1"
                  />
                </div>
                <span className="mt-2 block truncate text-sm font-medium">{code.name}</span>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<QrCodeIcon />} title={t("empty")} />
        )}
      </DialogContent>
    </Dialog>
  );
}
