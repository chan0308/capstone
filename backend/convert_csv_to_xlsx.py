# -*- coding: utf-8 -*-
"""
convert_csv_to_xlsx.py
- Reddit 크롤링 CSV를 엑셀(xlsx)로 변환하면서 문제될 수 있는 제어문자를 정리합니다.

예)
  python convert_csv_to_xlsx.py
  python convert_csv_to_xlsx.py --in_csv tesla_evs_reddit_post.csv --out_xlsx tesla_evs_reddit_post.xlsx
"""

import os
import re
import argparse
import pandas as pd

def clean(s):
    """엑셀/한셀에서 에러 유발 가능한 제어문자 제거"""
    if isinstance(s, str):
        s = s.replace("\x00", " ")
        s = re.sub(r"[\x00-\x1F\x7F]", " ", s)
    return s

def read_csv_safely(path: str) -> pd.DataFrame:
    """인코딩 이슈 대비: utf-8-sig → utf-8 → cp949 순으로 시도"""
    encodings = ["utf-8-sig", "utf-8", "cp949"]
    last_err = None
    for enc in encodings:
        try:
            return pd.read_csv(path, dtype=str, keep_default_na=False, encoding=enc)
        except Exception as e:
            last_err = e
    raise RuntimeError(f"CSV 읽기 실패: {path} (마지막 오류: {last_err})")

def main():
    ap = argparse.ArgumentParser(description="CSV → XLSX 변환(제어문자 정리)")
    ap.add_argument("--in_csv", default="Tesla_posts_full.csv", help="입력 CSV 경로")
    ap.add_argument("--out_xlsx", default="tesla_evs_reddit_post.xlsx", help="출력 XLSX 경로")
    args = ap.parse_args()

    if not os.path.exists(args.in_csv):
        raise FileNotFoundError(f"입력 CSV를 찾을 수 없습니다: {args.in_csv}")

    print(f"읽는 중: {args.in_csv}")
    df = read_csv_safely(args.in_csv)
    print(f"행 수: {len(df)}  /  열: {list(df.columns)}")

    # 전체 셀 정리
    df = df.applymap(clean)

    # 저장
    os.makedirs(os.path.dirname(args.out_xlsx) or ".", exist_ok=True)
    df.to_excel(args.out_xlsx, index=False, engine="openpyxl")
    print(f"✅ 저장 완료: {args.out_xlsx}")

if __name__ == "__main__":
    main()
