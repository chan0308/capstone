# backend/api_server.py
from __future__ import annotations

from typing import List, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ------------------------------------------------------------
# 0. LangGraph 에이전트 가져오기 (fsd_graph)
# ------------------------------------------------------------

try:
    from fsd_graph import run_fsd_agent  # type: ignore
    HAS_FSD_GRAPH = True
    print("[api_server] fsd_graph.run_fsd_agent import 성공")
except Exception as e:
    run_fsd_agent = None  # type: ignore
    HAS_FSD_GRAPH = False
    print(f"[api_server] fsd_graph import 실패, 더미 모드로 동작합니다: {e}")


# ------------------------------------------------------------
# 1. FastAPI 기본 설정
# ------------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# 2. Pydantic 모델
# ------------------------------------------------------------

class SentimentPoint(BaseModel):
    topic: str
    score: float
    sentiment: Literal["Negative", "Mixed", "Neutral", "Positive"]


class FSDChatRequest(BaseModel):
    message: str


class FSDChatResponse(BaseModel):
    answer: str
    sentimentChart: List[SentimentPoint]


# 프론트 기본 차트와 동일한 더미 값
DEFAULT_SENTIMENT_CHART = [
    SentimentPoint(topic="Safety",    score=-0.42, sentiment="Negative"),
    SentimentPoint(topic="Recall",    score=-0.38, sentiment="Negative"),
    SentimentPoint(topic="Collision", score=-0.28, sentiment="Negative"),
    SentimentPoint(topic="Autopilot", score=-0.15, sentiment="Mixed"),
    SentimentPoint(topic="Quality",   score=0.05,  sentiment="Neutral"),
]


# ------------------------------------------------------------
# 3. 엔드포인트
# ------------------------------------------------------------

@app.post("/fsd-chat", response_model=FSDChatResponse)
async def fsd_chat(req: FSDChatRequest) -> FSDChatResponse:
    """
    프론트의 FSDChatAssistant가 호출하는 엔드포인트.
    LangGraph 에이전트(run_fsd_agent)를 한 번 돌리고,
    그 결과를 프론트에서 쓰기 좋은 형식으로 리턴.
    """
    # 1) LangGraph 에이전트 로딩 실패 → 항상 더미 응답
    if not HAS_FSD_GRAPH or run_fsd_agent is None:
        print("[/fsd-chat] run_fsd_agent 없음 → 더미 응답 반환")
        return FSDChatResponse(
            answer="백엔드 호출 중 오류가 발생했어요. 서버(fsd_graph)가 제대로 올라와 있는지 확인해 주세요.",
            sentimentChart=DEFAULT_SENTIMENT_CHART,
        )

    # 2) 정상적으로 에이전트 호출 시도
    try:
        result = run_fsd_agent(req.message)  # type: ignore[arg-type]

        # LangGraph 쪽에서 내려준 결과 파싱
        raw_chart = result.get("sentiment_chart") or []
        sentiment_chart: List[SentimentPoint] = [
            SentimentPoint(**row) for row in raw_chart
        ]

        answer = result.get("answer", "분석 결과를 가져오지 못했습니다.")
        print("[/fsd-chat] run_fsd_agent 실행 성공")

        return FSDChatResponse(
            answer=answer,
            sentimentChart=sentiment_chart,
        )

    # 3) 에이전트 실행 중 예외 → 더미 차트 + 오류 메시지
    except Exception as e:
        print(f"[/fsd-chat] run_fsd_agent 실행 중 오류, 더미로 폴백: {e}")
        return FSDChatResponse(
            answer=f"툴 실행 중 오류가 발생했습니다: {e}",
            sentimentChart=DEFAULT_SENTIMENT_CHART,
        )
