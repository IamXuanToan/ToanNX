"""Service tạo dữ liệu link rút gọn mẫu (seed data) kèm số lượt truy cập.

Chỉ chạy khi DEBUG=True trên môi trường local/staging.
Tạo danh sách các short link với số lượng click thực tế phục vụ biểu đồ so sánh trên Dashboard.
"""

from typing import Any

from app.system.repositories.user_repository import UserRepository
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.models.short_link import ShortLink


class ShortLinkSeedService:
    """Tạo dữ liệu ShortLink mẫu phong phú cho Portal Dashboard."""

    def __init__(self, user_repository: UserRepository | None = None) -> None:
        """Khởi tạo service."""
        self.user_repository = user_repository or UserRepository()

    def seed_sample_links(self, email: str) -> list[str]:
        """Tạo các link rút gọn mẫu kèm lượt click.

        Args:
            email: Email người dùng sở hữu.

        Returns:
            Danh sách thông báo kết quả.
        """
        user = self.user_repository.find_by_email(email.strip().lower())
        if not user:
            raise ValueError(f"Không tìm thấy người dùng có email: {email}.")

        sample_links: list[dict[str, Any]] = [
            {
                "name": "Portfolio Cá Nhân ToanNX",
                "slug": "portfolio",
                "destination_url": "https://toannx.com",
                "description": "Trang giới thiệu bản thân, dự án và kinh nghiệm làm việc",
                "clicks_count": 3840,
                "status": ShortLink.Status.ACTIVE,
            },
            {
                "name": "GitHub Monorepo ToanNX",
                "slug": "github-toannx",
                "destination_url": "https://github.com/nxtoan2k4/toannx",
                "description": "Kho mã nguồn mở kiến trúc Clean Architecture Django 6 & Next.js 16",
                "clicks_count": 2960,
                "status": ShortLink.Status.ACTIVE,
            },
            {
                "name": "Blog Chia Sẻ Kiến Trúc Hệ Thống",
                "slug": "blog-kien-truc",
                "destination_url": "https://toannx.com/blog",
                "description": "Các bài viết chuyên sâu về tối ưu hiệu năng và thiết kế hệ thống",
                "clicks_count": 2180,
                "status": ShortLink.Status.ACTIVE,
            },
            {
                "name": "Kênh YouTube Lập Trình & Tech",
                "slug": "youtube-tech",
                "destination_url": "https://youtube.com/@toannx",
                "description": "Kênh video hướng dẫn lập trình thực chiến",
                "clicks_count": 1640,
                "status": ShortLink.Status.ACTIVE,
            },
            {
                "name": "Khóa Học Next.js 16 & TanStack",
                "slug": "khoa-hoc-nextjs",
                "destination_url": "https://toannx.com/courses/nextjs",
                "description": "Khóa học xây dựng ứng dụng fullstack chuẩn Production",
                "clicks_count": 920,
                "status": ShortLink.Status.ACTIVE,
            },
            {
                "name": "Cộng Đồng Discord Cú Đêm Cày Code",
                "slug": "discord-community",
                "destination_url": "https://discord.gg/toannx",
                "description": "Nơi trao đổi kinh nghiệm, giải đáp thắc mắc lập trình",
                "clicks_count": 750,
                "status": ShortLink.Status.ACTIVE,
            },
        ]

        created_count = 0
        updated_count = 0

        for item in sample_links:
            _, created = ShortLink.objects.update_or_create(
                owner=user,
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "destination_url": item["destination_url"],
                    "description": item["description"],
                    "clicks_count": item["clicks_count"],
                    "status": item["status"],
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        total_links = ShortLink.objects.filter(owner=user).count()

        frontend_origin = get_frontend_origin()
        return [
            f"✓ Đã tạo/cập nhật {len(sample_links)} link rút gọn mẫu cho user: {user.email}",
            f"  - Tạo mới: {created_count} | Cập nhật: {updated_count} | Tổng hiện tại: {total_links}",
            f"  - Dashboard cá nhân: {frontend_origin}/vi/ca-nhan",
            f"  - Quản lý link rút gọn: {frontend_origin}/vi/ca-nhan/link-rut-gon",
        ]
