# api_server.py
from typing import List, Literal, Optional, Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from fsd_graph import run_fsd_agent  # LangGraph 에이전트

# -------------------------------------------------
# FastAPI 앱 기본 설정
# -------------------------------------------------

app = FastAPI(title="Capstone FSD Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 필요하면 나중에 도메인 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Pydantic 모델
# -------------------------------------------------

class SentimentPoint(BaseModel):
    topic: str
    score: float  # -1 ~ +1 스케일
    sentiment: Literal["Negative", "Mixed", "Neutral", "Positive"] = "Neutral"


class LdaTopic(BaseModel):
    topic: int
    label: str
    keywords: List[str]


class FSDChatRequest(BaseModel):
    message: str   # 사용자가 보낸 질문


class FSDChatResponse(BaseModel):
    answer: str                      # LLM 요약/설명
    sentimentChart: List[SentimentPoint]  # 바 차트용 점수
    ldaTopics: Optional[List[LdaTopic]] = None  # LDA 토픽(지금은 선택)


# -------------------------------------------------
# 엔드포인트
# -------------------------------------------------

@app.post("/fsd-chat", response_model=FSDChatResponse)
async def fsd_chat(req: FSDChatRequest) -> FSDChatResponse:
    """
    2페이지 FSD Research Assistant가 호출하는 메인 엔드포인트.

    1) LangGraph 에이전트(run_fsd_agent)에 사용자의 질문을 넘기고,
    2) 리턴된 감성 차트 + LDA 토픽 + 요약 텍스트를
       프론트에서 쓰기 좋은 형태로 변환해서 내려준다.
    """
    # LangGraph 실행
    result: Dict[str, Any] = run_fsd_agent(req.message)

    # 감성 차트 변환
    raw_chart = result.get("sentiment_chart", [])
    sentiment_chart_rows = [
        SentimentPoint(**row) for row in raw_chart
    ]

    # LDA 토픽 (있으면)
    raw_tool_result = result.get("raw_tool_result") or {}
    raw_lda = raw_tool_result.get("lda_topics", []) or []
    lda_topics = [LdaTopic(**t) for t in raw_lda]

    return FSDChatResponse(
        answer=result.get("answer", "분석 결과를 가져오지 못했습니다."),
        sentimentChart=sentiment_chart_rows,
        ldaTopics=lda_topics,
    )
