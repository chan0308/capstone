// src/components/Page2OTARecall.tsx
import { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, RefreshCw, TrendingDown, Settings, Car } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import FSDChatAssistant from "./FSDChatAssistant";

// 페이지 안에서 사용할 타입
type SentimentRow = {
  topic: string;
  score: number;
  sentiment: "Negative" | "Neutral" | "Positive";
};

// 🔹 Electrical System 도넛 – 3조각(회색–빨강–회색), 빨강은 약 1/3
const ELECTRICAL_DONUT_DATA = [
  { name: "Other Left", value: 1 },
  { name: "Software + ADAS", value: 1 },
  { name: "Other Right", value: 1 },
];

// 🔹 가운데 막대그래프용 데이터 (Software는 2단 스택 막대)
const SOFTWARE_BAR_DATA = [
  { name: "A", base: 1, highlight: 0 },
  { name: "B", base: 2.2, highlight: 0 },
  { name: "C", base: 4, highlight: 0 },
  { name: "Software", base: 4.2, highlight: 2.8 },
  { name: "D", base: 2.1, highlight: 0 },
];

// 🔹 소프트웨어 리콜 안에서 General vs ADAS (%)
const SOFTWARE_SPLIT = {
  general: 61.6,
  adas: 38.4,
};

const modelRecallData = [
  { model: "MODEL S", recalls: 18 },
  { model: "MODEL 3", recalls: 42 },
  { model: "MODEL X", recalls: 15 },
  { model: "MODEL Y", recalls: 33 },
  { model: "Cybertruck", recalls: 9 },
];

const DONUT_MAIN = "#ef4444";
const DONUT_OTHER = "#d4d4d8";

// ✅ public 폴더 경로(웹에서는 / 로 접근)
const MODEL3_IMG_SRC = "/tesla_model3.png";

// ✅ 네가 public에 넣어둔 “1번 사진(그래프 이미지)” 파일명으로 맞춰서 수정해!
const TOTAL_RECALL_CHART_IMG = "/model_total_recall.png";

export default function Page2OTARecall() {
  // 기본 데이터 (초기값) – 질문 전까지 보여줄 베이스
  const [sentimentData, setSentimentData] = useState<SentimentRow[]>([
    { topic: "Safety", score: -0.42, sentiment: "Negative" },
    { topic: "Recall", score: -0.38, sentiment: "Negative" },
    { topic: "Collision", score: -0.28, sentiment: "Negative" },
    { topic: "Autopilot", score: -0.15, sentiment: "Neutral" },
    { topic: "Quality", score: 0.05, sentiment: "Neutral" },
  ]);

  // 부정 / 중립 / 긍정 3단계 색상 규칙
  const getBarColor = (score: number) => {
    if (score < -0.2) return "#dc2626"; // Negative (red)
    if (score > 0.2) return "#16a34a"; // Positive (green)
    return "#737373"; // Neutral (gray)
  };

  const topCards = [
    {
      title: "① 로보택시 안전에 대한 경쟁력",
      desc: "로보택시 시장에서는 품질에 대한 안전성을 바탕으로 쌓여진 소비자의 신뢰도가 경쟁력을 결정하는 핵심 요소이다.",
      icon: TrendingDown,
    },
    {
      title: "② Tesla의 Full OTA 리콜 전략",
      desc: "Tesla의 Full OTA 기반 리콜은 단기 비용 절감 효과가 있지만, 사전에 품질 불량을 예방하기 보다 리콜이 들어온 후 빠르게 해결함으로써 사후교정에 중심을 두는 경향이 있다.",
      icon: RefreshCw,
    },
    {
      title: "③ COQ 구조적 위험",
      desc: "높은 평가 비용에도 비효율적인 평가 시스템은 외부 실패비용의 변동성을 통제하지 못하며, 이는 Tesla가 로보택시 산업에서 신뢰도를 확보하는 데 구조적 제약이 된다.",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-12 space-y-10">
      {/* ===== 상단: 타이틀 + 서브 + 3개 카드 ===== */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight">
            FSD 신뢰도와 Tesla의 Full OTA 리콜 전략
          </h1>
          <p className="text-sm lg:text-base font-semibold text-rose-500">
            
            <span className="text-gray-700"></span>
          </p>
          <p className="text-sm lg:text-base text-slate-700 leading-relaxed max-w-4xl">
            
          </p>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1 + idx * 0.08,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-rose-50 rounded-3xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-rose-100 px-6 py-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900">
                  {card.title}
                </h3>
              </div>
              <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(148,163,184,0.18)] px-4 py-3 border border-rose-50">
                <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 중단: 좌측 감성 + 챗봇 / 우측 리콜 분석 ===== */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* -------- 좌측: Consumer Sentiment + Chatbot -------- */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_14px_36px_rgba(15,23,42,0.12)] p-8 flex flex-col"
        >
          <h3 className="text-2xl mb-2 text-black font-semibold">
            Consumer Sentiment Analysis
          </h3>
          <p className="text-gray-600 mb-8 text-sm font-medium">
            Reddit discussion sentiment by topic (Scale: -1 to +1)
          </p>

          {/* 그래프 영역 */}
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis
                  type="number"
                  domain={[-1, 1]}
                  stroke="#525252"
                  tick={{ fill: "#525252", fontSize: 12 }}
                  axisLine={{ stroke: "#d4d4d4" }}
                />
                <YAxis
                  dataKey="topic"
                  type="category"
                  stroke="#525252"
                  width={100}
                  tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: "#d4d4d4" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "16px",
                    color: "#000000",
                    padding: "12px 16px",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
                    backdropFilter: "blur(10px)",
                  }}
                  formatter={(value: any) => [Number(value).toFixed(2), "Sentiment Score"]}
                />
                <Bar dataKey="score" radius={[0, 12, 12, 0]}>
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 범례 */}
          <div className="mt-6 mb-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-500/40" />
              <span className="text-sm text-gray-700 font-medium">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500 shadow-lg shadow-gray-400/40" />
              <span className="text-sm text-gray-700 font-medium">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-400/40" />
              <span className="text-sm text-gray-700 font-medium">Positive</span>
            </div>
          </div>

          {/* 챗봇 */}
          <div className="mt-4">
            <FSDChatAssistant
              onUpdateSentiment={(points) => {
                setSentimentData(
                  points.map((p) => {
                    const s = p.score;
                    let sentiment: SentimentRow["sentiment"] = "Neutral";
                    if (s < -0.2) sentiment = "Negative";
                    else if (s > 0.2) sentiment = "Positive";
                    return { topic: p.topic, score: s, sentiment };
                  })
                );
              }}
            />
          </div>
        </motion.div>

        {/* -------- 우측: 리콜 구조 분석 두 개 카드 -------- */}
        <div className="flex flex-col gap-6">
          {/* ✅ Tesla는 어떤 리콜을 가장 많이 받았을까? */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_14px_36px_rgba(15,23,42,0.12)] px-8 py-6 overflow-hidden"
          >
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Tesla는 어떤 리콜을 가장 많이 받았을까?
            </h3>

            <div className="mt-4 flex flex-wrap lg:flex-nowrap items-center gap-3">
              {/* 1) 왼쪽 도넛 */}
              <div className="relative w-40 h-36 flex-shrink-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-36 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ELECTRICAL_DONUT_DATA}
                        innerRadius="35%"
                        outerRadius="100%"
                        startAngle={190}
                        endAngle={-170}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {ELECTRICAL_DONUT_DATA.map((d) => (
                          <Cell
                            key={d.name}
                            fill={d.name === "Software + ADAS" ? DONUT_MAIN : DONUT_OTHER}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 라벨 */}
                <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-[70%] flex flex-col items-start">
                  <span className="text-[11px] text-gray-700 leading-tight">Electrical</span>
                  <span className="text-[11px] font-semibold text-gray-900">System</span>
                </div>
              </div>

              {/* 1.5) 삼각형 포인터 */}
              <div className="flex-shrink-0 flex items-center justify-center w-20">
                <div className="w-[3.6rem] h-[3.6rem] rounded-full bg-rose-50 border border-rose-100 shadow-[0_8px_22px_rgba(248,113,113,0.3)] flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-14 h-14 text-rose-500">
                    <polygon points="20,16 20,48 48,32" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* 2) 소프트웨어 막대 */}
              <div className="relative flex-shrink-0 w-[200px]">
                <div className="relative bg-rose-50 rounded-2xl px-3 py-3 shadow-[0_8px_22px_rgba(244,63,94,0.12)]">
                  <p className="text-xs font-semibold text-gray-700 text-center mb-2">
                    Software
                  </p>

                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={SOFTWARE_BAR_DATA} margin={{ top: 18, right: 6, bottom: 4, left: -4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                        <YAxis domain={[0, 8]} tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                        <Tooltip />
                        <Bar dataKey="base" stackId="a" maxBarSize={22} radius={[4, 4, 0, 0]}>
                          {SOFTWARE_BAR_DATA.map((d) => (
                            <Cell key={`${d.name}-base`} fill={d.name === "Software" ? "#fecaca" : "#9ca3af"} />
                          ))}
                        </Bar>
                        <Bar dataKey="highlight" stackId="a" maxBarSize={22} radius={[4, 4, 0, 0]} fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 3) 오른쪽 비율 카드 */}
              <div className="w-full lg:w-48 mt-4 lg:mt-0 bg-white rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.12)] border border-gray-100 px-4 py-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 shadow-[0_6px_14px_rgba(59,130,246,0.35)]">
                    <Settings className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-700">일반 소프트웨어 리콜</span>
                    <span className="text-xl font-semibold text-red-500 leading-tight">
                      {SOFTWARE_SPLIT.general.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 shadow-[0_6px_14px_rgba(59,130,246,0.35)]">
                    <Car className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-700">ADAS 소프트웨어 리콜</span>
                    <span className="text-xl font-semibold text-red-500 leading-tight">
                      {SOFTWARE_SPLIT.adas.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ✅ 어떤 모델의 리콜이 가장 많이 발생했을까? (이미지로 교체 + 자동차 오버레이 + 텍스트 라벨) */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_14px_36px_rgba(15,23,42,0.12)] p-6"
          >
            <h3 className="text-lg lg:text-xl font-semibold text-black mb-2">
              어떤 모델의 리콜이 가장 많이 발생했을까?
            </h3>
            <p className="text-xs lg:text-sm text-slate-600 mb-5">
              모델별 소프트웨어/전자계통 리콜 건수를 단순화한 예시로,
              볼륨 모델인 <span className="font-semibold">MODEL 3</span>에서 리콜이
              집중되는 양상을 보여준다.
            </p>

            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-[0_10px_24px_rgba(15,23,42,0.10)] overflow-hidden">
              {/* 그래프 스샷 이미지 */}
              <img
                src={TOTAL_RECALL_CHART_IMG}
                alt="모델별 전체 리콜 발생 건수 (총계)"
                className="w-full h-auto block"
                draggable={false}
              />

                {/* ✅ 상단 빨간 바 위 라벨 2개 (옅은 빨강 / 진한 빨강) */}
                <div className="pointer-events-none absolute inset-0">
                  {/* ✅ 빨간 바가 있는 y 위치에 딱 맞춰 고정(px) */}
                  <div
                    className="absolute left-[35%] top-[52px] -translate-x-1/2 text-[12px] font-semibold text-white"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.28)" }}
                  >
                    General Software 61.6%
                  </div>
                
                  <div
                    className="absolute left-[78%] top-[52px] -translate-x-1/2 text-[12px] font-semibold text-white"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.28)" }}
                  >
                    ADAS Software 38.4%
                  </div>
                </div>


              {/* 자동차 PNG 오버레이 */}
              <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
                <img
                  src={MODEL3_IMG_SRC}
                  alt="Tesla Model 3"
                  className="w-[520px] max-w-[52vw] h-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.22)]"
                  draggable={false}
                />
                <div className="mt-1 text-xs text-slate-400 text-right">
                  Tesla <span className="font-semibold text-slate-600">MODEL 3</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
