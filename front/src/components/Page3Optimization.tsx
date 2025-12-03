// src/components/Page3Optimization.tsx
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  LineChart,
  Line,
} from "recharts";

type CoqRatio = {
  p: number; // Prevention
  a: number; // Appraisal
  f: number; // Failure
};

type CoqBarItem = {
  name: string;
  value: number;
};

type RadarItem = {
  metric: string;
  current: number;
  optimal: number;
  theoretical: number;
};

type ImprovementStep = {
  step: string;
  coq: number;
  label: string;
};

const INITIAL_COQ: CoqRatio = {
  p: 0.12,
  a: 0.4,
  f: 0.28,
};

const OPTIMAL_COQ: CoqRatio = {
  p: 0.23,
  a: 0.42,
  f: 0.34,
};

const THEORETICAL_COQ: CoqRatio = {
  p: 0.3,
  a: 0.45,
  f: 0.25,
};

function calcTotalCoq(r: CoqRatio): number {
  return r.p + r.a + r.f;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export default function Page3Optimization() {
  const [coq, setCoq] = useState<CoqRatio>(INITIAL_COQ);

  const handleSliderChange = (key: keyof CoqRatio) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      setCoq((prev) => ({ ...prev, [key]: clamp01(v) }));
    };

  const coqBarData: CoqBarItem[] = [
    { name: "P", value: coq.p },
    { name: "A", value: coq.a },
    { name: "F", value: coq.f },
  ];

  const initialTotal = calcTotalCoq(INITIAL_COQ);
  const currentTotal = calcTotalCoq(coq);
  const optimalTotal = calcTotalCoq(OPTIMAL_COQ);
  const totalImprovement =
    ((initialTotal - currentTotal) / initialTotal) * 100;

  const radarData: RadarItem[] = [
    {
      metric: "Prevention",
      current: coq.p,
      optimal: OPTIMAL_COQ.p,
      theoretical: THEORETICAL_COQ.p,
    },
    {
      metric: "Appraisal",
      current: coq.a,
      optimal: OPTIMAL_COQ.a,
      theoretical: THEORETICAL_COQ.a,
    },
    {
      metric: "Failure",
      current: coq.f,
      optimal: OPTIMAL_COQ.f,
      theoretical: THEORETICAL_COQ.f,
    },
  ];

  const improvementSteps: ImprovementStep[] = [
    { step: "현재", coq: 1.53, label: "기준 COQ" },
    { step: "A 조정", coq: 1.31, label: "A 10% 감소" },
    { step: "P 조정", coq: 1.19, label: "P 5% 증가" },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 px-10 py-8">
      {/* 상단 헤더 + 4 카드 */}
      <div className="mb-8 flex items-start justify-between gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Quality Cost Optimization
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Where Should Tesla Move? (Optimal Ratio)
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Optimized COQ", value: optimalTotal.toFixed(2) },
            { label: "Prevention (P)", value: OPTIMAL_COQ.p.toFixed(2) },
            { label: "Appraisal (A)", value: OPTIMAL_COQ.a.toFixed(2) },
            { label: "Failure (F)", value: OPTIMAL_COQ.f.toFixed(2) },
          ].map((card, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white px-4 py-3 shadow-md border border-gray-100"
            >
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 중단: Simulation / Radar / Key Insights */}
      <div className="mb-6 grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)] gap-6">
        {/* Simulation */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            COQ Optimizing Simulation
          </h2>
          <div className="grid grid-cols-[minmax(0,2fr)_220px] gap-6">
            {/* Bar chart */}
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={coqBarData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#4b5563"
                    width={40}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p>
                  • 현재 COQ 비율:{" "}
                  <span className="font-semibold text-red-600">
                    {currentTotal.toFixed(2)}
                  </span>{" "}
                  (초기: {initialTotal.toFixed(2)})
                </p>
                <p>
                  • 최종 COQ 개선률:{" "}
                  <span className="font-semibold text-red-600">
                    {totalImprovement.toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>

            {/* 슬라이더 박스 */}
            <div className="rounded-2xl border border-gray-100 bg-neutral-50 px-4 py-3 shadow-inner">
              <p className="mb-2 text-xs font-semibold text-gray-700">
                Adjust COQ Ratio
              </p>

              <div className="space-y-4">
                {/* P */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600">
                    <span>Prevention (P)</span>
                    <span className="font-semibold text-gray-800">
                      {coq.p.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.6}
                    step={0.01}
                    value={coq.p}
                    onChange={handleSliderChange("p")}
                    className="w-full accent-red-500"
                  />
                </div>

                {/* A */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600">
                    <span>Appraisal (A)</span>
                    <span className="font-semibold text-gray-800">
                      {coq.a.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.01}
                    value={coq.a}
                    onChange={handleSliderChange("a")}
                    className="w-full accent-red-500"
                  />
                </div>

                {/* F */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600">
                    <span>Failure (F)</span>
                    <span className="font-semibold text-gray-800">
                      {coq.f.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.01}
                    value={coq.f}
                    onChange={handleSliderChange("f")}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Current vs Optimal vs Theoretical
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.3}
              />
              <Radar
                name="Optimal"
                dataKey="optimal"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.25}
              />
              <Radar
                name="Theoretical"
                dataKey="theoretical"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Insights */}
        <div className="flex h-full flex-col gap-3 rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Key Insights</h2>
          <textarea
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-400"
            placeholder="- 예: A 10% 감소가 COQ에 가장 큰 기여\n- 예: P 5% 증가는 보조적인 역할"
          />
          <textarea
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-400"
            placeholder="- Simulation 결과에 따른 추가 인사이트를 메모하세요."
          />
          <textarea
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-400"
            placeholder="- 향후 Prevention 투자 전략 등"
          />
        </div>
      </div>

      {/* 하단 두 블록 */}
      <div className="grid grid-cols-2 gap-6">
        {/* What drives bad COQ? */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            What drives bad COQ?
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-xs text-gray-700">
              <p className="font-semibold">
                • A 10% 감소가 COQ 최적화에 가장 강력한 효과
              </p>
              <p>• P 5% 증가는 보조적인 보완 효과</p>
              <p>• 최종 COQ는 1.53 → 1.19로 약 22% 개선</p>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: "Prevention", value: 1 },
                    { name: "Appraisal", value: 2 },
                    { name: "Failure", value: -2 },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#4b5563"
                    width={60}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]} fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Which change reduces COQ the most? */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Which change reduces COQ the most?
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={improvementSteps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="step"
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                    domain={[1.1, 1.6]}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="coq"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-2 text-xs text-gray-700">
              <p className="font-semibold">
                • A 10% 감소가 COQ 개선에 가장 크게 기여
              </p>
              <p>• P 5% 증가는 보조적인 역할</p>
              <p>• 총 COQ는 1.53 → 1.19로 약 22% 개선</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
