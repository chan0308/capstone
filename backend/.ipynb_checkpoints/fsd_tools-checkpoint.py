# backend/fsd_tools.py
"""
FSD Research Assistant용 분석 파이프라인 모듈 (경량 버전)

기능:
1) 키워드 리스트를 받아 Reddit 검색 API(JSON)을 통해 크롤링
2) 크롤링된 텍스트에 대해 감성 점수 계산(VADER)
3) 감성 점수 기반으로 5개 토픽(Safety/Recall/Collision/Autopilot/Quality)별 평균 점수 산출
4) LDA 토픽 모델링으로 이슈 키워드 묶음 추출
5) LangGraph 쪽에서는 이 모듈의 최상위 함수만 하나의 "툴"처럼 호출

※ Playwright / crawler_async 사용 X
   -> requests 기반이라 Windows/배포 환경에서도 훨씬 안정적
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict, Any
from pathlib import Path
import re
import urllib.parse

import requests
import pandas as pd
from nltk.sentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation


# ----- 0. 경로 / 상수 설정 -----

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# 사용자가 미리 정의해 둔 후보 키워드 (질문에서 준 리스트 그대로)
CANDIDATE_KEYWORDS = [
    "tesla", "musk", "fsd", "autopilot", "robotaxi", "cybercab",
    "self-driving", "autonomous driving", "driverless", "safety",
    "crash", "collision", "recall", "investigation", "nhtsa", "dmv",
    "cpuc", "disengagement", "permit", "ride-hailing",
    "테슬라", "자율주행", "로봇택시", "안전", "사고", "충돌",
    "리콜", "조사", "허가", "캘리포니아",
]

# 차트에 쓸 5개 토픽과 키워드 매핑(대략적인 예시)
TOPIC_KEYWORDS = {
    "Safety": ["safety", "안전", "crash", "collision", "사고", "충돌"],
    "Recall": ["recall", "리콜"],
    "Collision": ["collision", "crash", "충돌", "사고"],
    "Autopilot": ["fsd", "autopilot", "self-driving", "자율주행", "driverless"],
    "Quality": ["quality", "결함", "불량", "issue", "problem"],
}


@dataclass
class SentimentRow:
    topic: str
    score: float
    sentiment: str  # "Negative" | "Mixed" | "Neutral" | "Positive"


# ----- 1. Reddit 크롤링 (requests 기반, 동기) -----

def _crawl_one_keyword(keyword: str, max_posts: int = 40) -> List[Dict[str, Any]]:
    """
    하나의 키워드에 대해 Reddit 검색(JSON)을 사용해 글 목록 수집.
    - 최근 1년(t=year) 범위
    - title + selftext를 content로 사용
    - 실패 시 더미 데이터로 fallback
    """
    search_q = urllib.parse.quote_plus(keyword)
    # t=year : 최근 1년, type=link(게시물)
    url = (
        f"https://www.reddit.com/search.json"
        f"?q={search_q}&t=year&type=link&sort=relevance&limit={max_posts}"
    )
    headers = {
        # Reddit은 User-Agent 없으면 429/403 잘 내서 대충이라도 넣어준다
        "User-Agent": "fsd-research-bot/0.1 by secha-capstone",
    }

    try:
        print(f"[fsd_tools] Reddit JSON 검색: keyword='{keyword}' → {url}")
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        posts: List[Dict[str, Any]] = []
        children = data.get("data", {}).get("children", [])
        for child in children[:max_posts]:
            d = child.get("data", {})
            title = d.get("title", "") or ""
            selftext = d.get("selftext", "") or ""
            permalink = d.get("permalink", "") or ""
            full_url = "https://www.reddit.com" + permalink if permalink else d.get("url", "")

            posts.append(
                {
                    "title": title,
                    "content": selftext,
                    "url": full_url,
                }
            )

        # 혹시 비어 있으면 더미로 fallback
        if posts:
            return posts

        print(f"[fsd_tools] keyword='{keyword}' 결과 없음 → dummy 사용")
    except Exception as e:
        print(f"[fsd_tools] Reddit 검색 실패, dummy 사용: {e}")

    # 실패 또는 결과 없음일 때: dummy 데이터
    return [
        {
            "title": f"[dummy] {keyword} sample post 1",
            "content": f"This is a dummy content about {keyword} safety and recall issues.",
            "url": "https://example.com/dummy1",
        },
        {
            "title": f"[dummy] {keyword} sample post 2",
            "content": f"Another dummy article mentioning {keyword} and FSD performance.",
            "url": "https://example.com/dummy2",
        },
    ]


def crawl_posts_sync(keywords: List[str], max_posts: int = 40) -> pd.DataFrame:
    """
    여러 키워드에 대해 순차적으로 Reddit JSON 검색 → pandas DataFrame으로 변환.
    (동기 함수라 LangGraph/일반 Python 코드에서 바로 호출 가능)
    """
    rows: List[Dict[str, Any]] = []

    for kw in keywords:
        posts = _crawl_one_keyword(kw, max_posts=max_posts)
        for p in posts:
            rows.append(
                {
                    "keyword": kw,
                    "title": p.get("title", ""),
                    "content": p.get("content", ""),
                    "url": p.get("url", ""),
                }
            )

    df = pd.DataFrame(rows)
    if not df.empty:
        df["text"] = (df["title"].fillna("") + " " + df["content"].fillna("")).str.strip()
    else:
        df["text"] = pd.Series(dtype=str)

    return df


# ----- 2. 감성 분석 -----

_sia: SentimentIntensityAnalyzer | None = None


def _get_sia() -> SentimentIntensityAnalyzer:
    global _sia
    if _sia is None:
        _sia = SentimentIntensityAnalyzer()
    return _sia


def run_sentiment(df: pd.DataFrame) -> pd.DataFrame:
    """
    각 row의 text에 대해 VADER 감성 점수(compound)를 계산해서 sentiment_score 컬럼 추가.
    """
    if df.empty:
        df["sentiment_score"] = pd.Series(dtype=float)
        return df

    sia = _get_sia()

    def score_text(text: str) -> float:
        text = text or ""
        s = sia.polarity_scores(text)
        return float(s["compound"])

    df = df.copy()
    df["sentiment_score"] = df["text"].astype(str).map(score_text)
    return df


# ----- 3. 차트용 5개 토픽으로 집계 -----

def _score_to_label(score: float) -> str:
    """
    -1 ~ +1 감성 점수를 라벨로 변환하는 간단한 규칙.
    """
    if score < -0.2:
        return "Negative"
    if score < 0.1:
        return "Mixed"
    if score < 0.3:
        return "Neutral"
    return "Positive"


def aggregate_to_topics(df: pd.DataFrame) -> List[SentimentRow]:
    """
    TOPIC_KEYWORDS에 따라 게시글을 5개 토픽으로 매핑하고,
    각 토픽별 평균 sentiment_score를 계산.
    """
    rows: List[SentimentRow] = []

    for topic, keywords in TOPIC_KEYWORDS.items():
        if df.empty:
            avg = 0.0
        else:
            pattern = "|".join(re.escape(k) for k in keywords)
            mask = df["text"].str.contains(pattern, case=False, na=False)
            if mask.any():
                avg = float(df.loc[mask, "sentiment_score"].mean())
            else:
                avg = 0.0

        label = _score_to_label(avg)
        rows.append(SentimentRow(topic=topic, score=avg, sentiment=label))

    return rows


# ----- 4. LDA 토픽 모델링 -----

def run_lda_topics(df: pd.DataFrame, n_topics: int = 3, n_words: int = 6) -> List[Dict[str, Any]]:
    """
    크롤링된 전체 텍스트에 대해 LDA를 돌려,
    각 토픽별 상위 키워드 리스트를 리턴.
    """
    if df.empty:
        return []

    texts = df["text"].astype(str).tolist()
    vectorizer = CountVectorizer(
        max_df=0.95,
        min_df=2,
        stop_words="english",
    )
    X = vectorizer.fit_transform(texts)

    lda = LatentDirichletAllocation(
        n_components=n_topics,
        learning_method="batch",
        random_state=42,
    )
    lda.fit(X)

    feature_names = vectorizer.get_feature_names_out()
    topics: List[Dict[str, Any]] = []

    for topic_idx, topic in enumerate(lda.components_):
        top_indices = topic.argsort()[:-n_words - 1:-1]
        words = [feature_names[i] for i in top_indices]
        topics.append(
            {
                "topic_id": topic_idx,
                "keywords": words,
            }
        )

    return topics


# ----- 5. 상위 함수: 하나의 "툴"로 사용할 진입점 -----

def analyze_market_sentiment(
    user_query: str,
    selected_keywords: List[str],
    max_posts: int = 40,
) -> Dict[str, Any]:
    """
    LangGraph 에이전트가 호출할 단일 엔트리 함수.

    1) selected_keywords 로 Reddit 검색(JSON) 크롤링
    2) 감성 분석(VADER)
    3) 토픽별 평균 점수 → 바 차트용 데이터 생성
    4) LDA 토픽 추출
    """
    # 1) 크롤링
    df_raw = crawl_posts_sync(selected_keywords, max_posts=max_posts)

    # 2) 감성 분석
    df_scored = run_sentiment(df_raw)

    # 3) 5개 토픽으로 집계
    topic_rows = aggregate_to_topics(df_scored)
    sentiment_chart = [
        {
            "topic": r.topic,
            "score": r.score,
            "sentiment": r.sentiment,
        }
        for r in topic_rows
    ]

    # 4) LDA 토픽
    lda_topics = run_lda_topics(df_scored, n_topics=3, n_words=6)

    return {
        "sentiment_chart": sentiment_chart,
        "lda_topics": lda_topics,
        "raw_count": int(len(df_scored)),
    }
