# build_topics.py
# pip install pandas openpyxl scikit-learn nltk matplotlib squarify python-calamine

import os, re, ast, importlib.util
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import squarify
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import nltk; nltk.download('stopwords', quiet=True)
from nltk.corpus import stopwords

# ✅ 기본 입력(xlsx). csv도 자동 인식하도록 load_df 사용
IN_FILE = "reddit_tesla_sentiment.xlsx"
OUT_IMG = "topics_treemap.png"

def _has(module_name: str) -> bool:
    return importlib.util.find_spec(module_name) is not None

def load_df(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext in (".xlsx", ".xls", ".xlsm"):
        # 1차: openpyxl
        try:
            return pd.read_excel(path, engine="openpyxl")
        except Exception as e_openpyxl:
            # 2차: python-calamine이 있으면 스타일 무시하고 데이터만 읽기
            if _has("python_calamine"):
                try:
                    return pd.read_excel(path, engine="calamine")
                except Exception:
                    pass
            # 폴백 실패 시 원 예외 올림
            raise e_openpyxl
    elif ext == ".csv":
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    else:
        raise ValueError(f"지원하지 않는 형식: {path}")

# ---------- 1) 데이터 로드 & 전처리 ----------
df = load_df(IN_FILE)

def parse_list(x):
    if isinstance(x, list): 
        return x
    if isinstance(x, str):
        try:
            v = ast.literal_eval(x)
            return v if isinstance(v, list) else [x]
        except:
            # "a, b, c" 같은 경우도 대비
            if "," in x:
                return [t.strip() for t in x.split(",") if t.strip()]
            return [x] if x.strip() else []
    return []

df["comments"] = df.get("comments", "").apply(parse_list)
df["text"] = (df.get("content","").fillna("").astype(str) + " " +
              df["comments"].apply(lambda xs: " ".join(map(str, xs))))

# 감성 스코어 합치기
sent_map = {"positive":1, "neutral":0, "negative":-1}

def map_or_nan(s):
    # 시리즈가 라벨 문자열이면 매핑, 아니면 숫자로 변환
    try:
        return s.map(sent_map)
    except Exception:
        return pd.to_numeric(s, errors="coerce")

def mean_comment_sent(x):
    try:
        arr = ast.literal_eval(x) if isinstance(x,str) else x
        # arr가 "pos, neg" 같은 문자열일 수 있으므로 보정
        if isinstance(arr, str):
            arr = [t.strip() for t in arr.split(",") if t.strip()]
        vals = [sent_map.get(v, np.nan) for v in arr if v in sent_map]
        return np.nanmean(vals) if len(vals)>0 else np.nan
    except:
        return np.nan

# ▶ 감성 컬럼을 수치형으로 정규화(경고 제거)
df["title_sentiment"]   = map_or_nan(df.get("title_sentiment", pd.Series(dtype=object)))
df["content_sentiment"] = map_or_nan(df.get("content_sentiment", pd.Series(dtype=object)))
df["comment_score"]     = df.get("comments_sentiment", "").apply(mean_comment_sent)

df["sentiment_score"] = (
    df["content_sentiment"]
      .combine_first(df["title_sentiment"])
      .combine_first(df["comment_score"])
      .fillna(0.0)
).astype(float)

# 텍스트 클린
stop = set(stopwords.words("english"))
def clean(s):
    s = re.sub(r"http\S+"," ", str(s).lower())
    s = re.sub(r"[^a-z0-9\s]"," ", s)
    toks = [w for w in s.split() if w not in stop and len(w)>2]
    return " ".join(toks)

df["clean"] = df["text"].apply(clean)

# ---------- 2) LDA ----------
# 0) 빈 문서 제거
df = df[df["clean"].astype(str).str.strip().astype(bool)].copy()
n_docs = len(df)
if n_docs == 0:
    raise ValueError("전처리 후 남은 문서가 없습니다. 입력 텍스트/정규식/stopwords를 확인하세요.")

# 1) 문서 수에 따라 min_df / max_df 자동 설정
if n_docs < 20:
    min_df = 1
    max_df = 1.0
elif n_docs < 100:
    min_df = 2
    max_df = 0.98
else:
    min_df = max(2, int(0.01 * n_docs))  # 상위 1% 이상 등장
    max_df = 0.95                        # 너무 흔한 단어 컷

cv = CountVectorizer(max_df=max_df, min_df=min_df)
X = cv.fit_transform(df["clean"])

# 2) 토픽 수 안전 가드
n_topics, n_top_words = 5, 10
if n_docs < n_topics:
    n_topics = max(2, min(4, n_docs))
    print(f"[안내] 문서 수가 적어 n_topics를 {n_topics}로 조정합니다.")

# 3) 어휘 비었는지 확인
if X.shape[1] == 0:
    raise ValueError(
        f"어휘가 비었습니다. (n_docs={n_docs}, min_df={min_df}, max_df={max_df})\n"
        "→ min_df를 더 낮추거나 max_df를 높이고, 정규식/stopwords를 완화해 주세요."
    )

lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
W = lda.fit_transform(X)            # (N x K)
H = lda.components_                 # (K x V)
vocab = np.array(cv.get_feature_names_out())

topic_words = []
for k in range(n_topics):
    top_idx = H[k].argsort()[::-1][:n_top_words]
    topic_words.append(list(vocab[top_idx]))

# 토픽별 감성: 문서 감성을 토픽 비중으로 가중 평균
topic_sent = (W * df["sentiment_score"].values[:,None]).sum(axis=0) / (W.sum(axis=0)+1e-9)

# ---------- 3) 트리맵 시각화 ----------
sizes, labels, colors = [], [], []
for k in range(n_topics):
    for w in topic_words[k]:
        sizes.append(1)  # 단어 동일 크기
        labels.append(f"Topic {k+1}\n{w}")
        colors.append(topic_sent[k])

fig, ax = plt.subplots(figsize=(10,6))
# 가독성을 위해 밝은 배경 + 검정 라벨
fig.patch.set_facecolor("#ffffff")
ax.set_facecolor("#ffffff")

norm = plt.Normalize(-1,1)
cmap = plt.cm.RdBu_r
color_vals = [cmap(norm(c)) for c in colors]

squarify.plot(
    sizes=sizes, label=labels, color=color_vals, pad=True, ax=ax,
    text_kwargs={"color":"black","fontsize":8},  # ← 요청: 글자 검정
    edgecolor="black", linewidth=0.5
)
ax.set_title("Tesla: LDA Topics with Sentiment Scores", color="black", fontsize=16, pad=12)
ax.axis("off")

# ✅ colorbar를 ax에 명시적으로 붙임
sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm); sm.set_array([])
cbar = plt.colorbar(sm, ax=ax)
cbar.set_label("Sentiment", color="black")
plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='black')

plt.tight_layout()
fig.savefig(OUT_IMG, dpi=160, bbox_inches="tight")
plt.close(fig)
print(f"✅ 저장 완료: {OUT_IMG}")

