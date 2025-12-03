# -*- coding: utf-8 -*-
"""
reddit_sentiment.py
- 입력: tesla_evs_reddit_post.xlsx (또는 --in_xlsx로 지정)
- 동작: title / content / comments(앞 N개) 감성분석
- 출력: reddit_tesla_sentiment.xlsx / .csv

사용 예)
  python reddit_sentiment.py
  python reddit_sentiment.py --in_xlsx tesla_evs_reddit_post.xlsx --out_xlsx out.xlsx --comments_top_k 5
"""

import os
import re
import ast
import json
import argparse
from typing import List, Any, Optional, Dict

import pandas as pd
from transformers import pipeline


# -----------------------------
# 유틸
# -----------------------------
def load_df(path: str) -> pd.DataFrame:
    """
    엑셀 스타일 손상 등으로 openpyxl이 실패할 수 있어 calamine 폴백을 자동 적용.
    pip install pandas-calamine 필요.
    """
    ext = os.path.splitext(path)[1].lower()
    if ext in (".xlsx", ".xlsm", ".xls"):
        # 1차: openpyxl
        try:
            return pd.read_excel(path, engine="openpyxl")
        except Exception as e_openpyxl:
            # 2차: calamine (스타일 무시, 데이터 중심)
            try:
                return pd.read_excel(path, engine="calamine")
            except Exception:
                # calamine도 실패하면 최초 예외를 올림
                raise e_openpyxl
    elif ext == ".csv":
        # 가끔 CSV로만 있는 경우도 대비
        return pd.read_csv(path, encoding="utf-8-sig")
    else:
        raise ValueError(f"지원하지 않는 입력 확장자: {ext}")

def clean_text(s: Any) -> str:
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    s = str(s)
    # 제어문자 제거 (한셀/엑셀 호환성)
    s = s.replace("\x00", " ")
    s = re.sub(r"[\x00-\x1F\x7F]", " ", s)
    return s.strip()

def parse_comments_cell(x: Any) -> List[str]:
    """
    comments 컬럼이
      - 파이썬 리스트 문자열 ['a','b'] 이거나
      - JSON 문자열 ["a","b"] 이거나
      - 그냥 긴 문자열(개행으로 이어진)일 때
    를 모두 처리.
    """
    if x is None or (isinstance(x, float) and pd.isna(x)):
        return []
    if isinstance(x, list):
        return [clean_text(t) for t in x if str(t).strip()]

    s = str(x).strip()
    if not s:
        return []

    # JSON → list
    try:
        val = json.loads(s)
        if isinstance(val, list):
            return [clean_text(t) for t in val if str(t).strip()]
    except Exception:
        pass

    # 파이썬 literal → list
    try:
        val = ast.literal_eval(s)
        if isinstance(val, list):
            return [clean_text(t) for t in val if str(t).strip()]
    except Exception:
        pass

    # 개행 기준 분리
    parts = [clean_text(t) for t in s.splitlines() if t.strip()]
    return parts

def make_pipeline(model_name: str):
    # CPU만 있어도 동작. GPU가 있다면 자동 사용.
    return pipeline(
        "sentiment-analysis",
        model=model_name,
        truncation=True,          # 토크나이저에서 잘라줌
        max_length=256,           # 너무 긴 텍스트는 256 토큰까지만
        # device_map="auto"       # 필요시 주석 해제
    )

def analyze_single(text: str, nlp) -> Optional[str]:
    text = clean_text(text)
    if not text:
        return None
    res = nlp(text)[0]  # {'label': 'positive|neutral|negative', 'score': ...}
    return res.get("label")

def analyze_batch(texts: List[str], nlp) -> List[Optional[str]]:
    # 빈 문자열은 None 처리
    payload = [clean_text(t) if clean_text(t) else " " for t in texts]
    outputs = nlp(payload)
    labels = []
    for out, raw in zip(outputs, texts):
        if not clean_text(raw):
            labels.append(None)
        else:
            labels.append(out.get("label"))
    return labels


# -----------------------------
# 메인
# -----------------------------
def main():
    ap = argparse.ArgumentParser(description="Reddit 감성분석 (RoBERTa)")
    ap.add_argument("--in_xlsx", default="tesla_evs_reddit_post.xlsx", help="입력 파일(.xlsx 또는 .csv)")
    ap.add_argument("--out_xlsx", default="reddit_tesla_sentiment.xlsx", help="출력 엑셀 파일")
    ap.add_argument("--out_csv",  default="reddit_tesla_sentiment.csv",  help="출력 CSV 파일")
    ap.add_argument("--comments_top_k", type=int, default=5, help="댓글 상위 N개만 분석")
    ap.add_argument("--model", default="cardiffnlp/twitter-roberta-base-sentiment-latest", help="허깅페이스 모델 이름")
    args = ap.parse_args()

    print(f"입력 로드: {args.in_xlsx}")
    df = load_df(args.in_xlsx)

    # 존재 컬럼 가드
    for col in ("title", "content", "comments"):
        if col not in df.columns:
            df[col] = ""

    # 정리
    df["title"] = df["title"].map(clean_text)
    df["content"] = df["content"].map(clean_text)
    df["comments"] = df["comments"].map(parse_comments_cell)

    print("모델 로딩 중...")
    nlp = make_pipeline(args.model)
    print("모델 준비 완료")

    # 타이틀/본문: 배치로 빠르게
    titles = df["title"].tolist()
    contents = df["content"].tolist()

    print("타이틀 감성분석...")
    df["title_sentiment"] = analyze_batch(titles, nlp)

    print("본문 감성분석...")
    df["content_sentiment"] = analyze_batch(contents, nlp)

    # 댓글: 각 행마다 앞 N개만, 리스트로 라벨 저장
    K = args.comments_top_k
    print(f"댓글 감성분석… (각 행 앞 {K}개)")
    comments_labels: List[List[Optional[str]]] = []
    for comments in df["comments"]:
        if isinstance(comments, list) and len(comments) > 0:
            sub = comments[:K]
            labels = analyze_batch(sub, nlp)
        else:
            labels = []
        comments_labels.append(labels)

    df["comments_sentiment"] = comments_labels

    # 저장
    # 리스트 컬럼을 엑셀/CSV 호환 문자열로 바꾸기
    df_to_save = df.copy()
    df_to_save["comments"] = df_to_save["comments"].apply(
        lambda xs: "\n".join(xs) if isinstance(xs, list) else ""
    )
    df_to_save["comments_sentiment"] = df_to_save["comments_sentiment"].apply(
        lambda xs: ", ".join([x if x is not None else "None" for x in xs]) if isinstance(xs, list) else ""
    )

    os.makedirs(os.path.dirname(args.out_xlsx) or ".", exist_ok=True)
    # 엑셀 저장 시도 (openpyxl 필요). 실패해도 CSV는 항상 저장.
    try:
        df_to_save.to_excel(args.out_xlsx, index=False)
        print(f"엑셀 저장 완료: {args.out_xlsx}")
    except Exception as e:
        print(f"[경고] 엑셀 저장 실패: {e}")

    df_to_save.to_csv(args.out_csv, index=False, encoding="utf-8-sig")
    print(f"CSV 저장 완료: {args.out_csv}")

    print("샘플 미리보기:")
    print(df_to_save[["title", "title_sentiment", "content_sentiment", "comments_sentiment"]].head())


if __name__ == "__main__":
    main()

