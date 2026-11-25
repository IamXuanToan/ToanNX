"""Service seed dữ liệu trang tùy chỉnh mẫu cho môi trường local/staging.

Tạo 5 trang đại diện cho 5 thể loại chính với đầy đủ thông tin ở mọi trường:
1. Tiếp thị liên kết (AFFILIATE) - Góc setup công nghệ
2. Liên kết cá nhân (BIO) - Creator Link-in-Bio
3. Hồ sơ năng lực (PORTFOLIO) - Portfolio Kỹ sư phần mềm
4. Ủng hộ / Quyên góp (DONATION) - Mời cafe VietQR
5. Trang bài viết (LEGACY_PAGE) - Giới thiệu hệ thống qua Tiptap Rich Text

Gán chủ sở hữu (owner) cho user chỉ định theo email.
"""

from django.utils import timezone

from app.core.constants.defaults import DEFAULT_CURRENCY_CODE
from app.system.repositories.user_repository import UserRepository
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath
from app.utilities.repositories.page_path_repository import PagePathRepository
from app.utilities.repositories.page_repository import PageRepository


class PageSeedService:
    """Seed dữ liệu trang tùy chỉnh đa dạng các thể loại với đầy đủ mọi trường."""

    def __init__(
        self,
        user_repository: UserRepository | None = None,
        page_repository: PageRepository | None = None,
        page_path_repository: PagePathRepository | None = None,
    ) -> None:
        """Khởi tạo service với các repository cần dùng."""
        self.user_repository = user_repository or UserRepository()
        self.page_repository = page_repository or PageRepository()
        self.page_path_repository = page_path_repository or PagePathRepository()

    def seed_sample_pages(self, email: str) -> list[str]:
        """Tạo hoặc cập nhật các trang mẫu với dữ liệu trọn vẹn nhất.

        Args:
            email: Email người dùng sở hữu trang.

        Returns:
            Danh sách thông điệp kết quả tạo trang.

        Raises:
            ValueError: Không tìm thấy người dùng sở hữu.
        """
        user = self.user_repository.find_by_email(email.strip().lower())
        if not user:
            raise ValueError(f"Không tìm thấy người dùng có email: {email}. Hãy chạy `seed_local` trước.")

        path, _ = PagePath.objects.get_or_create(
            segment="p",
            defaults={
                "name": "Trang",
                "description": "Đường dẫn trang tùy chỉnh mặc định",
                "is_active": True,
                "position": 0,
            },
        )

        now = timezone.now()

        # =========================================================================
        # 1. AFFILIATE STOREFRONT (tech-setup)
        # =========================================================================
        affiliate_content = {
            "avatarUrl": (
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "avatar_url": (
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "coverUrl": (
                "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "cover_url": (
                "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "profile": {
                "title": "Góc Setup Công Nghệ & Phụ Kiện Tinh Tuyển",
                "avatarUrl": (
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "avatar_url": (
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "coverUrl": (
                    "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "cover_url": (
                    "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "bio": (
                    "Tổng hợp các món đồ setup làm việc, bàn phím cơ custom, chuột công thái học "
                    "và phụ kiện công nghệ tuyển chọn kỹ lưỡng bởi Toàn NX."
                ),
            },
            "categories": [
                {
                    "id": "cat-all",
                    "name": "Tất cả",
                    "slug": "all",
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 0,
                    "sortOrder": 0,
                },
                {
                    "id": "cat-ban-phim",
                    "name": "Bàn phím cơ",
                    "slug": "ban-phim",
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 1,
                    "sortOrder": 1,
                },
                {
                    "id": "cat-chuot",
                    "name": "Chuột & Lót chuột",
                    "slug": "chuot",
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 2,
                    "sortOrder": 2,
                },
                {
                    "id": "cat-tai-nghe",
                    "name": "Tai nghe & Âm thanh",
                    "slug": "tai-nghe",
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 3,
                    "sortOrder": 3,
                },
                {
                    "id": "cat-decor",
                    "name": "Góc Setup & Decor",
                    "slug": "decor",
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 4,
                    "sortOrder": 4,
                },
            ],
            "items": [
                {
                    "id": "item-1",
                    "display_mode": "product",
                    "displayMode": "product",
                    "title": "Bàn phím cơ Rainy75 Pro - Bản Nhôm CNC 3 Mode",
                    "description": (
                        "Khung nhôm nguyên khối Anodized CNC, switch HMX Violet mượt mà, "
                        "kết nối 3 chế độ (Type-C / 2.4G / Bluetooth), pin 7000mAh."
                    ),
                    "category_id": "cat-ban-phim",
                    "categoryId": "cat-ban-phim",
                    "destination_url": "https://shopee.vn/rainy75-pro",
                    "destinationUrl": "https://shopee.vn/rainy75-pro",
                    "platform": "shopee",
                    "image_url": (
                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "price_config": {
                        "mode": "fixed",
                        "amount": 2350000,
                        "original_amount": 2690000,
                        "originalAmount": 2690000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "price_note": "Giảm 15% khi áp voucher",
                        "priceNote": "Giảm 15% khi áp voucher",
                    },
                    "priceConfig": {
                        "mode": "fixed",
                        "amount": 2350000,
                        "originalAmount": 2690000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "priceNote": "Giảm 15% khi áp voucher",
                    },
                    "button_config": {
                        "label": "Mua trên Shopee",
                        "open_in_new_tab": True,
                        "openInNewTab": True,
                    },
                    "buttonConfig": {
                        "label": "Mua trên Shopee",
                        "openInNewTab": True,
                    },
                    "badge": {"text": "Hot Deal", "tone": "hot"},
                    "is_featured": True,
                    "isFeatured": True,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 0,
                    "sortOrder": 0,
                },
                {
                    "id": "item-2",
                    "display_mode": "product",
                    "displayMode": "product",
                    "title": "Chuột không dây Logitech MX Master 3S - Công thái học",
                    "description": (
                        "Cảm biến 8K DPI Darkfield hoạt động trên mọi bề mặt kể cả kính, "
                        "cuộn vô cực MagSpeed siêu êm, nút bấm Silent Touch giảm 90% tiếng ồn."
                    ),
                    "category_id": "cat-chuot",
                    "categoryId": "cat-chuot",
                    "destination_url": "https://shopee.vn/logitech-mx-master-3s",
                    "destinationUrl": "https://shopee.vn/logitech-mx-master-3s",
                    "platform": "shopee",
                    "image_url": (
                        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "price_config": {
                        "mode": "fixed",
                        "amount": 1950000,
                        "original_amount": 2490000,
                        "originalAmount": 2490000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "price_note": "Chính hãng bảo hành 12T",
                        "priceNote": "Chính hãng bảo hành 12T",
                    },
                    "priceConfig": {
                        "mode": "fixed",
                        "amount": 1950000,
                        "originalAmount": 2490000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "priceNote": "Chính hãng bảo hành 12T",
                    },
                    "button_config": {
                        "label": "Xem tại Shopee",
                        "open_in_new_tab": True,
                        "openInNewTab": True,
                    },
                    "buttonConfig": {
                        "label": "Xem tại Shopee",
                        "openInNewTab": True,
                    },
                    "badge": {"text": "Khuyên dùng", "tone": "primary"},
                    "is_featured": True,
                    "isFeatured": True,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 1,
                    "sortOrder": 1,
                },
                {
                    "id": "item-3",
                    "display_mode": "product",
                    "displayMode": "product",
                    "title": "Tai nghe không dây Sony WH-1000XM5 Chống ồn đỉnh cao",
                    "description": (
                        "Bộ xử lý V1 + QN1 độc quyền chống ồn chủ động hàng đầu, driver 30mm màng carbon "
                        "cho âm thanh Hi-Res Audio sắc nét, thời lượng pin lên đến 30 giờ."
                    ),
                    "category_id": "cat-tai-nghe",
                    "categoryId": "cat-tai-nghe",
                    "destination_url": "https://lazada.vn/sony-wh-1000xm5",
                    "destinationUrl": "https://lazada.vn/sony-wh-1000xm5",
                    "platform": "lazada",
                    "image_url": (
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "price_config": {
                        "mode": "fixed",
                        "amount": 6790000,
                        "original_amount": 8490000,
                        "originalAmount": 8490000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "price_note": "Tặng kèm bao da cao cấp",
                        "priceNote": "Tặng kèm bao da cao cấp",
                    },
                    "priceConfig": {
                        "mode": "fixed",
                        "amount": 6790000,
                        "originalAmount": 8490000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "priceNote": "Tặng kèm bao da cao cấp",
                    },
                    "button_config": {
                        "label": "Mua ngay Lazada",
                        "open_in_new_tab": True,
                        "openInNewTab": True,
                    },
                    "buttonConfig": {
                        "label": "Mua ngay Lazada",
                        "openInNewTab": True,
                    },
                    "badge": {"text": "Sale 20%", "tone": "sale"},
                    "is_featured": False,
                    "isFeatured": False,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 2,
                    "sortOrder": 2,
                },
                {
                    "id": "item-4",
                    "display_mode": "product",
                    "displayMode": "product",
                    "title": "Đèn treo màn hình chống mỏi mắt Baseus i-Wok 3",
                    "description": (
                        "Ánh sáng bất đối xứng không gây lóa màn hình, chỉ số hoàn màu Ra95 trung thực, "
                        "núm vặn điều khiển cảm ứng vô cấp nhiệt độ màu từ 2800K đến 5500K."
                    ),
                    "category_id": "cat-decor",
                    "categoryId": "cat-decor",
                    "destination_url": "https://tiktok.com/@toannx/baseus-screenbar",
                    "destinationUrl": "https://tiktok.com/@toannx/baseus-screenbar",
                    "platform": "tiktok",
                    "image_url": (
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "price_config": {
                        "mode": "fixed",
                        "amount": 450000,
                        "original_amount": 590000,
                        "originalAmount": 590000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "price_note": "Freeship toàn quốc",
                        "priceNote": "Freeship toàn quốc",
                    },
                    "priceConfig": {
                        "mode": "fixed",
                        "amount": 450000,
                        "originalAmount": 590000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "priceNote": "Freeship toàn quốc",
                    },
                    "button_config": {
                        "label": "Xem trên TikTok Shop",
                        "open_in_new_tab": True,
                        "openInNewTab": True,
                    },
                    "buttonConfig": {
                        "label": "Xem trên TikTok Shop",
                        "openInNewTab": True,
                    },
                    "badge": {"text": "Bán chạy", "tone": "neutral"},
                    "is_featured": False,
                    "isFeatured": False,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 3,
                    "sortOrder": 3,
                },
                {
                    "id": "item-5",
                    "display_mode": "product",
                    "displayMode": "product",
                    "title": "Màn hình Dell UltraSharp U2724D 27 inch 2K 120Hz IPS Black",
                    "description": (
                        "Tấm nền IPS Black tương phản 2000:1, chuẩn 98% DCI-P3, tần số quét 120Hz, "
                        "tích hợp cảm biến ánh sáng tự điều chỉnh độ sáng bảo vệ mắt."
                    ),
                    "category_id": "cat-decor",
                    "categoryId": "cat-decor",
                    "destination_url": "https://tiki.vn/dell-u2724d",
                    "destinationUrl": "https://tiki.vn/dell-u2724d",
                    "platform": "tiki",
                    "image_url": (
                        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "price_config": {
                        "mode": "fixed",
                        "amount": 9890000,
                        "original_amount": 10990000,
                        "originalAmount": 10990000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "price_note": "Bảo hành 36 tháng Dell VN",
                        "priceNote": "Bảo hành 36 tháng Dell VN",
                    },
                    "priceConfig": {
                        "mode": "fixed",
                        "amount": 9890000,
                        "originalAmount": 10990000,
                        "currency": DEFAULT_CURRENCY_CODE,
                        "priceNote": "Bảo hành 36 tháng Dell VN",
                    },
                    "button_config": {
                        "label": "Mua tại Tiki",
                        "open_in_new_tab": True,
                        "openInNewTab": True,
                    },
                    "buttonConfig": {
                        "label": "Mua tại Tiki",
                        "openInNewTab": True,
                    },
                    "badge": {"text": "Cao cấp", "tone": "primary"},
                    "is_featured": False,
                    "isFeatured": False,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 4,
                    "sortOrder": 4,
                },
            ],
        }

        page_affiliate, _ = Page.objects.update_or_create(
            path=path,
            slug="tech-setup",
            defaults={
                "owner": user,
                "title": "Góc Setup Công Nghệ & Phụ Kiện Decor Tuyển Chọn",
                "description": (
                    "Tổng hợp góc setup làm việc, bàn phím cơ custom, chuột công thái học và "
                    "phụ kiện decor cao cấp được tuyển chọn kỹ lưỡng bởi Toàn NX."
                ),
                "seo_title": "Góc Setup Công Nghệ & Phụ Kiện Decor Tuyển Chọn | Toàn NX",
                "seo_description": (
                    "Khám phá không gian làm việc chuyên nghiệp, danh sách bàn phím cơ, màn hình "
                    "và phụ kiện công nghệ tuyển chọn giá tốt kèm mã giảm giá độc quyền."
                ),
                "status": Page.Status.PUBLISHED,
                "page_type": Page.PageType.AFFILIATE,
                "template_key": "product_grid",
                "content_config": affiliate_content,
                "style_config": {
                    "theme_preset": "forest_green",
                    "primary_color": "#16a34a",
                    "background_color": "#f8fafc",
                    "text_color": "#0f172a",
                    "card_radius": "12px",
                    "layout": "grid",
                    "show_search": True,
                    "show_price": True,
                    "show_image": True,
                },
                "responsive_config": {
                    "desktop_columns": 4,
                    "tablet_columns": 3,
                    "mobile_columns": 2,
                    "hide_description_on_mobile": False,
                },
                "theme": {
                    "mode": "light",
                    "primary_color": "#16a34a",
                    "background_color": "#f8fafc",
                    "text_color": "#0f172a",
                    "button_style": "rounded",
                },
                "published_at": now,
            },
        )

        # =========================================================================
        # 2. BIO LINK-IN-BIO (toannx-bio)
        # =========================================================================
        bio_content = {
            "avatarUrl": (
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "avatar_url": (
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "coverUrl": (
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "cover_url": (
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "profile": {
                "displayName": "Nguyễn Xuân Toàn",
                "display_name": "Nguyễn Xuân Toàn",
                "headline": "Senior Full-Stack Engineer & Tech Creator",
                "bioText": (
                    "Đam mê kiến tạo sản phẩm phần mềm tinh gọn, tốc độ cao. "
                    "Chia sẻ kinh nghiệm thực chiến về Next.js 16, Django 6, TypeScript và tối ưu hệ thống."
                ),
                "bio_text": (
                    "Đam mê kiến tạo sản phẩm phần mềm tinh gọn, tốc độ cao. "
                    "Chia sẻ kinh nghiệm thực chiến về Next.js 16, Django 6, TypeScript và tối ưu hệ thống."
                ),
                "avatarUrl": (
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "avatar_url": (
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "coverUrl": (
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "cover_url": (
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "location": "Hà Nội, Việt Nam",
                "email": "nxtoan2k4@gmail.com",
                "website": "https://toannx.com",
                "socials": [
                    {"platform": "github", "url": "https://github.com/nxtoan2k4"},
                    {"platform": "youtube", "url": "https://youtube.com/@toannx"},
                    {"platform": "telegram", "url": "https://t.me/toannx"},
                ],
            },
            # Flat attributes cho renderer tương thích ngược
            "headline": "Senior Full-Stack Engineer & Tech Creator",
            "bio_text": (
                "Đam mê kiến tạo sản phẩm phần mềm tinh gọn, tốc độ cao. "
                "Chia sẻ kinh nghiệm thực chiến về Next.js 16, Django 6, TypeScript và tối ưu hệ thống."
            ),
            "experiences": [
                {
                    "id": "exp-1",
                    "company": "ToanNX Tech Studio",
                    "role": "Lead Architect & Founder",
                    "period": "2023 - Nay",
                    "description": (
                        "Xây dựng và phát triển nền tảng Monorepo toannx.com với Next.js 16, Django 6, "
                        "hệ thống tự động hoá và cổng thanh toán VietQR tự động."
                    ),
                },
                {
                    "id": "exp-2",
                    "company": "VNG Corporation",
                    "role": "Senior Software Engineer",
                    "period": "2021 - 2023",
                    "description": (
                        "Tối ưu hóa hệ thống phân tán chịu tải cao, thiết kế kiến trúc Microservices "
                        "và pipeline CI/CD tự động."
                    ),
                },
                {
                    "id": "exp-3",
                    "company": "FPT Software",
                    "role": "Full-Stack Developer",
                    "period": "2019 - 2021",
                    "description": (
                        "Phát triển các ứng dụng Web Enterprise cho khách hàng quốc tế "
                        "sử dụng React, Django và AWS Cloud."
                    ),
                },
            ],
            "skills": [
                {"id": "skill-1", "name": "Next.js 16 / React 19", "level": "Expert", "category": "Frontend"},
                {
                    "id": "skill-2",
                    "name": "Django 6 / DRF / Python",
                    "level": "Expert",
                    "category": "Backend",
                },
                {
                    "id": "skill-3",
                    "name": "PostgreSQL / Redis / Upstash",
                    "level": "Advanced",
                    "category": "Database",
                },
                {
                    "id": "skill-4",
                    "name": "Docker / DevOps / Cloudflare R2",
                    "level": "Advanced",
                    "category": "Infrastructure",
                },
                {"id": "skill-5", "name": "Tailwind CSS / shadcn/ui", "level": "Expert", "category": "UI/UX"},
                {
                    "id": "skill-6",
                    "name": "Kiến trúc Monorepo & Microservices",
                    "level": "Expert",
                    "category": "Architecture",
                },
            ],
            "projects": [
                {
                    "id": "proj-1",
                    "title": "ToanNX Enterprise Monorepo",
                    "description": (
                        "Kiến trúc chuẩn hoá Full-Stack Next.js 16 + Django 6 với phân quyền RBAC đa tầng "
                        "và tích hợp SePay Webhook tự động."
                    ),
                    "url": "https://toannx.com",
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "tags": ["Next.js", "Django", "TypeScript", "PostgreSQL"],
                },
                {
                    "id": "proj-2",
                    "title": "VietQR Payment Gateway & Speaker Hub",
                    "description": (
                        "Cổng tích hợp thanh toán ngân hàng tự động, tra cứu biến động số dư tức thì "
                        "và kết nối loa thông báo."
                    ),
                    "url": "https://toannx.com/vi/ca-nhan",
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1563986768609-322da13575f3"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "tags": ["VietQR", "SePay", "Webhooks", "IoT"],
                },
                {
                    "id": "proj-3",
                    "title": "Tùy biến Trang & ShortLink Platform",
                    "description": (
                        "Hệ thống rút gọn liên kết thông minh, tạo mã QR ngân hàng động "
                        "và xuất bản trang cá nhân hóa."
                    ),
                    "url": "https://toannx.com/p/tech-setup",
                    "imageUrl": (
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f"
                        "?auto=format&fit=crop&w=600&q=80"
                    ),
                    "tags": ["CMS", "Analytics", "Performance"],
                },
            ],
            "links": [
                {
                    "id": "link-1",
                    "title": "GitHub Profile - Dự án mã nguồn mở",
                    "url": "https://github.com/nxtoan2k4",
                    "description": "Khám phá các kho lưu trữ mã nguồn mở và đóng góp cộng đồng",
                    "is_highlight": True,
                    "highlight": True,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 0,
                    "sortOrder": 0,
                    "icon": "github",
                },
                {
                    "id": "link-2",
                    "title": "Kênh YouTube Lập trình & Tech Review",
                    "url": "https://youtube.com/@toannx",
                    "description": "Video chia sẻ kiến thức công nghệ thực chiến từ cơ bản đến nâng cao",
                    "is_highlight": False,
                    "highlight": False,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 1,
                    "sortOrder": 1,
                    "icon": "youtube",
                },
                {
                    "id": "link-3",
                    "title": "Liên hệ Telegram công việc (@toannx)",
                    "url": "https://t.me/toannx",
                    "description": "Trao đổi hợp tác phát triển phần mềm và tư vấn giải pháp kỹ thuật",
                    "is_highlight": True,
                    "highlight": True,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 2,
                    "sortOrder": 2,
                    "icon": "telegram",
                },
                {
                    "id": "link-4",
                    "title": "Website cá nhân toannx.com",
                    "url": "https://toannx.com",
                    "description": "Trang chủ hệ thống và blog công nghệ chính thức",
                    "is_highlight": False,
                    "highlight": False,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 3,
                    "sortOrder": 3,
                    "icon": "globe",
                },
            ],
        }

        page_bio, _ = Page.objects.update_or_create(
            path=path,
            slug="toannx-bio",
            defaults={
                "owner": user,
                "title": "Toàn NX | Software Engineer & Tech Creator",
                "description": (
                    "Kênh liên kết mạng xã hội, dự án cá nhân và thông tin liên hệ chính thức của Toàn NX."
                ),
                "seo_title": "Toàn NX | Kỹ Sư Phần Mềm & Nhà Sáng Tạo Nội Dung Công Nghệ",
                "seo_description": (
                    "Trang liên kết chính thức của Nguyễn Xuân Toàn. Kết nối qua GitHub, YouTube, "
                    "Telegram và khám phá các dự án công nghệ mới nhất."
                ),
                "status": Page.Status.PUBLISHED,
                "page_type": Page.PageType.BIO,
                "template_key": "link_in_bio",
                "content_config": bio_content,
                "style_config": {
                    "theme_preset": "ocean_blue",
                    "primary_color": "#2563eb",
                    "background_color": "#0f172a",
                    "text_color": "#f8fafc",
                    "card_radius": "20px",
                    "layout": "links",
                },
                "theme": {
                    "mode": "dark",
                    "primary_color": "#2563eb",
                    "background_color": "#0f172a",
                    "text_color": "#f8fafc",
                    "button_style": "pill",
                },
                "published_at": now,
            },
        )

        # =========================================================================
        # 3. PORTFOLIO SHOWCASE (portfolio)
        # =========================================================================
        portfolio_content = {
            "profile": {
                "displayName": "Nguyễn Xuân Toàn",
                "display_name": "Nguyễn Xuân Toàn",
                "headline": "Lead Software Architect & Tech Lead",
                "bioText": (
                    "Chuyên gia phát triển hệ thống Enterprise, Web Application tốc độ cao, "
                    "tích hợp thanh toán tự động và kiến trúc Microservices chịu tải lớn."
                ),
                "bio_text": (
                    "Chuyên gia phát triển hệ thống Enterprise, Web Application tốc độ cao, "
                    "tích hợp thanh toán tự động và kiến trúc Microservices chịu tải lớn."
                ),
                "avatarUrl": (
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "avatar_url": (
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "coverUrl": (
                    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "cover_url": (
                    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "location": "Hà Nội, Việt Nam",
                "email": "nxtoan2k4@gmail.com",
                "website": "https://toannx.com",
                "socials": [
                    {"platform": "github", "url": "https://github.com/nxtoan2k4"},
                    {"platform": "linkedin", "url": "https://linkedin.com/in/toannx"},
                    {"platform": "telegram", "url": "https://t.me/toannx"},
                ],
            },
            "headline": "Lead Software Architect & Tech Lead",
            "bio_text": (
                "Chuyên gia phát triển hệ thống Enterprise, Web Application tốc độ cao, "
                "tích hợp thanh toán tự động và kiến trúc Microservices chịu tải lớn."
            ),
            "avatar_url": (
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "cover_url": (
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "avatarUrl": (
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "coverUrl": (
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "experiences": bio_content["experiences"],
            "skills": bio_content["skills"],
            "projects": bio_content["projects"],
            "links": [
                {
                    "id": "port-1",
                    "title": "Nền tảng ToanNX Monorepo (Next.js 16 + Django 6)",
                    "url": "https://toannx.com",
                    "description": "Hệ thống quản trị doanh nghiệp và các công cụ tiện ích mở rộng",
                    "is_highlight": True,
                    "highlight": True,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 0,
                    "sortOrder": 0,
                    "icon": "globe",
                },
                {
                    "id": "port-2",
                    "title": "Cổng tích hợp thanh toán SePay & VietQR Webhooks",
                    "url": "https://toannx.com/vi/ca-nhan",
                    "description": "Giải pháp đối soát biến động số dư ngân hàng theo thời gian thực",
                    "is_highlight": True,
                    "highlight": True,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 1,
                    "sortOrder": 1,
                    "icon": "credit-card",
                },
                {
                    "id": "port-3",
                    "title": "Tải CV / Resume của tôi (PDF)",
                    "url": "https://toannx.com/cv.pdf",
                    "description": "Xem chi tiết toàn bộ kinh nghiệm và học vấn chuyên môn",
                    "is_highlight": False,
                    "highlight": False,
                    "is_visible": True,
                    "isVisible": True,
                    "sort_order": 2,
                    "sortOrder": 2,
                    "icon": "file-text",
                },
            ],
        }

        page_portfolio, _ = Page.objects.update_or_create(
            path=path,
            slug="portfolio",
            defaults={
                "owner": user,
                "title": "ToanNX Portfolio - Software & Web Architecture",
                "description": (
                    "Hồ sơ năng lực cá nhân, các dự án tiêu biểu đã triển khai và kỹ năng chuyên môn."
                ),
                "seo_title": "ToanNX Portfolio - Senior Software Engineer & Web Architect",
                "seo_description": (
                    "Hồ sơ năng lực kỹ thuật, danh mục dự án phần mềm tiêu biểu, kinh nghiệm làm việc "
                    "và kỹ năng chuyên môn của Nguyễn Xuân Toàn."
                ),
                "status": Page.Status.PUBLISHED,
                "page_type": Page.PageType.PORTFOLIO,
                "template_key": "portfolio",
                "content_config": portfolio_content,
                "style_config": {
                    "theme_preset": "purple_dusk",
                    "primary_color": "#7c3aed",
                    "background_color": "#18181b",
                    "text_color": "#fafafa",
                    "card_radius": "12px",
                    "layout": "links",
                },
                "theme": {
                    "mode": "dark",
                    "primary_color": "#7c3aed",
                    "background_color": "#18181b",
                    "text_color": "#fafafa",
                    "button_style": "rounded",
                },
                "published_at": now,
            },
        )

        # =========================================================================
        # 4. DONATION VIETQR (donate)
        # =========================================================================
        donation_amounts = [
            {"amount": 20000, "label": "1 ly trà đá (20.000 ₫)", "icon": "coffee"},
            {"amount": 50000, "label": "1 ly cà phê muối (50.000 ₫)", "icon": "coffee"},
            {"amount": 100000, "label": "1 bữa sáng no nê (100.000 ₫)", "icon": "utensils"},
            {"amount": 200000, "label": "1 cuốn sách công nghệ (200.000 ₫)", "icon": "book"},
            {"amount": 500000, "label": "Gói tài trợ server 1 tháng (500.000 ₫)", "icon": "server"},
        ]

        donation_content = {
            "avatarUrl": (
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "avatar_url": (
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&h=500&q=85"
            ),
            "coverUrl": (
                "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "cover_url": (
                "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&h=600&q=85"
            ),
            "bankAccount": {
                "bankName": "MBBank",
                "accountNumber": "0388888888",
                "accountHolder": "NGUYEN XUAN TOAN",
            },
            "bank_account": {
                "bank_name": "MBBank",
                "account_number": "0388888888",
                "account_holder": "NGUYEN XUAN TOAN",
            },
            "bank_code": "MB",
            "account_number": "0388888888",
            "account_name": "NGUYEN XUAN TOAN",
            "creator": {
                "name": "Toàn NX",
                "avatarUrl": (
                    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "avatar_url": (
                    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&h=500&q=85"
                ),
                "coverUrl": (
                    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "cover_url": (
                    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&h=600&q=85"
                ),
                "message": (
                    "Ủng hộ tác giả phát triển công cụ mở, duy trì máy chủ và chia sẻ nội dung công nghệ "
                    "miễn phí mỗi ngày."
                ),
                "thankYouMessage": (
                    "Cảm ơn bạn rất nhiều vì đã đồng hành và ủng hộ tôi! "
                    "Sự ủng hộ của bạn là động lực to lớn giúp tôi tiếp tục cống hiến cho các sản phẩm mở "
                    "chất lượng cao."
                ),
            },
            "thank_you_message": (
                "Cảm ơn bạn rất nhiều vì đã đồng hành và ủng hộ tôi! "
                "Sự ủng hộ của bạn là động lực to lớn giúp tôi tiếp tục cống hiến cho các sản phẩm mở "
                "chất lượng cao."
            ),
            "message_template": "Ung ho toannx {amount}",
            "suggestedAmounts": donation_amounts,
            "suggested_amounts": donation_amounts,
            "options": {
                "showBankDetails": True,
                "showCopyButton": True,
            },
        }

        page_donation, _ = Page.objects.update_or_create(
            path=path,
            slug="donate",
            defaults={
                "owner": user,
                "title": "Mời Toàn NX Một Ly Cà Phê ☕",
                "description": (
                    "Ủng hộ tác giả phát triển công cụ mở, duy trì máy chủ và chia sẻ nội dung công nghệ "
                    "miễn phí cho cộng đồng."
                ),
                "seo_title": "Ủng Hộ Toàn NX Qua Mã VietQR Ngân Hàng Nhanh Chóng",
                "seo_description": (
                    "Gửi lời cảm ơn và ủng hộ Toàn NX qua mã VietQR tiện lợi không mất phí, "
                    "hỗ trợ duy trì các dự án mã nguồn mở và nền tảng toannx.com."
                ),
                "status": Page.Status.PUBLISHED,
                "page_type": Page.PageType.DONATION,
                "template_key": "donation",
                "content_config": donation_content,
                "style_config": {
                    "theme_preset": "warm_amber",
                    "primary_color": "#d97706",
                    "background_color": "#fffbeb",
                    "text_color": "#451a03",
                    "card_radius": "16px",
                },
                "theme": {
                    "mode": "light",
                    "primary_color": "#d97706",
                    "background_color": "#fffbeb",
                    "text_color": "#451a03",
                    "button_style": "pill",
                },
                "published_at": now,
            },
        )

        # =========================================================================
        # 5. LEGACY TIPTAP PAGE (gioi-thieu)
        # =========================================================================
        legacy_content = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Về ToanNX Studio & Tôn Chỉ Hoạt Động"}],
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Chào mừng bạn đến với ToanNX Studio! Nơi quy tụ các giải pháp công nghệ "
                                "hiện đại cho nhà sáng tạo nội dung, lập trình viên và doanh nghiệp số."
                            ),
                        }
                    ],
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Sứ mệnh cốt lõi của chúng tôi"}],
                },
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "marks": [{"type": "bold"}],
                                            "text": "Trải nghiệm người dùng vượt trội: ",
                                        },
                                        {
                                            "type": "text",
                                            "text": (
                                                "Tốc độ phản hồi cực nhanh dưới 100ms, giao diện chuẩn mực, "
                                                "thân thiện tuyệt đối trên cả thiết bị di động và máy tính."
                                            ),
                                        },
                                    ],
                                }
                            ],
                        },
                        {
                            "type": "listItem",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "marks": [{"type": "bold"}],
                                            "text": "Bảo mật & Tự chủ dữ liệu: ",
                                        },
                                        {
                                            "type": "text",
                                            "text": (
                                                "Kiểm soát dữ liệu cá nhân chặt chẽ, kiến trúc phân quyền "
                                                "minh bạch và tuân thủ các chuẩn an toàn thông tin."
                                            ),
                                        },
                                    ],
                                }
                            ],
                        },
                        {
                            "type": "listItem",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "marks": [{"type": "bold"}],
                                            "text": "Hệ sinh thái công cụ mở: ",
                                        },
                                        {
                                            "type": "text",
                                            "text": (
                                                "Từ rút gọn link thông minh, tạo mã QR ngân hàng "
                                                "đến xây dựng trang cá nhân và storefront bán hàng đa năng."
                                            ),
                                        },
                                    ],
                                }
                            ],
                        },
                    ],
                },
                {
                    "type": "blockquote",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        "“Đơn giản là đỉnh cao của sự tinh tế. Một hệ thống xuất sắc "
                                        "mang lại sự tự do và cảm hứng sáng tạo cho người dùng.”"
                                    ),
                                }
                            ],
                        }
                    ],
                },
            ],
        }

        page_legacy, _ = Page.objects.update_or_create(
            path=path,
            slug="gioi-thieu",
            defaults={
                "owner": user,
                "title": "Về ToanNX Studio & Tôn Chỉ Hoạt Động",
                "description": (
                    "Thông tin chi tiết về hệ thống ToanNX Studio, sứ mệnh phát triển, công nghệ cốt lõi "
                    "và điều khoản dịch vụ minh bạch."
                ),
                "seo_title": "Về ToanNX Studio - Sứ Mệnh & Tôn Chỉ Hoạt Động",
                "seo_description": (
                    "Tìm hiểu về hành trình xây dựng nền tảng ToanNX Studio, các giá trị cốt lõi, "
                    "công nghệ tiên tiến và tầm nhìn phát triển dài hạn."
                ),
                "status": Page.Status.PUBLISHED,
                "page_type": Page.PageType.LEGACY_PAGE,
                "template_key": "blank",
                "content": legacy_content,
                "theme": {
                    "mode": "system",
                    "primary_color": "#0284c7",
                    "background_color": "#ffffff",
                    "text_color": "#0f172a",
                    "button_style": "rounded",
                },
                "published_at": now,
            },
        )

        frontend_origin = get_frontend_origin()
        return [
            f"1. Affiliate Storefront:  {frontend_origin}/p/{page_affiliate.slug}",
            f"2. Link-in-Bio:          {frontend_origin}/p/{page_bio.slug}",
            f"3. Portfolio Showcase:   {frontend_origin}/p/{page_portfolio.slug}",
            f"4. Donation VietQR:      {frontend_origin}/p/{page_donation.slug}",
            f"5. Legacy Tiptap Page:   {frontend_origin}/p/{page_legacy.slug}",
        ]
