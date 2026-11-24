"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import type { UploadedFile } from "@/shares/components/common/image-upload.types";

import { pageService } from "../../../services/page.service";
import type { AffiliateItem, PageMetadataResult } from "../../../types/page.types";

/**
 * Làm sạch chuỗi URL đầu vào, loại bỏ ký tự thừa do gõ phím tiếng Việt ở đầu (như 'đhttps://...').
 */
export function cleanIncomingUrl(raw: string): string {
  let cleaned = raw.trim();
  const httpIdx = cleaned.search(/https?:\/\//i);
  if (httpIdx > 0) {
    cleaned = cleaned.slice(httpIdx);
  }
  return cleaned;
}

/**
 * Trích xuất tiêu đề gợi ý từ URL slug (Shopee, Lazada, Tiki) nếu website không trả OpenGraph.
 */
function extractSlugTitle(rawUrl: string): string {
  try {
    const trimmed = cleanIncomingUrl(rawUrl);
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "";
    }
    const urlObj = new URL(trimmed);
    let path = decodeURIComponent(urlObj.pathname).replace(/^\/+|\/+$/g, "");
    if (!path) return "";

    if (path.includes("-i.")) {
      path = path.split("-i.")[0] ?? "";
    }
    path = path.replace(/-[ip]\d+\.html.*/i, "");
    const last = path.split("/").pop() || "";
    const cleaned = last
      .replace(/\.(html|htm|php|asp|aspx)$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();

    return cleaned;
  } catch {
    return "";
  }
}

/**
 * Hook xử lý nhập URL, gọi API trích xuất metadata và chuyển đổi/chỉnh sửa sản phẩm Affiliate.
 *
 * @param onAdd - Callback khi xác nhận thêm sản phẩm mới.
 * @param onSave - Callback khi lưu chỉnh sửa sản phẩm đã có.
 * @param onClose - Callback đóng modal.
 * @param editingItem - Dữ liệu sản phẩm đang chỉnh sửa (hoặc null nếu thêm mới).
 * @returns Trạng thái loading, các trường biểu mẫu và các handler xử lý.
 */
export function useQuickAddModal({
  onAdd,
  onSave,
  onClose,
  editingItem,
}: {
  onAdd?: (item: AffiliateItem) => void;
  onSave?: (item: AffiliateItem) => void;
  onClose: () => void;
  editingItem?: AffiliateItem | null;
}) {
  const t = useTranslations("utilities.customPages.quickAdd");

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<PageMetadataResult | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [badgeText, setBadgeText] = useState("");
  const [badgeBgColor, setBadgeBgColor] = useState("#EF4444");
  const [badgeTextColor, setBadgeTextColor] = useState("#FFFFFF");
  const [categoryId, setCategoryId] = useState("");
  const [platform, setPlatform] = useState<AffiliateItem["platform"]>("custom");
  const [imageTab, setImageTab] = useState<"url" | "upload">("url");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [prevEditingItem, setPrevEditingItem] = useState<AffiliateItem | null>(null);

  const currentItem = editingItem ?? null;
  // Điền dữ liệu khi ở chế độ chỉnh sửa sản phẩm (đồng bộ state trong render theo chuẩn React)
  if (currentItem !== prevEditingItem) {
    setPrevEditingItem(currentItem);
    if (currentItem) {
      setUrl(currentItem.destinationUrl || "");
      setTitle(currentItem.title || "");
      const existingImg = currentItem.imageUrl || "";
      setImageUrl(existingImg);
      setPrice(currentItem.priceConfig?.amount ? String(currentItem.priceConfig.amount) : "");
      setOriginalPrice(
        currentItem.priceConfig?.originalAmount
          ? String(currentItem.priceConfig.originalAmount)
          : "",
      );
      setShowPrice(
        currentItem.priceConfig?.mode !== "view_at_store" ||
          Boolean(currentItem.priceConfig?.amount),
      );
      setBadgeText(currentItem.badge?.text || "");
      setBadgeBgColor(currentItem.badge?.bgColor || "#EF4444");
      setBadgeTextColor(currentItem.badge?.textColor || "#FFFFFF");
      setCategoryId(currentItem.categoryId || "");
      setPlatform(currentItem.platform || "custom");
      setUploadedFile(
        existingImg ? { id: "current-img", url: existingImg, name: currentItem.title } : null,
      );
      setMetadata({
        title: currentItem.title,
        description: currentItem.description || "",
        imageUrl: existingImg || null,
        platform: currentItem.platform,
        siteName: currentItem.platform,
        price: currentItem.priceConfig?.amount || null,
        currency: "VND",
        canonicalUrl: currentItem.destinationUrl,
        destinationUrl: currentItem.destinationUrl,
      });
    } else {
      setUrl("");
      setTitle("");
      setImageUrl("");
      setPrice("");
      setOriginalPrice("");
      setShowPrice(true);
      setBadgeText("");
      setBadgeBgColor("#EF4444");
      setBadgeTextColor("#FFFFFF");
      setCategoryId("");
      setPlatform("custom");
      setUploadedFile(null);
      setMetadata(null);
    }
  }

  // Cập nhật imageUrl khi người dùng chọn file từ thư viện
  const handleUploadedFileChange = (file: UploadedFile | null) => {
    setUploadedFile(file);
    if (file?.url) {
      setImageUrl(file.url);
    }
  };

  const handleFetch = async () => {
    const cleanedUrl = cleanIncomingUrl(url);
    if (!cleanedUrl) {
      toast.error(t("urlRequired"));
      return;
    }
    if (cleanedUrl !== url) {
      setUrl(cleanedUrl);
    }
    setLoading(true);
    const fallbackTitle = extractSlugTitle(cleanedUrl);
    const detectedPlatform = cleanedUrl.includes("shopee")
      ? "shopee"
      : cleanedUrl.includes("lazada")
        ? "lazada"
        : cleanedUrl.includes("tiki")
          ? "tiki"
          : cleanedUrl.includes("tiktok")
            ? "tiktok"
            : "custom";

    try {
      const data = await pageService.fetchMetadata(cleanedUrl);
      setMetadata(data);
      const resolvedTitle = data.title || fallbackTitle;
      if (resolvedTitle) {
        setTitle(resolvedTitle);
      }
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
      if (data.price) {
        setPrice(String(data.price));
      }
      if (data.platform && data.platform !== "custom") {
        setPlatform(data.platform as AffiliateItem["platform"]);
      } else {
        setPlatform(detectedPlatform as AffiliateItem["platform"]);
      }
      toast.success(t("fetchSuccess"));
    } catch {
      toast.error(t("fetchError"));
      if (fallbackTitle) {
        setTitle(fallbackTitle);
      }
      setPlatform(detectedPlatform as AffiliateItem["platform"]);
      setMetadata({
        title: fallbackTitle,
        description: "",
        imageUrl: null,
        platform: detectedPlatform,
        siteName: "",
        price: null,
        currency: "VND",
        canonicalUrl: url,
        destinationUrl: url,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    const cleanedUrl = cleanIncomingUrl(url);
    const numPrice = showPrice && price.trim() ? Number(price.replace(/\D/g, "")) : undefined;
    const numOriginalPrice =
      showPrice && originalPrice.trim() ? Number(originalPrice.replace(/\D/g, "")) : undefined;

    const finalItem: AffiliateItem = {
      id: editingItem?.id ?? "item-" + Date.now(),
      displayMode: "product",
      title: title.trim(),
      rawTitle: metadata?.title || title.trim(),
      description: editingItem?.description || metadata?.description,
      categoryId: categoryId || "cat-default",
      destinationUrl: cleanedUrl || url.trim(),
      platform,
      imageUrl: imageUrl.trim() || undefined,
      priceConfig: {
        mode: showPrice && numPrice ? "fixed" : "view_at_store",
        amount: numPrice,
        originalAmount: numOriginalPrice,
        currency: "VND",
        priceNote:
          showPrice && numPrice
            ? t("referencePrice")
            : t("buyAt", { platform: platform.toUpperCase() }),
      },
      buttonConfig: {
        label: t("buyAt", { platform: platform.toUpperCase() }),
        openInNewTab: true,
      },
      badge: badgeText.trim()
        ? {
            text: badgeText.trim(),
            tone: "hot",
            bgColor: badgeBgColor || undefined,
            textColor: badgeTextColor || undefined,
          }
        : undefined,
      sortOrder: editingItem?.sortOrder ?? Date.now(),
      isVisible: true,
    };

    if (editingItem && onSave) {
      onSave(finalItem);
      toast.success(t("editSuccess"));
    } else if (onAdd) {
      onAdd(finalItem);
      toast.success(t("addSuccess"));
    }
    onClose();
  };

  return {
    url,
    setUrl,
    loading,
    metadata,
    title,
    setTitle,
    imageUrl,
    setImageUrl,
    price,
    setPrice,
    originalPrice,
    setOriginalPrice,
    showPrice,
    setShowPrice,
    badgeText,
    setBadgeText,
    badgeBgColor,
    setBadgeBgColor,
    badgeTextColor,
    setBadgeTextColor,
    categoryId,
    setCategoryId,
    platform,
    setPlatform,
    imageTab,
    setImageTab,
    uploadedFile,
    handleUploadedFileChange,
    handleFetch,
    handleConfirm,
    isEditing: Boolean(editingItem),
  };
}
