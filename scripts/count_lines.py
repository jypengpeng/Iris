"""统计项目代码行数。"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 要统计的扩展名
EXT = {".ts", ".js", ".json", ".md"}

# 要跳过的目录
SKIP_DIRS = {"node_modules", "dist", ".git", "data"}


def count():
    stats: dict[str, list[tuple[str, int]]] = {}# ext -> [(path, lines), ...]
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            ext = Path(f).suffix
            if ext not in EXT:
                continue
            fp = Path(dirpath) / f
            try:
                lines = len(fp.read_text(encoding="utf-8").splitlines())
            except Exception:
                continue
            rel = str(fp.relative_to(ROOT)).replace("\\", "/")
            stats.setdefault(ext, []).append((rel, lines))

    grand_total = 0
    grand_files = 0

    for ext in sorted(stats):
        items = sorted(stats[ext])
        total = sum(n for _, n in items)
        grand_total += total
        grand_files += len(items)
        print(f"\n{'=' * 50}")
        print(f"  {ext}  |  {len(items)} 个文件  |  {total} 行")
        print(f"{'=' * 50}")
        for path, n in items:
            print(f"  {n:>5}  {path}")

    print(f"\n{'=' * 50}")
    print(f"  合计  |  {grand_files} 个文件  |  {grand_total} 行")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    count()
