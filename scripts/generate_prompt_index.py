from pathlib import Path
import html

BASE_DIR = Path(__file__).parent
OUTPUT_FILE = BASE_DIR / "index_promt.html"
PROMPT_PREFIX = "prompt_"
EXT = ".md"


def collect_prompts(base_dir: Path):
    """
    ディレクトリ単位で prompt_*.md を収集する
    """
    groups = {}

    for md_file in base_dir.rglob(f"{PROMPT_PREFIX}*{EXT}"):
        if md_file.name == OUTPUT_FILE.name:
            continue

        group = md_file.parent.relative_to(base_dir)
        groups.setdefault(group, []).append(md_file)

    return groups


def generate_html(groups: dict[Path, list[Path]]) -> str:
    """
    index.html のHTML文字列を生成
    """
    sections = []

    for group, files in sorted(groups.items()):
        title = html.escape(str(group))
        items = []

        for file in sorted(files):
            label = file.stem.replace(PROMPT_PREFIX, "")
            link = html.escape(str(file.relative_to(BASE_DIR)))
            items.append(f'<li><a href="{link}">{label}</a></li>')

        section = f"""
        <h2>{title}</h2>
        <ul>
            {''.join(items)}
        </ul>
        """
        sections.append(section)

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Prompt Index</title>
  <style>
    body {{
      font-family: system-ui, sans-serif;
      line-height: 1.6;
      padding: 24px;
    }}
    h1 {{
      border-bottom: 1px solid #ccc;
    }}
    h2 {{
      margin-top: 24px;
    }}
    ul {{
      margin-left: 1em;
    }}
    li {{
      margin: 6px 0;
    }}
    a {{
      text-decoration: none;
      color: #0066cc;
    }}
    a:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>

<h1>プロンプト整理インデックス</h1>

{''.join(sections)}

</body>
</html>
"""


def main():
    groups = collect_prompts(BASE_DIR)
    html_text = generate_html(groups)
    OUTPUT_FILE.write_text(html_text, encoding="utf-8")
    print(f"index.html generated: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
