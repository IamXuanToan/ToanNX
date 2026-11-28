"""Bộ chặn URL bịa của Trợ lý AI."""

from app.workspace.services.assistant_reply_guard import AssistantReplyGuard

ORIGIN = "https://toannx.com"


class TestAssistantReplyGuard:
    def test_fake_domain_replaced_by_real_short_url_with_same_slug(self) -> None:
        cards = [{"url": "https://toannx.com/s/facebook-me"}]
        text = "Link của bạn: https://toanx.io/facebook-me. Chúc vui!"
        out = AssistantReplyGuard().sanitize(text, trusted_texts=[], origin=ORIGIN, cards=cards)
        assert out == "Link của bạn: https://toannx.com/s/facebook-me. Chúc vui!"

    def test_untrusted_url_removed_and_markdown_label_kept(self) -> None:
        text = "Xem [tại đây](https://evil.example/x) hoặc https://toanx.io/abc"
        out = AssistantReplyGuard().sanitize(text, trusted_texts=[], origin=ORIGIN)
        assert "evil.example" not in out
        assert "toanx.io" not in out
        assert "tại đây" in out

    def test_user_and_origin_urls_are_kept(self) -> None:
        text = "Đích https://www.facebook.com/ và trang https://toannx.com/s/fb"
        out = AssistantReplyGuard().sanitize(
            text, trusted_texts=["link tới https://www.facebook.com/"], origin=ORIGIN
        )
        assert out == text
