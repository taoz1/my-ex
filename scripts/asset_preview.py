"""Build an offline review gallery and contact sheets from the asset manifest."""
import html
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/art"
manifest = json.loads((ROOT / os.environ.get("ASSET_MANIFEST", "docs/art/generation_manifest.json")).read_text())
prefix = os.environ.get("ASSET_PREVIEW_PREFIX", "")
sections = []
font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 14)
for group in ("portraits", "sprites", "maps", "items", "ui"):
    assets = [a for a in manifest["assets"] if a["path"].split("/")[1] == group]
    if not assets:
        continue
    existing = [a for a in assets if (ROOT / a["path"]).exists()]
    cards = []
    cell_w, cell_h = ((1080, 305) if group == "sprites" else (390, 310))
    cols = 1 if group == "sprites" else 3
    sheet = Image.new("RGB", (cols * cell_w, max(1, math.ceil(len(existing) / cols)) * cell_h), "#20292c")
    draw = ImageDraw.Draw(sheet)
    for index, asset in enumerate(existing):
        image = Image.open(ROOT / asset["path"]).convert("RGBA")
        scale = min((cell_w - 32) / image.width, (cell_h - 50) / image.height)
        thumb = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.NEAREST)
        col, row = index % cols, index // cols
        x = col * cell_w + (cell_w - thumb.width) // 2
        y = row * cell_h + 12 + ((cell_h - 50) - thumb.height) // 2
        sheet.paste(thumb, (x, y), thumb)
        draw.text((col * cell_w + 16, (row + 1) * cell_h - 25), Path(asset["path"]).name, font=font, fill="#f1e1c3")
        link = "../../" + asset["path"]
        label = html.escape(asset["path"])
        cards.append(f'<a class="card {group}" href="{link}" target="_blank"><div class="image"><img src="{link}" alt="{label}" loading="lazy"></div><strong>{Path(asset["path"]).name}</strong><small>{image.width} × {image.height} · {asset["final_mode"]}</small></a>')
    sheet.save(OUTPUT / f"{prefix}preview_{group}.png", optimize=True)
    sections.append(f'<section><h2>{group} <span>{len(existing)}/{len(assets)}</span></h2><div class="grid">{"".join(cards)}</div></section>')
page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第四个版本 · 第一批资产预览</title><style>
*{box-sizing:border-box}body{margin:0;padding:32px;background:#152024;color:#efe3ca;font:15px system-ui,sans-serif}main{max-width:1400px;margin:auto}h1{font-size:28px}p,small{color:#acbab8}h2{margin-top:40px}h2 span{font-size:14px;color:#94aaa7}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}.card{color:inherit;text-decoration:none;padding:12px;border:1px solid #405051;border-radius:8px;background:#20292c}.image{height:240px;display:flex;align-items:center;justify-content:center;background-color:#303b3e;background-image:linear-gradient(45deg,#374346 25%,transparent 25%),linear-gradient(-45deg,#374346 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#374346 75%),linear-gradient(-45deg,transparent 75%,#374346 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}img{max-height:100%;max-width:100%;image-rendering:pixelated}.sprites{grid-column:1/-1}.sprites .image{height:256px}strong,small{display:block;margin-top:8px}strong{font:14px ui-monospace,monospace}.card:hover{border-color:#d7b67c}</style><main><h1>《第四个版本》· 第一批资产预览</h1><p>点击图片查看完整 PNG。方格是预览背景，用于检查透明区域；不在资产文件中。文件名、尺寸与目录按素材清单保存。</p>'''
(OUTPUT / f"{prefix}asset_preview.html").write_text(page.replace("第一批", manifest.get("batch_label", "第一批")) + "".join(sections) + "</main></html>")
print(f"Wrote offline gallery and contact sheets to docs/art/{prefix}*")
