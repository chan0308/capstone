# crawler_async.py
import sys, os, json, asyncio
from typing import List, Dict
from playwright.async_api import async_playwright

# ▶ Windows에서 서브프로세스 지원 루프 정책 적용(주피터 밖 프로세스라 100% 반영됨)
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

STORAGE_PATH = "reddit_storage.json"
SEARCH_URL = "https://www.reddit.com/r/selfdrivingcars/search/?q=waymo&type=posts&t=year"
MAX_POSTS = 200  # ✅ 최대 수집 개수 제한

async def solve_captcha_if_needed(page) -> None:
    """Cloudflare/Turnstile/hCaptcha 등 '사람 확인' 화면 대응."""
    challenge_sel = (
        "iframe[src*='challenges.cloudflare.com'], "
        "iframe[src*='hcaptcha.com'], "
        "div[id*='challenge'], "
        "div[id*='captcha']"
    )
    feed_sel_any = [
        "a[data-testid='post-title']",
        "shreddit-post a[slot='title']",
        "shreddit-app",
        "#SHORTCUT_FOCUSABLE_DIV",
    ]

    for s in feed_sel_any:
        if await page.locator(s).first.is_visible():
            return

    has_challenge = await page.locator(challenge_sel).count() > 0
    if has_challenge:
        print("⚠️ 사람이 확인해야 하는 화면 감지됨 — 브라우저에서 통과한 뒤 콘솔에 Enter를 눌러 계속하세요.")
        try:
            for _ in range(180):  # 최대 ~3분 대기
                ok = any([await page.locator(s).first.is_visible() for s in feed_sel_any])
                if ok:
                    print("✅ 메인 피드 확인. 계속 진행합니다.")
                    return
                if await page.locator(challenge_sel).count() == 0:
                    print("✅ 챌린지 프레임이 사라졌습니다. 계속 진행합니다.")
                    return
                await asyncio.sleep(1.5)
        except KeyboardInterrupt:
            pass
        try:
            input("👉 통과를 마쳤다면 여기서 Enter를 눌러 계속하세요...")
        except Exception:
            pass

async def ensure_context(browser):
    if os.path.exists(STORAGE_PATH):
        print(f"🔁 저장된 세션 로드: {STORAGE_PATH}")
        return await browser.new_context(storage_state=STORAGE_PATH)
    else:
        print("🆕 새 세션 시작 (reddit_storage.json 없음)")
        return await browser.new_context()

async def detect_article_selector(page) -> str:
    try:
        await page.wait_for_selector('a[data-testid="post-title"]', timeout=7000)
        print("✅ 구 Reddit 셀렉터 감지됨")
        return 'a[data-testid="post-title"]'
    except:
        await page.wait_for_selector("shreddit-post a[slot='title']", timeout=10000)
        print("✅ 신 Reddit 셀렉터 감지됨")
        return "shreddit-post a[slot='title']"

async def click_load_more_if_any(page) -> bool:
    """검색 결과 하단의 '더보기' 버튼이 있다면 클릭."""
    selectors = [
        "button:has-text('Load more results')",
        "button:has-text('Load More Results')",
        "button:has-text('Load more')",
        "shreddit-load-more button",
    ]
    for s in selectors:
        loc = page.locator(s).first
        if await loc.count() > 0 and await loc.is_visible():
            try:
                await loc.click()
                await asyncio.sleep(2.0)
                return True
            except:
                pass
    return False

async def infinite_scroll(page, article_selector: str, max_rounds: int = 120, sleep_sec: float = 1.6, max_posts: int = MAX_POSTS):
    """
    - 내부 스크롤 컨테이너까지 고려하여 스크롤
    - 매 라운드 '더보기' 버튼 시도
    - 게시물 수가 max_posts에 도달하면 즉시 종료
    - 증가 없음을 몇 회 감지하면 종료
    """
    scroll_candidates = [
        "#SHORTCUT_FOCUSABLE_DIV",        # 구 Reddit
        "#AppRouter-main-content",        # 신 Reddit 내부 컨테이너
        "shreddit-app",                   # 신 Reddit 루트
        "html", "body",                   # 폴백
    ]

    async def do_scroll_once() -> int:
        scrolled = 0
        for sel in scroll_candidates:
            try:
                count = await page.locator(sel).count()
                if count == 0:
                    continue
                await page.evaluate(
                    """(sel) => {
                        const el = document.querySelector(sel);
                        if (!el) return;
                        const target = (el === document.documentElement || el === document.body)
                                      ? (document.scrollingElement || document.documentElement)
                                      : el;
                        target.scrollTop = target.scrollHeight;
                    }""",
                    sel
                )
                scrolled += 1
            except:
                pass
        return scrolled

    prev_count = 0
    stable_rounds = 0

    for r in range(1, max_rounds + 1):
        try:
            count_now = await page.locator(article_selector).count()
        except:
            count_now = prev_count

        print(f"🔄 스크롤 라운드 {r} | 게시물 {count_now}개 감지 (목표 {max_posts})")

        # 목표 달성 시 종료
        if count_now >= max_posts:
            print("🎯 목표 개수에 도달했습니다. 스크롤 종료.")
            break

        # 더보기 버튼 클릭
        clicked = await click_load_more_if_any(page)
        if clicked:
            await asyncio.sleep(2.5)

        # 스크롤
        await do_scroll_once()
        await asyncio.sleep(sleep_sec)

        # 증가 체크
        try:
            new_count = await page.locator(article_selector).count()
        except:
            new_count = count_now

        if new_count <= count_now:
            stable_rounds += 1
        else:
            stable_rounds = 0

        prev_count = new_count

        if stable_rounds >= 3:
            print("⛔️ 더 이상 새로운 게시물이 늘지 않습니다. 스크롤 종료.")
            break

async def extract_posts(page, article_selector: str, max_posts: int = MAX_POSTS) -> List[Dict]:
    """현재 로드된 게시물에서 최대 max_posts까지 추출."""
    elements = await page.locator(article_selector).all()
    print(f"\n📰 감지된 Tesla 게시물(현재 DOM): {len(elements)}개\n{'='*80}")
    posts: List[Dict] = []
    idx = 0
    for el in elements:
        if idx >= max_posts:
            break
        try:
            title = await el.get_attribute("aria-label")
            if not title:
                txt = await el.text_content()
                title = (txt or "").strip()
            href = await el.get_attribute("href")
            if not href:
                continue
            if href.startswith("/"):
                href = f"https://www.reddit.com{href}"
            idx += 1
            posts.append({"index": idx, "title": title, "url": href})
            print(f"{idx:3d}. {title}\n    🔗 {href}")
        except Exception as e:
            idx += 1
            print(f"{idx:3d}. ❌ 추출 실패: {e}")
    print("=" * 80)
    print(f"✅ 총 {len(posts)}개의 게시물 수집 완료! (상한 {max_posts})")
    return posts

async def main():
    print("🚀 Tesla 게시물 추출 시작!")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, args=["--start-maximized"])
        context = await ensure_context(browser)
        page = await context.new_page()

        print("🌐 Reddit 홈 접속 중... (캡차 발생 시 직접 통과 필요)")
        await page.goto("https://www.reddit.com/", timeout=60000, wait_until="load")
        await asyncio.sleep(1.0)
        await solve_captcha_if_needed(page)

        try:
            await context.storage_state(path=STORAGE_PATH)
            print(f"💾 세션 저장 완료: {STORAGE_PATH}")
        except Exception as e:
            print("⚠️ 세션 저장 경고:", e)

        print("🔎 검색 페이지로 이동:", SEARCH_URL)
        await page.goto(SEARCH_URL, timeout=60000, wait_until="networkidle")
        await asyncio.sleep(2.0)
        await solve_captcha_if_needed(page)

        article_selector = await detect_article_selector(page)
        await infinite_scroll(page, article_selector, max_rounds=120, sleep_sec=1.6, max_posts=MAX_POSTS)
        posts = await extract_posts(page, article_selector, max_posts=MAX_POSTS)

        out_path = "Tesla_posts.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
        print(f"💾 게시물 리스트 저장 완료: {out_path}")

        await context.close()
        await browser.close()
        return posts

if __name__ == "__main__":
    res = asyncio.run(main())
    print(f"\n📦 수집된 posts 개수: {len(res)}")
    for p in res[:3]:
        print(f" - {p['title']} ({p['url']})")
