"use client";

import {
  ArrowRight,
  FileText,
  Globe,
  Heart,
  Loader2,
  PackagePlus,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";

import { useRouter } from "@/i18n/navigation";
import { SlugInput } from "@/shares/components/common/slug-input";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { sanitizeSlugInput } from "@/shares/lib/code-slug-input";

import { PORTAL_ROUTES } from "@/modules/portal/constants/routes";
import { PAGE_TYPE } from "../../constants/page-constants";
import { THEME_PRESETS } from "../../constants/page-theme-presets";
import { UTILITIES_ROUTES } from "../../constants/routes";
import { useCreatePage } from "../../hooks/use-create-page";
import { usePagePathOptions } from "../../hooks/use-page-path-options";
import { PAGE_FORM_DEFAULTS } from "../../schemas/page.schema";
import type { PageDetail, PageInput, PageType } from "../../types/page.types";
import { PagePathSelect } from "../page-path/page-path-select";

/** 4 loại trang tiêu chuẩn hỗ trợ tạo mới */
const CREATE_PAGE_TYPE_OPTIONS = [
  {
    type: PAGE_TYPE.AFFILIATE,
    typeKey: "affiliate",
    icon: ShoppingBag,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    themePresetIndex: 0,
    templateKey: "product_grid",
  },
  {
    type: PAGE_TYPE.BIO,
    typeKey: "bio",
    icon: UserCheck,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    themePresetIndex: 1,
    templateKey: "bio_profile",
  },
  {
    type: PAGE_TYPE.DONATION,
    typeKey: "donation",
    icon: Heart,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    themePresetIndex: 2,
    templateKey: "donation_vietqr",
  },
  {
    type: PAGE_TYPE.LEGACY_PAGE,
    typeKey: "legacy",
    icon: FileText,
    colorClass: "text-muted-foreground bg-muted border-border",
    themePresetIndex: 0,
    templateKey: "blank",
  },
] as const;

/**
 * Dialog chọn loại trang và cấu hình ban đầu (tiêu đề, slug, đường dẫn giữa)
 * hiển thị ngay khi người dùng ấn nút "+ Tạo trang" trước khi chuyển đến Workspace chỉnh sửa.
 *
 * @param props - Trạng thái đóng mở, quyền quản lý path và chế độ Portal.
 * @returns Dialog tạo trang.
 */
export function PageCreateDialog({
  open,
  onOpenChange,
  canCreatePath = false,
  canUpdatePath = false,
  portalMode = false,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canCreatePath?: boolean;
  canUpdatePath?: boolean;
  portalMode?: boolean;
  onSuccess?: (created: PageDetail) => void;
}) {
  const tCreate = useTranslations("utilities.customPages.pages.createDialog");
  const tCommon = useTranslations("common.actions");
  const router = useRouter();
  const create = useCreatePage();
  const pathQuery = usePagePathOptions();

  const [selectedType, setSelectedType] = useState<PageType>(PAGE_TYPE.AFFILIATE);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [pathId, setPathId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tự động nhận path đầu tiên nếu người dùng chưa chọn thủ công
  const effectivePathId = pathId || pathQuery.data?.[0]?.id || "";

  // Reset form khi đóng mở dialog
  const resetForm = () => {
    setSelectedType(PAGE_TYPE.AFFILIATE);
    setTitle("");
    setSlug("");
    setSlugEdited(false);
    setPathId("");
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!submitting) {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    }
  };

  // Tự động sinh slug từ tiêu đề nếu người dùng chưa sửa tay
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) {
      setSlug(sanitizeSlugInput(val, { preserveCase: true }));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  const selectedPath = pathQuery.data?.find((p) => p.id === effectivePathId);
  const selectedSegment = selectedPath ? selectedPath.segment : "p";
  const selectedOption =
    CREATE_PAGE_TYPE_OPTIONS.find((opt) => opt.type === selectedType) ??
    CREATE_PAGE_TYPE_OPTIONS[0];

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error(tCreate("errorTitle"));
      return;
    }
    if (!slug.trim()) {
      toast.error(tCreate("errorSlug"));
      return;
    }
    if (!effectivePathId) {
      toast.error(tCreate("errorPath"));
      return;
    }

    setSubmitting(true);
    try {
      const isLegacy = selectedType === PAGE_TYPE.LEGACY_PAGE;
      const preset = THEME_PRESETS[selectedOption.themePresetIndex] ?? THEME_PRESETS[0];

      // Chuẩn bị payload khởi tạo phù hợp với loại trang được chọn
      const input: PageInput = {
        title: title.trim(),
        slug: slug.trim(),
        pathId: effectivePathId,
        pageType: selectedType,
        status: "DRAFT",
        template: "blank",
        templateKey: selectedOption.templateKey,
        templateVersion: 1,
        contentConfig: isLegacy ? {} : PAGE_FORM_DEFAULTS.contentConfig,
        theme: {
          ...(isLegacy
            ? { buttonStyle: "rounded" as const }
            : { primaryColor: preset.primary, buttonStyle: preset.buttonStyle }),
          mode: "system" as const,
        },
        styleConfig: isLegacy
          ? {}
          : {
              themePreset: preset.name.toLowerCase().replace(/\s+/g, "_"),
              primaryColor: preset.primary,
            },
        responsiveConfig: isLegacy ? {} : PAGE_FORM_DEFAULTS.responsiveConfig,
        content: { type: "doc", content: [{ type: "paragraph" }] },
      };

      const saved = await create.mutateAsync(input);
      toast.success(tCreate("success"));
      onOpenChange(false);

      if (onSuccess) {
        onSuccess(saved);
      } else {
        const targetRoute = portalMode
          ? PORTAL_ROUTES.pageDetail(saved.id)
          : UTILITIES_ROUTES.pageDetail(saved.id);
        router.push(targetRoute);
      }
    } catch {
      toast.error(tCreate("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <PackagePlus className="text-primary size-5" />
            <span>{tCreate("title")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">{tCreate("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 1. Chọn loại trang (4 options trực quan) */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">
              {tCreate("step1Title")} <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CREATE_PAGE_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                const optLabel = tCreate(
                  `types.${opt.typeKey}.label` as Parameters<typeof tCreate>[0],
                );
                const optBadge = tCreate(
                  `types.${opt.typeKey}.badge` as Parameters<typeof tCreate>[0],
                );
                const optDesc = tCreate(
                  `types.${opt.typeKey}.description` as Parameters<typeof tCreate>[0],
                );

                return (
                  <Button
                    key={opt.type}
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedType(opt.type)}
                    className={cn(
                      "relative flex h-auto flex-col items-stretch justify-start rounded-xl p-3.5 text-left font-normal whitespace-normal transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-primary/30 shadow-xs ring-2"
                        : "border-border hover:border-primary/40 hover:bg-muted/30 bg-card",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                            opt.colorClass,
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <span className="text-foreground text-sm font-bold">{optLabel}</span>
                      </div>
                      <Badge
                        variant={isSelected ? "default" : "secondary"}
                        className="h-4.5 shrink-0 px-1.5 text-[10px] font-medium"
                      >
                        {optBadge}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                      {optDesc}
                    </p>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 2. Cài đặt thông tin cơ bản */}
          <div className="border-border bg-muted/20 space-y-3.5 rounded-xl border p-4">
            <Label className="block text-xs font-semibold">{tCreate("step2Title")}</Label>

            {/* Tiêu đề trang */}
            <div className="space-y-1.5">
              <Label htmlFor="create-page-title" className="text-xs font-medium">
                {tCreate("pageTitle")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-page-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={tCreate("titlePlaceholder")}
                className="h-9 text-xs font-medium"
                autoFocus
              />
            </div>

            {/* Đường dẫn giữa và Slug */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-page-path" className="text-xs font-medium">
                  {tCreate("pathLabel")} <span className="text-destructive">*</span>
                </Label>
                <PagePathSelect
                  id="create-page-path"
                  value={effectivePathId}
                  onChange={setPathId}
                  paths={pathQuery.data ?? []}
                  canCreate={canCreatePath}
                  canUpdate={canUpdatePath}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-page-slug" className="text-xs font-medium">
                  {tCreate("slugLabel")} <span className="text-destructive">*</span>
                </Label>
                <SlugInput
                  id="create-page-slug"
                  value={slug}
                  onChange={handleSlugChange}
                  preserveCase
                  placeholder={tCreate("slugPlaceholder")}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Xem trước URL công khai */}
            <div className="bg-background border-border/80 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
              <Globe className="text-muted-foreground size-3.5 shrink-0" />
              <span className="text-muted-foreground shrink-0 text-[11px]">
                {tCreate("publicUrl")}
              </span>
              <span className="text-primary truncate font-mono text-[11px] font-bold">
                toannx.com/{selectedSegment}/{slug || "..."}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-9 text-xs"
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={submitting || !title.trim() || !slug.trim() || !effectivePathId}
            onClick={handleCreate}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowRight className="size-3.5" />
            )}
            <span>{tCreate("startEditing")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
