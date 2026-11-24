"use client";

import {
  AlertCircle,
  Check,
  Heart,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "cn";

import { SortableList } from "@/shares/components/common/sortable-list";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shares/components/ui/radio-group";
import { Textarea } from "@/shares/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import type { DonationContentConfig, DonationQrItem } from "../../types/page.types";
import { DonationAmountIcon, DonationAmountIconPicker } from "./donation-amount-icon-picker";
import { PageDonationQrDialog } from "./page-donation-qr-dialog";
import { PageDonationQrItemCard } from "./page-donation-qr-item-card";

/**
 * Trình biên tập nội dung trang Quyên góp / Ủng hộ (Donation VietQR):
 * Hỗ trợ tạo và sắp xếp nhiều mã QR (VietQR ngân hàng, Mã QR tùy chỉnh),
 * tùy biến màu sắc, logo, và các mốc số tiền ủng hộ gợi ý.
 *
 * @param props - Cấu hình Donation hiện tại, hàm cập nhật và cờ vô hiệu hóa.
 * @returns Giao diện chỉnh sửa Donation đã được nội địa hóa đa ngôn ngữ (i18n).
 */
export function PageDonationEditor({
  config,
  onChange,
  disabled = false,
}: {
  config: DonationContentConfig;
  onChange: (updated: DonationContentConfig) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.donationEditor");

  const displayMode = config.displayMode ?? "multiple";
  const creator = config.creator ?? { name: "", message: "", thankYouMessage: "" };
  const suggestedAmounts = config.suggestedAmounts ?? [
    { amount: 30000, label: t("defaultCoffee") },
    { amount: 50000, label: t("defaultBreakfast") },
    { amount: 100000, label: t("defaultBook") },
  ];

  // Khởi tạo danh sách mã QR (tự động migrate từ bankAccount cũ nếu cần)
  const qrCodes: DonationQrItem[] = useMemo(() => {
    if (config.qrCodes && config.qrCodes.length > 0) {
      return config.qrCodes;
    }
    const legacyBank = config.bankAccount;
    if (legacyBank?.accountNumber) {
      return [
        {
          id: "qr-default-bank",
          type: "BANK_TRANSFER",
          title: legacyBank.bankName || "MBBank",
          bankName: legacyBank.bankName || "MBBank",
          bankBin: "970422",
          accountNumber: legacyBank.accountNumber,
          accountHolder: legacyBank.accountHolder || "",
          isDefault: true,
          design: {
            foreground: "#000000",
            background: "#ffffff",
            margin: 2,
            size: 512,
            errorCorrection: "M",
          },
        },
      ];
    }
    return [
      {
        id: "qr-default-bank",
        type: "BANK_TRANSFER",
        title: "MBBank",
        bankName: "MBBank",
        bankBin: "970422",
        accountNumber: "",
        accountHolder: "",
        isDefault: true,
        design: {
          foreground: "#000000",
          background: "#ffffff",
          margin: 2,
          size: 512,
          errorCorrection: "M",
        },
      },
    ];
  }, [config.qrCodes, config.bankAccount]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DonationQrItem | null>(null);

  // Suggested Amounts Form State
  const [newAmount, setNewAmount] = useState("");
  const [newAmountLabel, setNewAmountLabel] = useState("");
  const [newAmountIcon, setNewAmountIcon] = useState<string>("coffee");
  const [editingAmountIndex, setEditingAmountIndex] = useState<number | null>(null);

  const startEditAmount = (index: number) => {
    const item = suggestedAmounts[index];
    if (!item) return;
    setEditingAmountIndex(index);
    setNewAmount(String(item.amount));
    setNewAmountLabel(item.label);
    setNewAmountIcon(item.icon ?? "coffee");
  };

  const cancelEditAmount = () => {
    setEditingAmountIndex(null);
    setNewAmount("");
    setNewAmountLabel("");
    setNewAmountIcon("coffee");
  };

  const updateQrCodes = (newQrCodes: DonationQrItem[]) => {
    const defaultItem = newQrCodes.find((q) => q.isDefault) ?? newQrCodes[0];
    onChange({
      ...config,
      qrCodes: newQrCodes,
      // Luôn đồng bộ ngược về bankAccount để tương thích ngược 100%
      bankAccount: defaultItem
        ? {
            bankName: defaultItem.bankName ?? defaultItem.title,
            accountNumber: defaultItem.accountNumber,
            accountHolder: defaultItem.accountHolder,
          }
        : config.bankAccount,
    });
  };

  const handleSaveQrItem = (item: DonationQrItem) => {
    if (editingItem) {
      // Sửa item
      const updated = qrCodes.map((q) => (q.id === item.id ? item : q));
      updateQrCodes(updated);
    } else {
      // Thêm mới (nếu là item đầu tiên thì tự set mặc định)
      const isFirst = qrCodes.length === 0;
      const newItem = { ...item, isDefault: isFirst || item.isDefault };
      updateQrCodes([...qrCodes, newItem]);
    }
    setEditingItem(null);
  };

  const handleDeleteQrItem = (id: string) => {
    const filtered = qrCodes.filter((q) => q.id !== id);
    if (filtered.length > 0 && !filtered.some((q) => q.isDefault)) {
      filtered[0] = { ...filtered[0], isDefault: true };
    }
    updateQrCodes(filtered);
  };

  const handleSetDefault = (id: string) => {
    const updated = qrCodes.map((q) => ({
      ...q,
      isDefault: q.id === id,
    }));
    updateQrCodes(updated);
  };

  const updateCreator = (field: keyof typeof creator, value: string) => {
    onChange({
      ...config,
      creator: {
        ...creator,
        [field]: value,
      },
    });
  };

  const handleAddAmount = () => {
    const num = Number(newAmount.replace(/\D/g, ""));
    if (!num || num <= 0) return;
    const label = newAmountLabel.trim() || `${num.toLocaleString("vi-VN")} ₫`;

    if (editingAmountIndex !== null && editingAmountIndex >= 0) {
      const updated = [...suggestedAmounts];
      updated[editingAmountIndex] = { amount: num, label, icon: newAmountIcon };
      onChange({
        ...config,
        suggestedAmounts: updated,
      });
      setEditingAmountIndex(null);
    } else {
      onChange({
        ...config,
        suggestedAmounts: [...suggestedAmounts, { amount: num, label, icon: newAmountIcon }],
      });
    }
    setNewAmount("");
    setNewAmountLabel("");
    setNewAmountIcon("coffee");
  };

  const handleRemoveAmount = (amount: number) => {
    onChange({
      ...config,
      suggestedAmounts: suggestedAmounts.filter((a) => a.amount !== amount),
    });
  };

  const handleReorderAmounts = (newAmounts: typeof suggestedAmounts) => {
    onChange({
      ...config,
      suggestedAmounts: newAmounts,
    });
  };

  const handleDisplayModeChange = (val: string) => {
    if (disabled) return;
    const newMode = val as "single" | "multiple";
    if (newMode === "single") {
      // Khi chuyển sang 1 mã, đảm bảo mã mặc định được set rõ ràng (nếu chưa có thì lấy mã đầu tiên)
      const hasDefault = qrCodes.some((q) => q.isDefault);
      const updatedQrCodes = qrCodes.map((q, idx) => ({
        ...q,
        isDefault: hasDefault ? Boolean(q.isDefault) : idx === 0,
      }));
      const defaultItem = updatedQrCodes.find((q) => q.isDefault) ?? updatedQrCodes[0];
      onChange({
        ...config,
        displayMode: "single",
        qrCodes: updatedQrCodes,
        bankAccount: defaultItem
          ? {
              bankName: defaultItem.bankName ?? defaultItem.title,
              accountNumber: defaultItem.accountNumber,
              accountHolder: defaultItem.accountHolder,
            }
          : config.bankAccount,
      });
    } else {
      onChange({
        ...config,
        displayMode: "multiple",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Danh sách phương thức nhận tiền & Mã QR */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <QrCode className="text-primary size-4" />
              <span>{t("qrMethodsTitle", { count: qrCodes.length })}</span>
            </CardTitle>
            <p className="text-muted-foreground text-xs">{t("qrMethodsHint")}</p>
          </div>

          {displayMode === "multiple" ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setIsDialogOpen(true);
              }}
              disabled={disabled}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Plus className="size-3.5" />
              <span>{t("addQrMethod")}</span>
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tùy chọn 1 mã hay nhiều mã */}
          <div className="bg-muted/30 border-border rounded-xl border p-3.5">
            <Label className="text-xs font-medium">{t("displayModeLabel")}</Label>
            <RadioGroup
              value={displayMode}
              onValueChange={handleDisplayModeChange}
              disabled={disabled}
              className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            >
              <Label
                htmlFor="donation-mode-single"
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  displayMode === "single"
                    ? "border-primary bg-primary/5 text-foreground ring-primary/20 ring-1"
                    : "border-border hover:bg-muted/50 text-muted-foreground",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <RadioGroupItem
                  value="single"
                  id="donation-mode-single"
                  className="mt-0.5 shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-foreground block text-xs font-medium">
                    {t("displayModeSingle")}
                  </span>
                  <span className="text-muted-foreground block text-[11px] leading-relaxed font-normal">
                    {t("displayModeSingleHint")}
                  </span>
                </div>
              </Label>

              <Label
                htmlFor="donation-mode-multiple"
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  displayMode === "multiple"
                    ? "border-primary bg-primary/5 text-foreground ring-primary/20 ring-1"
                    : "border-border hover:bg-muted/50 text-muted-foreground",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <RadioGroupItem
                  value="multiple"
                  id="donation-mode-multiple"
                  className="mt-0.5 shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-foreground block text-xs font-medium">
                    {t("displayModeMultiple")}
                  </span>
                  <span className="text-muted-foreground block text-[11px] leading-relaxed font-normal">
                    {t("displayModeMultipleHint")}
                  </span>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Danh sách Sortable các mã QR */}
          {qrCodes.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center text-xs">
              <p>{t("emptyQrMethods")}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
                disabled={disabled}
                className="mt-3 h-8 gap-1.5 px-3 text-xs"
              >
                <Plus className="size-3.5" />
                <span>{t("addQrMethod")}</span>
              </Button>
            </div>
          ) : (
            <SortableList
              items={qrCodes}
              onReorder={updateQrCodes}
              disabled={disabled}
              dragHandlePosition="left"
              keyExtractor={(item, index) => item.id || `qr-item-${index}`}
              className="space-y-2.5"
              renderItem={(item) => (
                <PageDonationQrItemCard
                  item={item}
                  disabled={disabled}
                  onEdit={() => {
                    setEditingItem(item);
                    setIsDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteQrItem(item.id)}
                  onSetDefault={() => handleSetDefault(item.id)}
                />
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* 2. Thông tin lời nhắn & Cảm ơn */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="text-primary size-4" />
            <span>{t("messageTitle")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("message")}</Label>
            <Textarea
              placeholder={t("messagePlaceholder")}
              value={creator.message}
              onChange={(e) => updateCreator("message", e.target.value)}
              disabled={disabled}
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("thankYouMessage")}</Label>
            <Input
              placeholder={t("thankYouMessagePlaceholder")}
              value={creator.thankYouMessage}
              onChange={(e) => updateCreator("thankYouMessage", e.target.value)}
              disabled={disabled}
              className="h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Các mốc số tiền ủng hộ gợi ý */}
      <Card className="border-border bg-card rounded-xl border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Heart className="text-primary size-4" />
            <span>{t("suggestedAmountsTitle", { count: suggestedAmounts.length })}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  role="button"
                  className="text-muted-foreground/70 hover:text-foreground focus-visible:ring-ring inline-flex cursor-help items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  aria-label={t("suggestedAmountsTooltip")}
                >
                  <AlertCircle className="size-3.5" aria-hidden />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {t("suggestedAmountsTooltip")}
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder={t("amountPlaceholder")}
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              disabled={disabled}
              className="h-9 flex-1 text-xs"
            />
            <Input
              placeholder={t("labelPlaceholder")}
              value={newAmountLabel}
              onChange={(e) => setNewAmountLabel(e.target.value)}
              disabled={disabled}
              className="h-9 flex-1 text-xs"
            />
            <DonationAmountIconPicker
              value={newAmountIcon}
              onChange={setNewAmountIcon}
              disabled={disabled}
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant={editingAmountIndex !== null ? "default" : "outline"}
                size="sm"
                onClick={handleAddAmount}
                disabled={disabled || !newAmount}
                className="h-9 gap-1 text-xs"
              >
                {editingAmountIndex !== null ? (
                  <>
                    <Check className="size-3.5" />
                    <span>{t("saveAmount")}</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    <span>{t("addAmount")}</span>
                  </>
                )}
              </Button>
              {editingAmountIndex !== null ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditAmount}
                  className="text-muted-foreground h-9 px-2 text-xs"
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>

          <SortableList
            items={suggestedAmounts}
            onReorder={handleReorderAmounts}
            disabled={disabled}
            dragHandlePosition="left"
            keyExtractor={(opt, index) => `suggested-amount-${opt.amount}-${index}`}
            className="space-y-2"
            renderItem={(opt, { index }) => {
              const isItemEditing = editingAmountIndex === index;

              return (
                <div
                  key={`${opt.amount}-${index}`}
                  className={cn(
                    "group border-border bg-card hover:border-primary/40 flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-xs shadow-2xs transition-all hover:shadow-xs",
                    isItemEditing && "border-primary bg-primary/5 ring-primary/40 ring-1",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold">
                      #{index + 1}
                    </span>
                    <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg shadow-2xs">
                      <DonationAmountIcon iconKey={opt.icon} className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate font-semibold">{opt.label}</div>
                      <div className="text-primary font-mono text-[11px] font-bold">
                        {opt.amount.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => startEditAmount(index)}
                      disabled={disabled}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground size-7.5 rounded-lg transition-colors"
                      title={t("editAmount")}
                      aria-label={t("editAmount")}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveAmount(opt.amount)}
                      disabled={disabled}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-7.5 rounded-lg transition-colors"
                      title={t("removeAmount")}
                      aria-label={t("removeAmount")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />

          {/* Cấu hình tự nhập số tiền tùy ý và mức tối thiểu */}
          <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-3.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="allow-custom-amount"
                checked={config.allowCustomAmount ?? true}
                onCheckedChange={(checked) =>
                  !disabled && onChange({ ...config, allowCustomAmount: Boolean(checked) })
                }
                disabled={disabled}
              />
              <Label htmlFor="allow-custom-amount" className="cursor-pointer text-xs font-medium">
                {t("allowCustomAmount")}
              </Label>
            </div>

            {(config.allowCustomAmount ?? true) ? (
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t("minAmountLabel")}</Label>
                <div className="relative flex max-w-xs items-center">
                  <Input
                    inputMode="numeric"
                    value={
                      config.minAmount ? Number(config.minAmount).toLocaleString("vi-VN") : "10.000"
                    }
                    onChange={(e) => {
                      const num = Number(e.target.value.replace(/\D/g, ""));
                      onChange({ ...config, minAmount: num || 1000 });
                    }}
                    placeholder={t("minAmountPlaceholder")}
                    disabled={disabled}
                    className="h-8 pr-8 text-xs font-medium"
                  />
                  <span className="text-muted-foreground pointer-events-none absolute right-2.5 text-xs font-semibold">
                    ₫
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px]">{t("minAmountHint")}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Dialog tạo / sửa chi tiết một mã QR */}
      {isDialogOpen && (
        <PageDonationQrDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialItem={editingItem}
          onSave={handleSaveQrItem}
        />
      )}
    </div>
  );
}
