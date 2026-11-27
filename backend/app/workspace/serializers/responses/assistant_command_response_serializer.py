"""Serializer một mục câu lệnh Bot Telegram / Slash cho màn cấu hình Admin."""

from typing import Any

from rest_framework import serializers


class AssistantCommandResponseSerializer(serializers.Serializer[Any]):
    """Thông tin chuẩn hóa câu lệnh tiếng Việt & tiếng Anh của Chatbot AI."""

    canonical = serializers.CharField(help_text="Mã hành động chuẩn của câu lệnh.")
    command = serializers.CharField(help_text="Câu lệnh tiếng Việt chuẩn (dùng cho Web & Telegram).")
    en_command = serializers.CharField(help_text="Bản lệnh tiếng Anh tương ứng.")
    syntax = serializers.CharField(help_text="Cú pháp minh họa bằng tiếng Việt.")
    en_syntax = serializers.CharField(help_text="Cú pháp minh họa bằng tiếng Anh.")
    description = serializers.CharField(help_text="Mô tả ngắn tiếng Việt dùng cho /setcommands.")
    en_description = serializers.CharField(help_text="Mô tả ngắn tiếng Anh dùng cho /setcommands.")
    telegram_only = serializers.BooleanField(help_text="Chỉ dùng trực tiếp trên Telegram Bot.")
