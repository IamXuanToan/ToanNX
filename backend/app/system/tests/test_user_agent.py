"""describe_user_agent: nhãn thiết bị ngắn cho thông báo đăng nhập."""

import pytest

from app.system.utils.user_agent import UNKNOWN_DEVICE, describe_user_agent

CHROME_WIN = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/154.0.0.0 Safari/537.36"
)


@pytest.mark.parametrize(
    ("agent", "expected"),
    [
        (CHROME_WIN, "Chrome trên Windows"),
        (CHROME_WIN.replace("Safari/537.36", "coc_coc_browser/150.0 Safari/537.36"), "Cốc Cốc trên Windows"),
        (CHROME_WIN + " Edg/150.0.0.0", "Edge trên Windows"),
        (CHROME_WIN + " OPR/110.0", "Opera trên Windows"),
        ("Mozilla/5.0 (Windows NT 10.0; rv:130.0) Gecko/20100101 Firefox/130.0", "Firefox trên Windows"),
        (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 "
            "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
            "Safari trên iOS",
        ),
        (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/18.0 Safari/605.1.15",
            "Safari trên macOS",
        ),
        (
            "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/150.0 Mobile Safari/537.36",
            "Chrome trên Android",
        ),
        ("curl/8.0", UNKNOWN_DEVICE),
        ("", UNKNOWN_DEVICE),
        (None, UNKNOWN_DEVICE),
    ],
)
def test_describe_user_agent(agent: str | None, expected: str) -> None:
    assert describe_user_agent(agent) == expected
