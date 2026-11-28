# Kế hoạch Tối ưu Giao diện, Hiệu ứng & Tùy biến Hiển thị Custom Page

Trạng thái: **Đã chốt — sẵn sàng triển khai (ĐẠT sau review-plan)** | Ngày lập: `2026-11-28`  
Cơ sở đối chiếu: `SYSTEM_CONTEXT.md`, `docs/rules/common.md`, `docs/rules/backend.md`, `docs/rules/frontend.md`, `docs/common-catalog.md`, `docs/architecture/infrastructure.md`, `docs/modules/utilities/README.md`, `docs/features/attachment-visibility.md`.

Mục lục:
1. Phân tích đối chiếu đa nền tảng & mục tiêu, phạm vi
2. Quyết định cần chốt & dependency
3. Hiện trạng codebase & thành phần tái sử dụng
4. Ngân sách hạ tầng Free-tier
5. Kiến trúc Backend & mô hình dữ liệu (`style_config` & `background_image`)
6. Phân quyền, bảo mật, bí mật & tệp đính kèm
7. Hợp đồng API & thông báo
8. Kiến trúc Frontend, Hệ thống Hiệu ứng, UI/UX & i18n
9. Xử lý biên, lỗi & fallback
10. Kế hoạch kiểm thử (BE, FE, E2E, giao diện thật)
11. Lộ trình từng giai đoạn & cập nhật tài liệu

---

## 1. Phân tích đối chiếu đa nền tảng & mục tiêu, phạm vi

### 1.1 Đối chiếu tinh hoa từ các nền tảng Link-in-Bio / Creator Storefront hàng đầu

| Nền tảng tham chiếu | Điểm mạnh nổi bật về hiển thị & tương tác | Phương án tích hợp vào ToanNX Custom Page |
| --- | --- | --- |
| **Beacons.ai** (`beacons.ai/suunguyen`) | Nền ảnh/gradient toàn trang có blur/overlay; glassmorphism card; nhiều kiểu block (link ngang, card thumbnail, featured 16:9, grid 2 cột); header ảnh bìa hòa tan vào nền (`fadeBottom`); hàng icon MXH gọn dưới bio. | `PageBackgroundLayer` (solid/gradient/image/pattern + blur + overlay + animated aura), `surface_style="glass"`, `header_layout="banner_overlap"`, `link_layout` đa dạng + override từng link. |
| **Bento.me** | Bố cục **Bento Grid** không đối xứng (thẻ vuông 1x1, thẻ ngang 2x1, thẻ lớn 2x2), viền bo lớn, hiệu ứng hover nổi khối + icon/preview sinh động. | Bổ sung `link_layout="bento_grid"` và kích thước từng block (`blockSize: "sm" \| "md" \| "lg"` cho Bio Links / Projects). |
| **Linktree** | Đa dạng hiệu ứng thu hút click cho link quan trọng (wiggle, pulse), chất liệu nút **Hard Shadow** (Neo-brutalism) và **Outline**, nút Chia sẻ trang ở góc trên. | `hover_effect` (`lift`, `scale`, `glow`, `shine`, `hard_push`), `highlight_effect` (`pulse`, `wiggle`, `shimmer`), nút `show_share_button`. |
| **Stan.store / Gumroad / ShopMy** (cho `AFFILIATE`) | Thẻ sản phẩm có tỷ lệ ảnh linh hoạt (1:1, 4:3, 16:9), tag `% giảm giá`, thanh cuộn ngang sản phẩm nổi bật (`carousel`), nút CTA rõ ràng, header thương hiệu gọn nhẹ. | Bổ sung `image_aspect_ratio`, `card_density` (`compact`/`standard`/`detailed`), `show_discount_badge`, `cta_style`, `featured_carousel` cho `AffiliatePageRenderer`. |
| **BuyMeACoffee / Ko-fi** (cho `DONATION`) | Thẻ chọn quà tặng trực quan, khối QR kính mờ/Fintech, bảng vinh danh Top 3 bục huy chương gọn gàng. | `qr_card_style` (`fintech_glass`, `split_modern`, `minimal_card`), `leaderboard_style` (`podium`, `list`, `hidden`), áp dụng `PageBackgroundLayer` & `hover_effect`. |

### 1.2 Mục tiêu, phạm vi & ngoài phạm vi
- **Mục tiêu nghiệp vụ**: Biến Custom Page thành bộ tạo trang công khai linh hoạt với **5 lớp tùy biến có cấu trúc**:
  1. **Nền & Môi trường (Background & Ambient)**: Solid, Gradient (2–3 màu, linear/radial, góc nghiêng), Ảnh nền toàn trang (fit, blur, overlay), Pattern CSS (dots, grid, diagonal, mesh, aura), và hiệu ứng chuyển động nền nhẹ (`ambientMotion`: none / gradient_flow / floating_orbs).
  2. **Đầu trang & Thương hiệu (Header & Profile)**: 4 layout đầu trang, hình dạng/cỡ Avatar, viền Avatar (none / ring / gradient_glow), Status Pill (nhãn trạng thái ngắn như "Đang nhận booking"), chiều cao & hiệu ứng mờ đáy Cover, vị trí & kiểu Social Bar, nút Chia sẻ trang.
  3. **Bề mặt & Hiệu ứng Thẻ/Nút (Surface & Animations)**:
     - Chất liệu bề mặt (`surface_style`): `solid`, `outline`, `soft`, `glass`, `elevated`, `hard_shadow`.
     - **Hiệu ứng khi Hover Card/Link (`hover_effect`)**: `none`, `lift` (nâng lên + bóng), `scale` (phóng nhẹ), `glow` (viền/bóng phát sáng màu nhấn), `shine` (vệt sáng lướt chéo), `hard_push` (nhấn lún kiểu Neo-brutalism).
     - **Hiệu ứng xuất hiện (`entrance_animation`)**: `none`, `fade_up` (trượt lên tuần tự), `scale_in`, `blur_in` (luôn tôn trọng `@media (prefers-reduced-motion: reduce)`).
     - **Hiệu ứng thu hút cho mục nổi bật (`highlight_effect`)**: `none`, `pulse_ring`, `wiggle`, `shimmer`.
  4. **Kiểu hiển thị Nội dung theo từng loại trang**:
     - `BIO`: `classic_bar`, `thumbnail_card`, `featured_hero`, `grid_2col`, `bento_grid`, `compact_pills`. Cho phép chỉnh riêng từng link (`displayStyle`, `blockSize`, `thumbnailUrl`, `badgeText`).
     - `AFFILIATE`: `grid`, `list`, `links`, `carousel_featured` + tỷ lệ ảnh, mật độ thẻ, badge giảm giá, kiểu CTA.
     - `DONATION`: `fintech_glass`, `split_modern`, `minimal_card` + đồng bộ nền/hiệu ứng hover cho nút mốc ủng hộ & thẻ QR.
  5. **Typography & Khung hiển thị**: 5 font tiếng Việt (`next/font/google`), độ rộng khung (`compact` / `standard` / `wide`), khoảng cách khối (`compact` / `normal` / `relaxed`), kiểu chân trang (`minimal` / `pill` / `hidden`).
- **Ngoài phạm vi (Non-goals)**:
  - Không cho nhập CSS/JS/HTML tùy ý (`customCss`, `<style>`).
  - Không hỗ trợ video nền (`mp4`/`webm`) để bảo vệ băng thông gói free R2 (10 GB) và hiệu năng di động.
  - Không áp dụng cho `LEGACY_PAGE` (trang soạn thảo Tiptap tự do giữ nguyên thiết kế hiện tại).

---

## 2. Quyết định cần chốt & dependency

### 2.1 Quyết định kiến trúc (`D1`, `D2`, `D3`)

| Mã | Chủ đề | Các phương án | Đề xuất & lý do | Trạng thái |
| --- | --- | --- | --- | --- |
| D1 | Lưu trữ ảnh nền toàn trang (`background_image`) | **A**: Thêm `background_image` FK (`system.Attachment`, `null=True, blank=True, on_delete=SET_NULL`) trên model `Page` giống `avatar` và `cover`.<br>**B**: Chỉ lưu `backgroundImageId` + `backgroundImageUrl` bên trong JSON `style_config`. | **Đề xuất A**: Khớp 100% cơ chế `avatar`/`cover` hiện có trên `Page`, kiểm tra `visibility="public"` ở BE, tự sạch khi xóa attachment. | Đã chốt (Phương án A) |
| D2 | Tải phông chữ tùy chọn (`font_family`) | **A**: Nạp sẵn 5 font hỗ trợ tiếng Việt qua `next/font/google` (`Inter`, `Plus Jakarta Sans`, `Be Vietnam Pro`, `Playfair Display`, `JetBrains Mono`) gắn CSS variables trên root trang công khai.<br>**B**: Tải động Google Fonts qua `<link>` runtime. | **Đề xuất A**: 0 request CDN ngoài lúc runtime, không CLS, hỗ trợ dấu tiếng Việt chuẩn. | Đã chốt (Phương án A) |
| D3 | Nơi lưu toàn bộ option giao diện & hiệu ứng | **A**: Giữ `theme` cho 5 token lõi (`mode`, `primary_color`, `background_color`, `text_color`, `button_style`) để tương thích ngược; lưu toàn bộ token mới vào `style_config` kèm `validate_style_config`.<br>**B**: Đưa tất cả vào `theme`. | **Đề xuất A**: Giữ nguyên contract cũ của `theme` và bộ test API hiện có, dùng đúng vai trò của `style_config` trên `Page`. | Đã chốt (Phương án A) |

### 2.2 Dependency mới
- **Không cần thêm dependency mới** ở cả Backend (`pyproject.toml`) và Frontend (`package.json`). Toàn bộ hiệu ứng hover (`shine`, `glow`, `lift`, `hard_push`), chuyển động xuất hiện (`fade_up`, `scale_in`, `blur_in`), `ambientMotion`, glassmorphism và pattern đều viết bằng CSS keyframes/utilities trong `globals.css` + Tailwind v4.

---

## 3. Hiện trạng codebase & thành phần tái sử dụng

- **Code hiện tại đã kiểm chứng**:
  - Backend: `backend/app/utilities/models/page.py`, `validators/theme_validator.py`, `services/page_service.py`, `services/page_seed_service.py`, `serializers/validates/page_*_validate_serializer.py`, `serializers/responses/page_*_response_serializer.py`.
  - Frontend: `frontend/src/modules/utilities/constants/page-theme-presets.ts`, `lib/page-theme.ts`, `hooks/use-resolved-page-theme.ts`, `components/page/page-theme-editor.tsx`, `page-bio-editor.tsx`, `bio-page-renderer.tsx`, `affiliate-page-renderer.tsx`, `donation-page-renderer.tsx`, `page-form.tsx`, `page-preview-frame.tsx`.
- **Common dùng lại (`docs/common-catalog.md`)**:
  - `CoreModel`, `JournalTracker`, `CoreCrudService`, `CoreModelViewSet`, `CacheService`.
  - `FormSection`, `FormField`, `SelectField`, `ColorInput`, `RadioGroupField`, `AttachmentImageUploadView`, `SortableList`, `AppTooltip`, `Badge`, `Button`, `Tabs`.

---

## 4. Ngân sách hạ tầng Free-tier (`docs/architecture/infrastructure.md`)

| Dịch vụ | Tác động ước lượng | Cơ chế kiểm soát / fallback |
| --- | --- | --- |
| Neon Free (1 GB, 100 CU-h/tháng) | Thêm 1 cột `background_image_id` (UUID nullable); `style_config` tăng ~0.8 KB/bản ghi. | Trang công khai đã xuất bản tiếp tục đi qua Redis cache `utilities:public` (TTL 10 phút), không đánh thức Neon cho lượt khách lặp lại. |
| Vercel Hobby (4h Active CPU/tháng) | Không tăng CPU server; toàn bộ animation/gradient/glass chạy bằng GPU CSS ở trình duyệt khách. | Không dùng thư viện animation JS nặng (Framer Motion, GSAP...). |
| Upstash Redis (500k lệnh/tháng) | Không tăng số lệnh Redis; dùng chung cache key trang công khai hiện tại. | Redis lỗi tự fallback PostgreSQL. |
| Cloudflare R2 (10 GB) | Người dùng upload thêm ảnh nền `public` (tái sử dụng quota Attachment hiện tại). | Dùng `<Image unoptimized />` để không tốn Next.js Image Optimization. |

---

## 5. Kiến trúc Backend & mô hình dữ liệu (`backend/app/utilities/`)

### 5.1 Model `Page` (`models/page.py`)
- Bổ sung 1 trường nullable FK:
  - `background_image`: `ForeignKey("system.Attachment", null=True, blank=True, on_delete=SET_NULL, related_name="+", verbose_name="Ảnh nền trang", help_text="Ảnh nền toàn trang (Thư viện công khai).", db_comment="Ảnh nền trang")`.

### 5.2 Schema `style_config` & Validator (`backend/app/utilities/validators/style_config_validator.py`)
Tạo file riêng `style_config_validator.py` (1 đơn vị/file) với hàm `validate_style_config(value: Any) -> dict[str, Any]` **chuẩn hóa mọi key đầu vào sang `snake_case`** (từ `camelCase` nếu có) và whitelist toàn bộ các nhóm cấu hình sau (bao gồm đầy đủ tập key cũ đang dùng trong `PageSeedService` / `page.schema.ts` để tương thích ngược):

0. **Nhóm Tương thích ngược (`theme_preset`, màu lõi cũ)**:
   - `theme_preset`: `str` tối đa 64 ký tự (`[a-z0-9_-]`)
   - `primary_color`, `background_color`, `text_color`: `#RRGGBB` (tùy chọn)

1. **Nhóm Nền & Môi trường (`background_*`)**:
   - `background_type`: `"solid" | "gradient" | "image" | "pattern"`
   - `gradient_type`: `"linear" | "radial"`
   - `gradient_angle`: `int` trong `[0, 360]`
   - `gradient_colors`: danh sách 2–3 mã màu `#RRGGBB`
   - `pattern_key`: `"dots" | "grid" | "mesh" | "diagonal" | "aura"`
   - `background_fit`: `"cover" | "contain" | "tile"`
   - `background_blur`: `int` trong `[0, 24]` (px)
   - `overlay_color`: `#RRGGBB`
   - `overlay_opacity`: `int` trong `[0, 85]` (%)
   - `ambient_motion`: `"none" | "gradient_flow" | "floating_orbs"`
2. **Nhóm Đầu trang & Thương hiệu (`header_*`, `avatar_*`, `cover_*`, `social_*`)**:
   - `header_layout`: `"centered" | "banner_overlap" | "hero_card" | "editorial_left"`
   - `avatar_shape`: `"circle" | "squircle" | "square"`
   - `avatar_size`: `"sm" | "md" | "lg"`
   - `avatar_ring`: `"none" | "solid" | "gradient_glow"`
   - `show_verified_badge`: `bool`
   - `status_pill`: `str` tối đa 60 ký tự (ví dụ `"Đang nhận booking"`, để trống để ẩn)
   - `cover_height`: `"sm" | "md" | "lg"`
   - `cover_fade`: `bool`
   - `social_position`: `"top" | "bottom" | "hidden"`
   - `social_style`: `"pill" | "circle_outline" | "minimal"`
   - `show_share_button`: `bool`
3. **Nhóm Bề mặt, Thẻ & Hiệu ứng (`surface_*`, `hover_*`, `entrance_*`, `highlight_*`)**:
   - `surface_style`: `"solid" | "outline" | "soft" | "glass" | "elevated" | "hard_shadow"`
   - `card_radius`: `"0px" | "4px" | "12px" | "20px"`
   - `card_shadow`: `"none" | "sm" | "md" | "lg"`
   - `hover_effect`: `"none" | "lift" | "scale" | "glow" | "shine" | "hard_push"`
   - `entrance_animation`: `"none" | "fade_up" | "scale_in" | "blur_in"`
   - `highlight_effect`: `"none" | "pulse_ring" | "wiggle" | "shimmer"`
4. **Nhóm Hiển thị theo loại trang (`link_*`, `layout`, `card_*`, `qr_*`, `leaderboard_*`)**:
   - **Bio**: `link_layout` (`"classic_bar" | "thumbnail_card" | "featured_hero" | "grid_2col" | "bento_grid" | "compact_pills"`), `button_text_align` (`"left" | "center"`).
   - **Affiliate**: `layout` (`"grid" | "list" | "links" | "carousel_featured"`), `card_density` (`"compact" | "standard" | "detailed"`), `image_aspect_ratio` (`"1:1" | "4:3" | "16:9" | "4:5"`), `cta_style` (`"full_button" | "icon_circle" | "inline_arrow"`), `show_search` (`bool`), `show_price` (`bool`), `show_image` (`bool`), `show_discount_badge` (`bool`), `show_platform_badge` (`bool`), `sticky_filter_bar` (`bool`).
   - **Donation**: `qr_card_style` (`"fintech_glass" | "split_modern" | "minimal_card"`), `preset_button_style` (`"gift_cards" | "pill_tags" | "compact_grid"`), `leaderboard_style` (`"podium" | "list" | "hidden"`).
5. **Nhóm Typography & Khung (`font_*`, `container_*`, `block_*`, `footer_*`)**:
   - `font_family`: `"inter" | "plus_jakarta" | "be_vietnam" | "playfair" | "jetbrains_mono"`
   - `container_width`: `"compact" | "standard" | "wide"`
   - `block_spacing`: `"compact" | "normal" | "relaxed"`
   - `footer_style`: `"minimal" | "pill" | "hidden"`

### 5.3 Service, Repository & Migration
- `PageRepository.get_queryset()`: bổ sung `"background_image"` vào `select_related("path", "owner", "avatar", "cover", "background_image")` để không phát sinh N+1 query ở danh sách/chi tiết/trang công khai.
- `PageService`: tách kiểm tra bắt buộc `visibility == Attachment.Visibility.PUBLIC` cho `background_image_id` (không dùng chung nhánh cho phép file `private` của `_owned_image`, trả `400 ValidationError` nếu ảnh là `private`, và kiểm tra quyền sở hữu / `manage_all` nếu không phải ảnh `public` dùng chung); gọi `validate_style_config` khi `create`/`update`/`duplicate`; trả `background_image_url` trong `to_public_payload` và serializer.
- Migration `00xx_page_background_image.py`: chỉ `AddField` nullable `background_image`.

---

## 6. Phân quyền, bảo mật, bí mật & tệp đính kèm

- **Quyền**: giữ nguyên `PagePermission` (`read`, `create`, `update`, `delete`, `manage_all`), chủ trang chỉ sửa trang của mình (`404` nếu truy cập trang người khác khi thiếu `manage_all`).
- **Tệp đính kèm**: `background_image` bắt buộc `visibility="public"` (`400 ValidationError` nếu gửi file `private`).
- **Chống XSS / CSS Injection**: mọi giá trị màu kiểm regex `#RRGGBB`, mọi chuỗi text (`status_pill`) chỉ tối đa 60 ký tự và render bằng React JSX text node (tự escape), không nhận CSS thô.

---

## 7. Hợp đồng API & thông báo

- Mở rộng `PageCreateValidateSerializer`, `PageUpdateValidateSerializer`, `PageDetailResponseSerializer`, `PagePublicResponseSerializer` với `background_image_id` / `background_image` / `background_image_url`.
- Chạy `uv run manage.py spectacular --validate --fail-on-warn` và `pnpm api:types` để sinh lại `api-schema.gen.ts`.

---

## 8. Kiến trúc Frontend, Hệ thống Hiệu ứng, UI/UX & i18n

### 8.1 CSS Keyframes & Micro-interactions trong `frontend/src/app/globals.css`
Định nghĩa tập utility class chuẩn cho Custom Page (kèm `@media (prefers-reduced-motion: reduce)` tắt toàn bộ animation để đảm bảo Accessibility). **Lưu ý quy ước token màu (`theme-tokens.test.ts`)**: mọi class `bg-*`/`text-*`/`border-*` trong `.tsx` (kể cả hiệu ứng `glass`) chỉ sử dụng token đã khai báo `--color-*` trong `globals.css` (`bg-card/80`, `border-border/80`, `bg-background/90`), không tự đặt class màu ngoài bảng token (như `bg-glass`).
- **Hover Card Animations**:
  - `.page-hover-lift`: `transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg`
  - `.page-hover-scale`: `transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]`
  - `.page-hover-glow`: `transition-shadow duration-250 hover:shadow-[0_0_24px_-4px_var(--primary)] hover:border-primary/60`
  - `.page-hover-shine`: vệt sáng chéo `linear-gradient` lướt qua bề mặt thẻ bằng pseudo-element `::after` khi `:hover` (rất hợp `glass` & `solid`).
  - `.page-hover-hard_push`: `transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none` (kết hợp `surface_style="hard_shadow"` tạo cảm giác bấm phím cơ cực đã).
- **Entrance Animations**:
  - `.page-enter-fade_up`, `.page-enter-scale_in`, `.page-enter-blur_in` với biến `--enter-delay` (`calc(index * 45ms)`, tối đa `450ms`) để các thẻ xuất hiện lần lượt mượt mà khi mở trang.
- **Highlight Effects** (áp dụng cho thẻ đánh dấu nổi bật `highlight` / `isFeatured`):
  - `.page-highlight-wiggle`: rung nhẹ thu hút sự chú ý mỗi 4 giây.
  - `.page-highlight-pulse_ring`: viền sáng nhịp thở quanh thẻ.
  - `.page-highlight-shimmer`: ánh sáng chạy nhẹ liên tục trên viền/nền thẻ.
- **Ambient Background Motion**:
  - `.page-ambient-gradient_flow`: dịch chuyển nhẹ `background-position` cho nền gradient.
  - `.page-ambient-floating_orbs`: 2–3 khối ánh sáng mờ (`blur-3xl`) trôi chậm tạo chiều sâu kiểu Beacons.

### 8.2 Phông chữ & Token Preset
- Nạp thêm 4 Google Fonts tiếng Việt trong `frontend/src/app/[locale]/layout.tsx`: `Plus_Jakarta_Sans`, `Be_Vietnam_Pro`, `Playfair_Display`, `JetBrains_Mono`.
- Bổ sung nhóm Preset nâng cao trong `page-theme-presets.ts`: *Aurora Glass* (nền gradient tối + kính mờ + hover shine), *Sunset Creator* (gradient cam hồng + thumbnail card + hover lift), *Neo Brutalism* (nền kem + viền đậm + `hard_shadow` + `hard_push`), *Minimal Editorial* (serif Playfair + `editorial_left` + `outline`), *Neon Cyber* (nền tối aura + `hover_glow` + `JetBrains Mono`).

### 8.3 Phân tách Component Biên tập & Hiển thị (`modules/utilities/components/page/`)
Mỗi component/hook một file riêng:
- **Biên tập (trong tab Giao diện của `PageForm`)**:
  - Cập nhật `page.schema.ts` (`pageSchema`, `PAGE_FORM_DEFAULTS`, `fromPage`, `toPageInput`) thêm trường `backgroundImage: { id, url, name } | null` (map sang `backgroundImageId` khi gửi lên BE) và cập nhật `use-page-form.ts` truyền `backgroundImageUrl` vào dữ liệu Live Preview để `PagePreviewFrame` hiển thị ảnh nền tức thì trước khi bấm Lưu.
  - `PageThemeEditor` nhận thêm `pageType` để chỉ hiển thị đúng nhóm option hiển thị của loại trang đang sửa (`BIO` vs `AFFILIATE` vs `DONATION`), dùng sub-tabs gọn gồm 5 khu vực:
    1. `PageThemePresetSection`: bộ preset có thumbnail mini mô phỏng nền + chất liệu thẻ.
    2. `PageBackgroundEditor`: chọn loại nền (`solid` / `gradient` / `image` / `pattern`), chọn/upload ảnh nền `public`, thanh trượt Blur (`0–24px`) & Overlay (`0–85%`), chọn `ambientMotion`.
    3. `PageHeaderStyleEditor`: chọn `headerLayout` (có sơ đồ SVG/wireframe mini minh họa từng layout), Avatar shape/size/ring, `statusPill`, Cover height/fade, Social position/style, bật/tắt nút Share.
    4. `PageBlockStyleEditor`: chọn `surfaceStyle` (kèm ô xem thử trực tiếp), `hoverEffect` (hover trực tiếp vào ô mẫu để thấy animation ngay), `entranceAnimation`, `highlightEffect`, `linkLayout` (hoặc `layout` / `cardDensity` / `imageAspectRatio` / `ctaStyle` tùy theo `pageType`).
    5. `PageTypographyLayoutEditor`: chọn `fontFamily`, `containerWidth`, `blockSpacing`, `footerStyle`.
  - Mở rộng `PageBioEditor`: thêm cấu hình nâng cao thu gọn cho từng link (`thumbnailUrl`, `displayStyle`: `default` | `featured` | `grid`, `blockSize`: `sm` | `md` | `lg`, `badgeText`).
- **Hiển thị công khai**:
  - `PageBackgroundLayer`: lớp nền toàn trang dùng chung cho `BioPageRenderer`, `AffiliatePageRenderer`, `DonationPageRenderer`.
  - `PageShareButton`: nút chia sẻ nhanh ở góc trên trang công khai (copy link + mở QR nhanh).
  - Nâng cấp `BioPageRenderer`, `AffiliatePageRenderer`, `DonationPageRenderer` sử dụng `resolvePageTheme` mới (trả thêm `surfaceClass`, `hoverClass`, `highlightClass`, `entranceClass`, `fontClass`, `containerClass`, `gapClass`).

### 8.4 i18n
- Bổ sung đầy đủ khóa dịch `vi.json` và `en.json` cho toàn bộ 5 nhóm option giao diện, hiệu ứng hover/entrance/highlight, header layout, và các tùy chọn hiển thị Affiliate/Donation.

---

## 9. Xử lý biên, lỗi & fallback

| Tình huống biên / lỗi | Hành vi xử lý BE & FE | Mã lỗi / Thông điệp |
| --- | --- | --- |
| Người dùng bật nhiều hiệu ứng trên thiết bị cài "Giảm chuyển động" | `@media (prefers-reduced-motion: reduce)` tự tắt `ambientMotion`, `wiggle`, `entranceAnimation`, giữ hover state tĩnh rõ ràng. | Không lỗi |
| Ảnh nền `background_image` bị xóa hoặc chọn ảnh `private` | BE chặn ảnh `private` (`400`); nếu ảnh `public` bị xóa sau này, FK `SET_NULL` và FE tự fallback về `backgroundColor` / gradient. | `400 ValidationError` |
| `surface_style="glass"` đặt trên nền trắng đơn sắc | `resolvePageTheme` tự áp `bg-card/80 border-border/80 backdrop-blur-md` để thẻ không hòa lẫn vào nền trắng. | Không lỗi |
| Trang cũ chưa có `style_config` mới | Mọi field đều fallback về giá trị mặc định hiện tại (`solid`, `centered`, `classic_bar`, `hover_effect="lift"`, `entrance_animation="none"`), không làm thay đổi trang đang chạy. | Tương thích ngược |

---

## 10. Kế hoạch kiểm thử

- **Backend (`backend/app/utilities/tests/`)**:
  - `test_style_config_validator.py`: test toàn bộ enum hợp lệ, boundary `gradient_angle`/`background_blur`/`overlay_opacity`, từ chối CSS/JS/key lạ.
  - Cập nhật `test_page_create_api.py`, `test_page_update_api.py`, `test_page_public_api.py`: kiểm `background_image_id` (public OK, private 400, khác owner 404) và `style_config`.
  - Chạy `test_endpoint_access.py`, `test_module_conventions.py`, `test_openapi_schema.py` trên PostgreSQL local `--reuse-db`.
- **Frontend (`frontend/tests/`)**:
  - `tests/unit/page-theme.test.ts`: test `resolvePageTheme` với mọi tổ hợp `backgroundType`, `surfaceStyle`, `hoverEffect`, `entranceAnimation`, `fontFamily`, `containerWidth`, fallback trang cũ.
  - Chạy bộ test quy ước (`one-unit-per-file`, `module-structure`, `messages`, `code-conventions`, `api-contract`).
  - Kiểm tra UI thật bằng `playwright-cli` trên Desktop & Mobile (375px), Light/Dark mode, hover thực tế lên card `glass`/`hard_shadow`/`shine`/`glow`, `bento_grid` và `carousel_featured`.

---

## 11. Lộ trình từng giai đoạn & cập nhật tài liệu

- **Phase 1 — Backend & OpenAPI**: Migration `background_image`, `style_config_validator.py`, `PageService`, serializers, test BE, `spectacular --validate --fail-on-warn` + `pnpm api:types`.
- **Phase 2 — Frontend Theme, Fonts & Animations**: Nạp 4 font trong `layout.tsx`, thêm animation/hover classes vào `globals.css`, mở rộng `page-theme.ts` & `page-theme-presets.ts`, tạo `PageBackgroundLayer` & `PageShareButton`.
- **Phase 3 — Frontend Renderers**: Cập nhật `BioPageRenderer` (6 `link_layout` + `bento_grid` + 4 `header_layout`), `AffiliatePageRenderer` (`carousel_featured`, tỷ lệ ảnh, mật độ thẻ, discount badge, CTA style), `DonationPageRenderer` (`qr_card_style`, `leaderboard_style`).
- **Phase 4 — Frontend Editor, i18n & Kiểm chứng**: Tách `PageThemeEditor` thành 5 section + interactive hover preview, mở rộng `PageBioEditor`, cập nhật `vi.json`/`en.json`, kiểm tra unit test + `playwright-cli` + cập nhật `docs/modules/utilities/README.md`.
