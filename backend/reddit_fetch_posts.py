# -*- coding: utf-8 -*-
"""
reddit_fetch_posts.py
- Reddit에서 미리 저장한 posts JSON(제목/URL 목록)을 읽고
  각 게시물의 본문(selftext)과 댓글을 .json 엔드포인트로 수집합니다.
- 브라우저/Playwright 불필요 → 프롬프트/콘솔에서 안정적으로 실행.

사용 예)
  python reddit_fetch_posts.py
  python reddit_fetch_posts.py --posts_file Tesla_posts.json --start 46 --end 151
  python reddit_fetch_posts.py --out_csv out.csv --out_json out.json
  python reddit_fetch_posts.py --ua "my-research-script by u/xxx"
"""

import os
import re
import sys
import time
import json
import random
import argparse
from datetime import datetime
from typing import List, Dict, Tuple, Optional

import requests
import pandas as pd
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------
# 기본값/설정
# ---------------------------
DEFAULT_CANDIDATES = ["Tesla_posts.json", "tesla_posts.json"]
DEFAULT_UA = "tesla-research-script by u/your_username (contact: email@example.com)"

ID_RE = re.compile(r"/comments/([a-z0-9]+)/", re.IGNORECASE)


def log(msg: str) -> None:
    now = datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] {msg}", flush=True)


def find_posts_file(path: Optional[str]) -> str:
    if path:
        if os.path.exists(path):
            return path
        raise FileNotFoundError(f"지정한 파일을 찾을 수 없습니다: {path}")
    for cand in DEFAULT_CANDIDATES:
        if os.path.exists(cand):
            return cand
    raise FileNotFoundError(f"posts 파일을 찾을 수 없습니다: {DEFAULT_CANDIDATES}")


def load_posts(posts_path: str) -> List[Dict]:
    with open(posts_path, "r", encoding="utf-8") as f:
        posts = json.load(f)
    if not isinstance(posts, list):
        raise ValueError("posts JSON은 리스트여야 합니다.")
    return posts


def extract_post_id(url: str) -> Optional[str]:
    m = ID_RE.search(url)
    return m.group(1) if m else None


def flatten_comments(tree, out_list: List[str]) -> None:
    """레딧 .json 댓글 트리를 평탄화해서 문자열 리스트(out_list)에 누적"""
    if not isinstance(tree, (list, dict)):
        return
    if isinstance(tree, list):
        for t in tree:
            flatten_comments(t, out_list)
        return

    kind = tree.get("kind")
    data = tree.get("data", {})
    if kind == "t1":  # comment
        body = (data.get("body") or "").strip()
        if body:
            out_list.append(body)
        replies = data.get("replies")
        if isinstance(replies, dict):
            flatten_comments(replies.get("data", {}).get("children", []), out_list)
    elif kind in ("Listing", None):
        for c in data.get("children", []):
            flatten_comments(c, out_list)
    # t3(post)/more 등은 여기선 스킵


# ---------------------------
# 세션/재시도 설정
# ---------------------------
def make_session(ua: str) -> requests.Session:
    sess = requests.Session()
    sess.headers.update({"User-Agent": ua, "Accept": "application/json"})
    retry = Retry(
        total=10,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        respect_retry_after_header=True,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    sess.mount("https://", adapter)
    sess.mount("http://", adapter)
    return sess


def fetch_post_via_json(
    post_url: str,
    ua: str,
    max_retries: int = 6,
    cooldown: float = 2.0,
) -> Tuple[str, List[str]]:
    """
    reddit.com/comments/<id>.json 으로 본문(selftext)과 댓글을 가져온다.
    반환: (content, comments)
    """
    pid = extract_post_id(post_url)
    if not pid:
        raise ValueError("URL에서 post id를 찾지 못함: " + post_url)

    api = f"https://www.reddit.com/comments/{pid}.json"
    sess = make_session(ua)
    last_err = None

    for attempt in range(1, max_retries + 1):
        try:
            r = sess.get(api, timeout=20)
            if r.status_code == 200:
                data = r.json()
                # data[0] = post, data[1] = comments
                post_blob = data[0]["data"]["children"][0]["data"]
                content = (post_blob.get("selftext") or "").strip()

                comments_tree = data[1]["data"]["children"]
                comments: List[str] = []
                flatten_comments(comments_tree, comments)
                return content, comments

            if r.status_code == 429:
                retry_after = r.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait = float(retry_after)
                    except ValueError:
                        wait = cooldown * (2 ** (attempt - 1))
                else:
                    wait = cooldown * (2 ** (attempt - 1))
                wait += random.uniform(0.3, 1.1)  # 지터
                log(f"  ⏳ 429 응답. {wait:.1f}s 대기 후 재시도({attempt}/{max_retries})")
                time.sleep(wait)
                last_err = f"HTTP 429(backoff {wait:.1f}s)"
                continue

            if r.status_code in (403, 503):
                wait = cooldown * (1.5 ** attempt) + random.uniform(0.2, 0.8)
                log(f"  ⏳ {r.status_code} 응답. {wait:.1f}s 대기 후 재시도({attempt}/{max_retries})")
                time.sleep(wait)
                last_err = f"HTTP {r.status_code}(backoff {wait:.1f}s)"
                continue

            # 그 외는 예외로 처리
            r.raise_for_status()

        except Exception as e:
            last_err = str(e)
            wait = cooldown * (1.5 ** attempt) + random.uniform(0.2, 0.8)
            log(f"  ⏳ 네트워크/파싱 오류. {wait:.1f}s 대기 후 재시도({attempt}/{max_retries}) - {last_err}")
            time.sleep(wait)
            continue

    raise RuntimeError(f".json 요청 실패: {post_url} (마지막 오류: {last_err})")


def main():
    ap = argparse.ArgumentParser(description="Reddit posts 본문+댓글 수집(.json 엔드포인트)")
    ap.add_argument("--posts_file", default=None, help="입력 posts JSON 경로(미지정 시 자동 탐색)")
    ap.add_argument("--start", type=int, default=0, help="처리 시작 인덱스(포함)")
    ap.add_argument("--end", type=int, default=None, help="처리 끝 인덱스(제외)")
    ap.add_argument("--ua", default=DEFAULT_UA, help="User-Agent 문자열")
    ap.add_argument("--out_json", default="Tesla_posts_full.json", help="결과 저장 JSON 경로")
    ap.add_argument("--out_csv", default="Tesla_posts_full.csv", help="결과 저장 CSV 경로")
    ap.add_argument("--retries", type=int, default=6, help="요청 재시도 횟수(429 대비)")
    ap.add_argument("--cooldown", type=float, default=2.0, help="기본 대기(초) - 백오프/지터에 활용")
    args = ap.parse_args()

    posts_path = find_posts_file(args.posts_file)
    posts = load_posts(posts_path)

    # 슬라이스
    start = max(0, args.start)
    end = len(posts) if args.end is None else max(0, args.end)
    target = posts[start:end]
    if not target:
        raise ValueError(f"처리할 구간이 비었습니다. (총 {len(posts)}개, 지정: [{start}:{end}])")

    log(f"입력: {posts_path} (총 {len(posts)}개)")
    log(f"대상 범위: [{start}:{end}] → {len(target)}개")
    log(f"UA: {args.ua}")

    results: List[Dict] = []

    for i, post in enumerate(target, 1):
        idx = post.get("index", start + i)
        title = (post.get("title") or "").strip()
        url = post.get("url") or ""
        log(f"[{i}/{len(target)}] {title[:80]}")

        try:
            content, comments = fetch_post_via_json(
                url, ua=args.ua, max_retries=args.retries, cooldown=args.cooldown
            )
            results.append(
                dict(
                    index=idx,
                    title=title,
                    url=url,
                    content=content,
                    comments=comments,
                    num_comments=len(comments),
                    crawled_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                )
            )
            log(f"  ✅ 본문 {len(content)}자 / 댓글 {len(comments)}개")
        except Exception as e:
            log(f"  ❌ 실패: {e}")
        finally:
            # ▶ 요청 간 랜덤 대기(2.0~4.0s)로 속도 낮춤(429 예방)
            time.sleep(random.uniform(2.0, 4.0))

    # 저장
    os.makedirs(os.path.dirname(args.out_json) or ".", exist_ok=True)
    with open(args.out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    df = pd.DataFrame(results)
    os.makedirs(os.path.dirname(args.out_csv) or ".", exist_ok=True)
    df.to_csv(args.out_csv, index=False, encoding="utf-8-sig")

    log(f"저장 완료: {args.out_json}, {args.out_csv}")
    log(f"총 {len(df)}개 수집 완료")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("사용자 중단")
        sys.exit(130)

