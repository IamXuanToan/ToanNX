"use client";

import { QrCode as QrCodeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmptyState } from "@/shares/components/common/empty-state/empty-state";
import { SearchInput } from "@/shares/components/common/search-input/search-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useQrCodes } from "../../hooks/use-qr-codes";
import type { QrCode } from "../../types/qr-code.types";

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
  const t = useTranslations("qrCodes.picker");
  const [search, setSearch] = useState("");
  const query = useQrCodes({ search, page: 1, pageSize: 60, ordering: "-updated_at" }, open);
  const items = query.data?.items ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <SearchInput value={search} onValueChange={setSearch} placeholder={t("search")} />
        {query.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : items.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((code) => (
              <li key={code.id}>
                <button
                  type="button"
                  onClick={() => onPick(code)}
                  className="hover:border-primary focus-visible:ring-ring w-full rounded-xl border p-2 text-left outline-none focus-visible:ring-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={code.image.url}
                    alt=""
                    className="aspect-square w-full rounded-lg bg-white object-contain"
                  />
                  <span className="mt-2 block truncate text-sm font-medium">{code.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<QrCodeIcon />} title={t("empty")} />
        )}
      </DialogContent>
    </Dialog>
  );
}
