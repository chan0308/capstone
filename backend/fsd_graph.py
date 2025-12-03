# backend/fsd_graph.py
from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict, Annotated
import json
import textwrap

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    SystemMessage,
    AIMessage,
)

# Llama (Ollama)
from langchain_community.chat_models import ChatOllama

from fsd_tools import analyze_market_sentiment


# ------------------------------------------------------------
# 0. 공통 유틸
# ------------------------------------------------------------

def get_llm(model: str = "llama3.1", temperature: float = 0.1):
    """
    Llama 기반 챗모델 생성.
    """
    return ChatOllama(model=model, temperature=temperature)


def safe_json_loads(text: str) -> Dict[str, Any]:
    """
    LLM이 준 문자열을 최대한 JSON으로 파싱하기 위한 유틸.
    JSON 블록만 잘라서 로딩 시도.
    """
    text = text.strip()
    # ```json ... ``` 감싸져 있을 가능성
    if text.startswith("```"):
        text = text.strip("`")
        parts = text.split("\n", 1)
        if parts and parts[0].lower().startswith("json"):
            text = parts[1] if len(parts) > 1 else ""

    # 중괄호 기준으로 앞뒤 자르기
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        text = text[first : last + 1]

    return json.loads(text)


# ------------------------------------------------------------
# 1. 키워드 / 타입 정의
# ------------------------------------------------------------

TESLA_KEYWORD_CANDIDATES: List[str] = [
    "tesla", "musk", "fsd", "autopilot", "robotaxi", "cybercab",
    "self-driving", "autonomous driving", "driverless",
    "safety", "crash", "collision", "recall", "investigation",
    "nhtsa", "dmv", "cpuc", "disengagement", "permit", "ride-hailing",
    "테슬라", "자율주행", "로봇택시", "안전", "사고", "충돌",
    "리콜", "조사", "허가", "캘리포니아",
]


class SentimentRow(TypedDict):
    topic: str
    score: float
    sentiment: str  # "Negative" | "Mixed" | "Neutral" | "Positive"


# 프론트 초기값과 동일한 차트 기본값
DEFAULT_SENTIMENT_CHART: List[SentimentRow] = [
    {"topic": "Safety",    "score": -0.42, "sentiment": "Negative"},
    {"topic": "Recall",    "score": -0.38, "sentiment": "Negative"},
    {"topic": "Collision", "score": -0.28, "sentiment": "Negative"},
    {"topic": "Autopilot", "score": -0.15, "sentiment": "Mixed"},
    {"topic": "Quality",   "score":  0.05, "sentiment": "Neutral"},
]


class ChatState(TypedDict):
    """
    LangGraph state 구조.
    - messages: 대화 히스토리
    - tool_request: LLM이 만든 툴 호출 계획
    - tool_result: 크롤링/감성분석 결과
    """
    messages: Annotated[List[BaseMessage], add_messages]
    tool_request: Optional[Dict[str, Any]]
    tool_result: Optional[Dict[str, Any]]


# ------------------------------------------------------------
# 2. 실제로 실행될 "툴" – 크롤링 + 감성분석 + LDA
# ------------------------------------------------------------

def crawl_market_sentiment(
    question: str,
    selected_keywords: List[str],
    llm,  # LangGraph에서 쓰는 LLM 인스턴스 (예: ChatOllama)
) -> Dict[str, Any]:
    ...
    lda_block = "\n".join(lda_lines) if lda_lines else "(no clear LDA topics)"

    # 🔽 여기부터 프롬프트를 한국어 버전으로 교체
    prompt = f"""
너는 테슬라 FSD(Full Self-Driving)/로보택시에 대한
시장 인식과 안전 이슈를 분석하는 리서치 보조원이다.

[사용자 질문]
{question}

[수집한 데이터 개수]
전체 문서 수: 약 {raw_count}건

[검색에 사용한 키워드]
{", ".join(selected_keywords)}

[토픽별 감성 점수 (-1 ~ +1)]
{topic_block}

[LDA 토픽 클러스터(상위 키워드)]
{lda_block}

위 정보를 바탕으로 **반드시 한국어로만** 답변하라.

요구사항:
1) Safety, Recall, Collision, Autopilot, Quality 각각에 대해
   현재 시장 인식이 어떤지 한 줄씩 요약하라.
2) 가장 부정적인 리스크 2~3가지를 bullet로 정리하라.
3) 그나마 긍정적인 신호 2~3가지를 bullet로 정리하라.
4) 전체 분위기를 한 문장으로 정리하는 결론을 써라.

형식:
- bullet point 위주로 4~6줄 정도의 간결한 요약
- 과도한 수식어는 피하고, 분석적인 톤을 유지할 것
"""

    llm_answer = llm.invoke(prompt).content

    return {
        "answer": llm_answer,
        "sentiment_chart": sentiment_chart,
        "lda_topics": lda_topics,
    }


TOOLS = {
    "crawl_market_sentiment": crawl_market_sentiment,
}


# ------------------------------------------------------------
# 3. LangGraph 노드 정의
# ------------------------------------------------------------

def planner_node(state: ChatState, llm) -> Dict[str, Any]:
    """
    사용자의 질문을 보고,
    - 어떤 도구를 쓸지
    - 어떤 키워드를 넘길지
    를 JSON으로 계획하는 노드.
    """
    system_prompt = textwrap.dedent(
        f"""
        너는 테슬라/FSD/자율주행 관련 시장 인식과 안전 이슈를 조사하는
        리서치 보조원이다.

        사용할 수 있는 도구는 하나다:

        1) "crawl_market_sentiment"
           - 설명: 테슬라 및 자율주행 관련 키워드를 기반으로 Reddit/뉴스에서
                   게시글을 수집하고, 부정/중립/긍정 감성 및 LDA 토픽을 분석한다.
           - 파라미터:
             • query: 사용자의 원래 질문 (string)
             • keywords: 검색에 사용할 상위 키워드 리스트 (string 배열, 최대 5개)

        키워드 후보는 아래 리스트에서만 고른다.
        각 질문마다, 이 중 가장 관련성이 높은 상위 3~5개를 선택해라.

        후보 키워드:
        {", ".join(TESLA_KEYWORD_CANDIDATES)}

        출력 형식(반드시 JSON만, 설명 없이):

        {{
          "name": "crawl_market_sentiment",
          "parameters": {{
            "query": "사용자 질문 그대로",
            "keywords": ["tesla", "fsd", "safety", ...]
          }}
        }}
        """
    ).strip()

    messages: List[BaseMessage] = [
        SystemMessage(content=system_prompt),
        *state["messages"],
    ]

    ai: AIMessage = llm.invoke(messages)
    tool_request = safe_json_loads(ai.content)

    return {
        "messages": [ai],
        "tool_request": tool_request,
    }


def run_tool_node(state: ChatState, llm) -> Dict[str, Any]:
    """
    planner_node가 만든 tool_request를 실제 Python 함수(툴)에 연결.
    """
    req = state.get("tool_request") or {}
    name = req.get("name")
    params = req.get("parameters") or {}

    if not name or name not in TOOLS:
        # 툴을 못 골랐거나, 이상한 이름이면 그냥 아무것도 안 함
        return {
            "tool_result": {
                "analysis_summary": "도구 호출 계획을 만들지 못했습니다.",
                "sentiment_chart": DEFAULT_SENTIMENT_CHART,
                "lda_topics": [],
            }
        }

    tool_fn = TOOLS[name]
    try:
        if name == "crawl_market_sentiment":
            # planner에서 만든 query/keywords를 우리 함수 시그니처에 맞게 매핑
            question = params.get("query", "")
            keywords = params.get("keywords", [])
            result = tool_fn(question=question, selected_keywords=keywords, llm=llm)
        else:
            # (혹시 나중에 다른 툴 늘어나면)
            result = tool_fn(**params)
    except Exception as e:
        result = {
            "analysis_summary": f"툴 실행 중 오류가 발생했습니다: {e}",
            "sentiment_chart": DEFAULT_SENTIMENT_CHART,
            "lda_topics": [],
        }

    return {"tool_result": result}


# ------------------------------------------------------------
# 4. 그래프 컴파일 + 외부에서 쓸 helper 함수
# ------------------------------------------------------------

def _build_graph():
    llm = get_llm()

    builder = StateGraph(ChatState)
    builder.add_node("planner", lambda s, _llm=llm: planner_node(s, _llm))
    builder.add_node("run_tool", lambda s, _llm=llm: run_tool_node(s, _llm))

    builder.add_edge(START, "planner")
    builder.add_edge("planner", "run_tool")
    builder.add_edge("run_tool", END)

    return builder.compile()


_graph = _build_graph()


def run_fsd_agent(user_message: str) -> Dict[str, Any]:
    """
    FastAPI에서 쓰기 좋은 헬퍼.
    인풋: 사용자 프롬프트 문자열
    아웃풋: {
      "answer": str,
      "sentiment_chart": List[SentimentRow],
      "raw_tool_result": Dict[str, Any]
    }
    """
    initial_state: ChatState = {
        "messages": [HumanMessage(content=user_message)],
        "tool_request": None,
        "tool_result": None,
    }

    final_state: ChatState = _graph.invoke(initial_state)
    tool_result = final_state.get("tool_result") or {}

    # 정상 경로: crawl_market_sentiment 가 만들어준 answer 사용
    answer = (
        tool_result.get("answer")
        or tool_result.get("analysis_summary")
        or "분석 결과를 가져오지 못했습니다."
    )
    sentiment_chart = tool_result.get("sentiment_chart", DEFAULT_SENTIMENT_CHART)

    return {
        "answer": answer,
        "sentiment_chart": sentiment_chart,
        "raw_tool_result": tool_result,
    }
