import type { TiptapDocument } from "@/shares/components/common/tiptap-editor.types";
import type { ListParams } from "@/shares/types/api.types";
import type { AttachmentSummary } from "@/shares/types/attachment.types";
import { PAGE_TYPE } from "../constants/page-constants";

export { PAGE_TYPE, type PageTypeValue } from "../constants/page-constants";

export const PAGE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"] as const;
export const PAGE_TEMPLATES = ["blank", "link_in_bio", "about", "donate"] as const;

/** Toàn bộ các mã loại trang trong hệ thống (kể cả các loại cũ để tương thích ngược). */
export const ALL_PAGE_TYPES = [
  PAGE_TYPE.AFFILIATE,
  PAGE_TYPE.BIO,
  PAGE_TYPE.DONATION,
  PAGE_TYPE.PRODUCT_CATALOG,
  PAGE_TYPE.PORTFOLIO,
  PAGE_TYPE.LANDING,
  PAGE_TYPE.LEGACY_PAGE,
] as const;

/**
 * Danh mục 4 loại trang tiêu chuẩn cho phép tạo và chọn mới:
 * 1. Trang sản phẩm (gộp Tiếp thị liên kết & Danh mục sản phẩm)
 * 2. Link-in-Bio
 * 3. Ủng hộ / Quyên góp
 * 4. Trang soạn thảo tự do (Legacy)
 */
export const PAGE_TYPES = [
  PAGE_TYPE.AFFILIATE,
  PAGE_TYPE.BIO,
  PAGE_TYPE.DONATION,
  PAGE_TYPE.LEGACY_PAGE,
] as const;

export type PageStatus = (typeof PAGE_STATUSES)[number];
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];
export type PageType = (typeof ALL_PAGE_TYPES)[number];

/** Cấu hình giá sản phẩm affiliate. */
export type AffiliatePriceConfig = {
  mode: "hidden" | "fixed" | "range" | "contact" | "view_at_store";
  amount?: number;
  originalAmount?: number;
  currency?: "VND" | "USD";
  priceNote?: string;
};

/** Cấu hình nút CTA sản phẩm affiliate. */
export type AffiliateButtonConfig = {
  label?: string;
  openInNewTab?: boolean;
};

/** Một sản phẩm hoặc liên kết trong trang Affiliate. */
export type AffiliateItem = {
  id: string;
  displayMode: "product" | "link";
  title: string;
  rawTitle?: string;
  description?: string;
  categoryId: string;
  destinationUrl: string;
  platform: string;
  imageUrl?: string;
  priceConfig: AffiliatePriceConfig;
  buttonConfig: AffiliateButtonConfig;
  badge?: {
    text: string;
    tone?: "primary" | "hot" | "sale" | "neutral";
    bgColor?: string;
    textColor?: string;
  };
  isFeatured?: boolean;
  sortOrder: number;
  isVisible: boolean;
};

/** Một danh mục trong trang Affiliate. */
export type AffiliateCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
};

/** Cấu hình một nơi bán (platform) riêng của từng trang Affiliate. */
export type AffiliatePlatformConfig = {
  id: string;
  code: string;
  name: string;
  urlPattern: string;
  sortOrder: number;
  isVisible: boolean;
};

/** Toàn bộ cấu hình nội dung trang Affiliate. */
export type AffiliateContentConfig = {
  profile?: {
    title: string;
    bio?: string;
  };
  categories: AffiliateCategory[];
  platforms?: AffiliatePlatformConfig[];
  items: AffiliateItem[];
};

/** Một mốc kinh nghiệm làm việc trong hồ sơ cá nhân / portfolio. */
export type BioExperience = {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
};

/** Một kỹ năng chuyên môn trong hồ sơ cá nhân. */
export type BioSkill = {
  id: string;
  name: string;
  level?: string;
  category?: string;
};

/** Một dự án tiêu biểu trong hồ sơ cá nhân. */
export type BioProject = {
  id: string;
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
};

/** Cấu hình nội dung trang Bio / Portfolio. */
export type BioContentConfig = {
  profile: {
    displayName: string;
    headline?: string;
    bioText: string;
    avatarUrl?: string;
    location?: string;
    email?: string;
    website?: string;
    socials?: Array<{ platform: string; url: string }>;
  };
  experiences?: BioExperience[];
  skills?: BioSkill[];
  projects?: BioProject[];
  links: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    iconUrl?: string;
    thumbnailUrl?: string;
    displayStyle?: "default" | "featured" | "grid";
    blockSize?: "sm" | "md" | "lg";
    badgeText?: string;
    highlight?: boolean;
    sortOrder: number;
    isVisible: boolean;
  }>;
};

export type QrAccountType = "BANK_TRANSFER" | "CUSTOM";

/** Một mã QR nhận ủng hộ / quyên góp với đầy đủ tùy biến màu sắc, logo và thông tin tài khoản. */
export type DonationQrItem = {
  id: string;
  type: QrAccountType;
  title: string;
  bankBin?: string;
  bankName?: string;
  accountNumber: string;
  accountHolder: string;
  note?: string;
  isDefault?: boolean;
  design?: {
    foreground?: string;
    background?: string;
    margin?: number;
    size?: number;
    errorCorrection?: "L" | "M" | "Q" | "H";
  };
  logoId?: string | null;
  logoUrl?: string;
  previewSvg?: string;
  customImageId?: string | null;
  customImageUrl?: string;
  webhookEnabled?: boolean;
  webhookToken?: string;
  hideAmount?: boolean;
};

/** Cấu hình nội dung trang Donation. */
export type DonationContentConfig = {
  creator: {
    name: string;
    message: string;
    thankYouMessage?: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  displayMode?: "single" | "multiple";
  qrCodes?: DonationQrItem[];
  suggestedAmounts?: Array<{
    amount: number;
    label: string;
    icon?: string;
  }>;
  minAmount?: number;
  allowCustomAmount?: boolean;
  leaderboardDays?: number;
  showLiveFeed?: boolean;
  options?: {
    showBankDetails?: boolean;
    showCopyButton?: boolean;
  };
};

/** Theme có cấu trúc (BE `validate_theme`). */
export type PageTheme = {
  mode?: "light" | "dark" | "system";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
};

import type { PagePatternKey } from "../lib/page-patterns";

/** Cấu hình style và giao diện theo template. */
export type PageStyleConfig = {
  themePreset?: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  cardRadius?: "0px" | "4px" | "8px" | "12px" | "20px";
  cardShadow?: "none" | "sm" | "md" | "lg";
  backgroundType?: "solid" | "gradient" | "image" | "pattern";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientColors?: string[];
  patternKey?: PagePatternKey;
  backgroundFit?: "cover" | "contain" | "tile";
  backgroundBlur?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  ambientMotion?: "none" | "gradient_flow" | "floating_orbs";
  headerLayout?: "centered" | "banner_overlap" | "hero_card" | "editorial_left";
  avatarShape?: "circle" | "squircle" | "square";
  avatarSize?: "sm" | "md" | "lg";
  avatarRing?: "none" | "solid" | "gradient_glow";
  showVerifiedBadge?: boolean;
  statusPill?: string;
  coverHeight?: "sm" | "md" | "lg";
  coverFade?: boolean;
  socialPosition?: "top" | "bottom" | "hidden";
  socialStyle?: "pill" | "circle_outline" | "minimal";
  showShareButton?: boolean;
  surfaceStyle?: "solid" | "outline" | "soft" | "glass" | "elevated" | "hard_shadow";
  hoverEffect?: "none" | "lift" | "scale" | "glow" | "shine" | "hard_push";
  entranceAnimation?: "none" | "fade_up" | "scale_in" | "blur_in";
  highlightEffect?: "none" | "pulse_ring" | "wiggle" | "shimmer";
  linkLayout?:
    | "classic_bar"
    | "thumbnail_card"
    | "featured_hero"
    | "grid_2col"
    | "bento_grid"
    | "compact_pills";
  buttonTextAlign?: "left" | "center";
  layout?: "grid" | "list" | "links" | "carousel_featured";
  cardDensity?: "compact" | "standard" | "detailed";
  imageAspectRatio?: "1:1" | "4:3" | "16:9" | "4:5";
  ctaStyle?: "full_button" | "icon_circle" | "inline_arrow";
  showSearch?: boolean;
  showPrice?: boolean;
  showImage?: boolean;
  showDiscountBadge?: boolean;
  showPlatformBadge?: boolean;
  stickyFilterBar?: boolean;
  qrCardStyle?: "fintech_glass" | "split_modern" | "minimal_card";
  presetButtonStyle?: "gift_cards" | "pill_tags" | "compact_grid";
  leaderboardStyle?: "podium" | "list" | "hidden";
  fontFamily?: "inter" | "plus_jakarta" | "be_vietnam" | "playfair" | "jetbrains_mono";
  containerWidth?: "compact" | "standard" | "wide";
  blockSpacing?: "compact" | "normal" | "relaxed";
  footerStyle?: "minimal" | "pill" | "hidden";
};

/** Cấu hình responsive theo thiết bị. */
export type PageResponsiveConfig = {
  desktopColumns?: number;
  tabletColumns?: number;
  mobileColumns?: number;
  hideDescriptionOnMobile?: boolean;
};

/** Kết quả đọc metadata từ website. */
export type PageMetadataResult = {
  title: string;
  description: string;
  imageUrl: string | null;
  platform: string;
  siteName: string;
  price: number | null;
  currency: string | null;
  canonicalUrl: string;
  destinationUrl: string;
};

/** Một dòng danh sách trang. */
export type Page = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  pageType: PageType;
  templateKey: string;
  path: { id: string; segment: string; name: string };
  publicUrl: string;
  owner: { id: string; email: string; username: string | null; fullName: string };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết cho editor. */
export type PageDetail = Page & {
  description: string;
  seoTitle: string;
  seoDescription: string;
  theme: PageTheme;
  templateVersion: number;
  contentConfig: Record<string, unknown>;
  styleConfig: PageStyleConfig;
  responsiveConfig: PageResponsiveConfig;
  avatar: AttachmentSummary | null;
  cover: AttachmentSummary | null;
  backgroundImage: AttachmentSummary | null;
  content: TiptapDocument;
  contentVersion: number;
};

export type PageFilters = ListParams & {
  status?: PageStatus[];
  pageType?: PageType[];
  path?: string[];
  owner?: string[];
};

export type PageInput = {
  pathId: string;
  title: string;
  slug?: string;
  description?: string;
  status?: PageStatus;
  pageType?: PageType;
  templateKey?: string;
  templateVersion?: number;
  contentConfig?: Record<string, unknown>;
  styleConfig?: PageStyleConfig;
  responsiveConfig?: PageResponsiveConfig;
  seoTitle?: string;
  seoDescription?: string;
  theme?: PageTheme;
  avatarId?: string | null;
  coverId?: string | null;
  backgroundImageId?: string | null;
  content?: TiptapDocument;
  contentVersion?: number;
  template?: PageTemplate;
};

/** Trang công khai (BE `PagePublicResponseSerializer`). */
export type PublicPage = {
  id?: string;
  segment: string;
  slug: string;
  status: PageStatus;
  preview: boolean;
  title: string;
  description: string;
  canonicalUrl: string;
  seoTitle: string;
  seoDescription: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  backgroundImageUrl?: string | null;
  theme: PageTheme;
  pageType: PageType;
  templateKey: string;
  templateVersion: number;
  contentConfig: Record<string, unknown>;
  styleConfig: PageStyleConfig;
  responsiveConfig: PageResponsiveConfig;
  content: TiptapDocument;
};
