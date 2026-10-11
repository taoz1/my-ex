"""Record built-in image generation and normalize the documented PNG assets.

Requires Pillow. Size normalization and sprite alignment were approved by the user.
Original generated images remain at their original tool-provided paths.
"""
import argparse
import fcntl
import json
import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / os.environ.get("ASSET_MANIFEST", "docs/art/generation_manifest.json")


def normalize(asset):
    source = Path(asset["generated_source"])
    image = Image.open(source).convert("RGBA")
    asset["generated_size"] = list(image.size)
    size = tuple(asset["size"])
    if "/sprites/" in asset["path"]:
        count = 8 if "npc_generic" in asset["path"] else 4
        alpha = image.getchannel("A")
        # Locate separated silhouettes; use actual alpha rather than guessed cuts.
        # Generated cutouts can contain almost invisible alpha speckles in gutters.
        # Detect solid silhouettes, but retain source alpha when copying their art.
        solid = alpha.point(lambda value: 255 if value >= 128 else 0)
        columns = [solid.crop((x, 0, x + 1, image.height)).getbbox() is not None
                   for x in range(image.width)]
        runs, start = [], None
        for x, occupied in enumerate(columns + [False]):
            if occupied and start is None:
                start = x
            elif not occupied and start is not None:
                runs.append((start, x))
                start = None
        if len(runs) != count:
            raise ValueError(f"{asset['path']}: expected {count} alpha silhouettes, found {len(runs)}; inspect before alignment")
        pieces = []
        for left, right in runs:
            bounds = solid.crop((left, 0, right, image.height)).getbbox()
            # Two-pixel margin preserves partially transparent outline edges.
            pieces.append(image.crop((max(0, left - 2), max(0, bounds[1] - 2),
                                      min(image.width, right + 2), min(image.height, bounds[3] + 2))))
        cell_width = size[0] // count
        scale = min((cell_width - 12) / max(p.width for p in pieces),
                    (size[1] - 24) / max(p.height for p in pieces))
        result = Image.new("RGBA", size, (0, 0, 0, 0))
        boxes = []
        for index, piece in enumerate(pieces):
            piece = piece.resize((max(1, round(piece.width * scale)),
                                  max(1, round(piece.height * scale))), Image.Resampling.NEAREST)
            x = index * cell_width + (cell_width - piece.width) // 2
            y = size[1] - 12 - piece.height
            result.alpha_composite(piece, (x, y))
            boxes.append([x, y, x + piece.width, y + piece.height])
        asset["frame_boxes"] = boxes
        asset["frame_order"] = ["down"] * 8 if count == 8 else ["down", "left", "right", "up"]
    else:
        result = image.resize(size, Image.Resampling.NEAREST)
    if not asset["transparent"]:
        if result.getchannel("A").getextrema() != (255, 255):
            raise ValueError(f"{asset['path']}: unexpected transparency in an opaque asset")
        result = result.convert("RGB")
    elif result.getchannel("A").getextrema() != (0, 255):
        raise ValueError(f"{asset['path']}: lacks complete transparent/opaque alpha range")
    if "phone_frame" in asset["path"] and result.getpixel((size[0] // 2, size[1] // 2))[3] != 0:
        raise ValueError("phone_frame: center of screen must be transparent")
    destination = ROOT / asset["path"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    result.save(destination, format="PNG", optimize=True)
    asset["status"] = "generated_normalized"
    asset["final_size"] = list(result.size)
    asset["final_mode"] = result.mode
    asset.pop("normalization_error", None)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["record", "normalize", "check"])
    parser.add_argument("data", nargs="?")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    if args.command == "record":
        updates = json.loads(args.data)
        for update in updates:
            asset = next(a for a in manifest["assets"] if a["path"] == update["path"])
            asset.update(update)
            try:
                normalize(asset)
            except ValueError as error:
                asset["status"] = "needs_inspection"
                asset["normalization_error"] = str(error)
            print(json.dumps({k: asset[k] for k in ("path", "status", "generated_size", "normalization_error") if k in asset}))
    elif args.command == "normalize":
        for asset in manifest["assets"]:
            if asset.get("generated_source"):
                normalize(asset)
    else:
        failures = 0
        for asset in manifest["assets"]:
            path = ROOT / asset["path"]
            if not path.exists():
                print(f"MISSING {asset['path']}")
                failures += 1
                continue
            image = Image.open(path)
            problems = []
            if image.size != tuple(asset["size"]):
                problems.append(f"wrong size {image.size}")
            if image.format != "PNG":
                problems.append("not PNG")
            if asset["transparent"]:
                if image.mode != "RGBA" or image.getchannel("A").getextrema() != (0, 255):
                    problems.append("invalid alpha")
            elif image.mode not in ("RGB", "RGBA"):
                problems.append("invalid color mode")
            if "/sprites/" in asset["path"]:
                count = 8 if "npc_generic" in asset["path"] else 4
                if len(asset.get("frame_boxes", [])) != count:
                    problems.append("wrong frame count")
                bottoms = []
                for index in range(count):
                    width = image.width // count
                    bounds = image.crop((index * width, 0, (index + 1) * width, image.height)).getchannel("A").getbbox()
                    if bounds is None:
                        problems.append(f"empty frame {index}")
                    else:
                        bottoms.append(bounds[3])
                if bottoms and max(bottoms) - min(bottoms) > 1:
                    problems.append("feet are not aligned")
            if "phone_frame" in asset["path"] and image.convert("RGBA").getpixel((image.width // 2, image.height // 2))[3] != 0:
                problems.append("screen is not transparent")
            failures += bool(problems)
            print(f"{'FAIL ' + ', '.join(problems) if problems else 'PASS'} {asset['path']}")
        if failures:
            sys.exit(1)
    if args.command != "check":
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    # Multiple built-in generations may finish together. Serialize manifest writes.
    with MANIFEST.open("r") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        main()
