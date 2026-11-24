"""HTML Parser trích xuất meta tags và JSON-LD scripts từ mã nguồn HTML."""

from html.parser import HTMLParser


class MetadataHtmlParser(HTMLParser):
    """HTML Parser thư viện chuẩn trích xuất meta tags và JSON-LD."""

    def __init__(self) -> None:
        super().__init__()
        self.title: str = ""
        self.in_title: bool = False
        self.meta_tags: dict[str, str] = {}
        self.json_ld_scripts: list[str] = []
        self.in_json_ld: bool = False
        self.current_json_ld: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}

        if tag_lower == "title" and not self.title:
            self.in_title = True
        elif tag_lower == "meta":
            key = attr_dict.get("property") or attr_dict.get("name")
            content = attr_dict.get("content")
            if key and content:
                self.meta_tags[key.lower()] = content.strip()
        elif tag_lower == "script" and attr_dict.get("type") == "application/ld+json":
            self.in_json_ld = True
            self.current_json_ld = []

    def handle_endtag(self, tag: str) -> None:
        tag_lower = tag.lower()
        if tag_lower == "title":
            self.in_title = False
        elif tag_lower == "script" and self.in_json_ld:
            self.in_json_ld = False
            self.json_ld_scripts.append("".join(self.current_json_ld))
            self.current_json_ld = []

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title += data.strip()
        elif self.in_json_ld:
            self.current_json_ld.append(data)
