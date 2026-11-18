#!/usr/bin/env python3
"""Update rows of topics.csv as each topic's fact is checked.

  python pipeline/dev/topics.py "<company>|<words from the fact>" fact="..." hook="..." url=... status=... surprise=4
  python pipeline/dev/topics.py --rerank        re-sort by score (fame x surprise), pilots stay first

Rows are matched by company and a fragment of the current fact.
"""
import csv
import sys
from pathlib import Path

P = Path(__file__).resolve().parent.parent.parent / "topics.csv"
COLS = ["rank", "company", "industry", "surprising_fact", "hook_line", "hook_style", "main_scene", "fame", "surprise", "score", "source_url", "source_status", "video"]
KEYS = {"fact": "surprising_fact", "hook": "hook_line", "style": "hook_style", "scene": "main_scene", "url": "source_url", "status": "source_status"}


def load():
    return list(csv.DictReader(P.open()))


def save(rows):
    with P.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        w.writerows(rows)


def rerank(rows):
    fixed = [r for r in rows if r["video"]]
    rest = [r for r in rows if not r["video"]]
    for r in rows:
        r["score"] = str(int(r["fame"]) * int(r["surprise"]))
    rest.sort(key=lambda r: (-int(r["score"]), -int(r["surprise"]), -int(r["fame"])))
    out = sorted(fixed, key=lambda r: r["video"]) + rest
    for i, r in enumerate(out, 1):
        r["rank"] = str(i)
    return out


def main():
    rows = load()
    if sys.argv[1] == "--rerank":
        save(rerank(rows))
        return
    company, frag = sys.argv[1].split("|", 1)
    hits = [r for r in rows if r["company"] == company and frag.lower() in r["surprising_fact"].lower()]
    if len(hits) != 1:
        sys.exit(f"{len(hits)} rows match {sys.argv[1]!r}")
    for kv in sys.argv[2:]:
        k, v = kv.split("=", 1)
        hits[0][KEYS.get(k, k)] = v
    save(rerank(rows))
    print(f"updated {company}: {hits[0]['surprising_fact'][:70]}")


if __name__ == "__main__":
    main()
