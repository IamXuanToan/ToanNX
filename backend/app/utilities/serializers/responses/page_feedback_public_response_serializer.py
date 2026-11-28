"""Response tối giản khi khách ẩn danh gửi góp ý thành công."""

from rest_framework import serializers

from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackPublicResponseSerializer(serializers.ModelSerializer[PageFeedback]):
    """Chỉ trả ID và thời điểm tạo, tuyệt đối không lộ chủ trang hay email."""

    class Meta:
        """Khai báo model và trường trả về."""

        model = PageFeedback
        fields = ("id", "created_at")
