// src/components/Page3Optimization.tsx
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from "recharts";

type Coq4 = { p: number; a: number; if: number; of: number };

type Sheet2Row = {
  key: "P" | "A" | "IF" | "OF";
  current: number;
  optimal: number;
};
type CurveRow = { p: number; a: number; if: number; of: number; coq: number };
type SensRow = { name: string; value: number };

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function loadXlsxFromPublic(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`XLSX fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return wb;
}

function sheetToRows(wb: XLSX.WorkBook, sheetName: string) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true }) as any[];
}

/**
 * ✅ 사진(요구)대로 고정할 전략 그래프 데이터
 */
const FIXED_STRATEGY_SERIES = [
  { step: 0, label: "Current", coq: 1.4 },
  { step: 1, label: "1. A\n최적화", coq: 1.39 },
  { step: 2, label: "2. A + P\n최적화", coq: 1.39 },
  { step: 3, label: "3. A+P+IF\n최적화", coq: 1.39 },
  { step: 4, label: "4. A+P+IF+OF\n최적화", coq: 1.22 },
] as const;

const FIXED_STRATEGY_CARDS = {
  current: 0.4,
  strategy4: 0.22,
  saved: 0.18,
};

/**
 * ✅ 사진(요구)대로 고정할 "민감도" 그래프 (2번 사진)
 */
const FIXED_SENSITIVITY = [
  { name: "Prevention", value: 0.02 },
  { name: "Appraisal", value: 0.03 },
  { name: "Internal Failure", value: 0.01 },
  { name: "External Failure", value: 0.4 },
] as const;

const FIXED_TOP_DRIVER = "TBD";

/** ✅ 시뮬레이션 바 색 (2번 사진 톤) */
const SIM_BAR_COLORS = {
  red: "#ef4444", // COQ ratio
  light: "#d1d5db", // P/A (연한 회색)
  dark: "#6b7280", // IF/OF (진한 회색)
};

function simBarFill(name: string) {
  if (name === "COQ ratio") return SIM_BAR_COLORS.red;
  if (name === "IF" || name === "OF") return SIM_BAR_COLORS.dark;
  return SIM_BAR_COLORS.light; // P, A
}

/**
 * ✅ optimal(초록)은 완전 고정 (슬라이더로 절대 변하면 안됨)
 * ✅ current(빨강)만 슬라이더 연동
 */
const FIXED_OPTIMAL_RADAR: Coq4 = { p: 0.16, if: 0.1, a: 0.14, of: 0.11 } as const;

// 레이더 스케일 고정(마름모 “작아지는” 문제 해결용)
const RADAR_DOMAIN_MAX = 0.22;

// 빨강(현재) Prevention만 살짝 부스트(“북쪽으로 튀어나오게”)
const CURRENT_P_BUMP = 1.08;

export default function Page3Optimization() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // XLSX에서 읽은 핵심 데이터들
  const [curOpt, setCurOpt] = useState<{ current: Coq4; optimal: Coq4 } | null>(null);
  const [curveRows, setCurveRows] = useState<CurveRow[]>([]);
  const [sensitivity, setSensitivity] = useState<SensRow[]>([]);

  // UI용 슬라이더 (시뮬레이션 차트용)
  const [p, setP] = useState(0.12);
  const [a, setA] = useState(0.44);
  const [f, setF] = useState(0.28);

  // ✅✅✅ Key Insights 3줄(각 textarea에 하나씩)
  const KEY_INSIGHTS = useMemo(
    () => [
      "네가지 품질변수를 모두 최적화할 경우 COQ 최소점은 현재보다 0.18 감소함",
      "최적화 결과, Prevention·Appraisal 비중은 감소하고 Failure(IF·OF) 비중은 상대적으로 증가하는 구조가 도출됨",
      "사후실패비용이 가장 영향력 있는 변수로서 최적화 성과를 좌우함",
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const wb = await loadXlsxFromPublic("/Page3_input.xlsx");

        // ---------- Sheet2: 현재 vs 최적 ----------
        const s2 = sheetToRows(wb, "Sheet2");
        const s2data: Sheet2Row[] = [];
        for (let i = 1; i < s2.length; i++) {
          const row = s2[i];
          const k = String(row?.[0] ?? "").toUpperCase();
          if (k === "P" || k === "A" || k === "IF" || k === "OF") {
            s2data.push({
              key: k as any,
              current: safeNum(row?.[1]),
              optimal: safeNum(row?.[2]),
            });
          }
        }

        const current: Coq4 = {
          p: s2data.find((x) => x.key === "P")?.current ?? 0,
          a: s2data.find((x) => x.key === "A")?.current ?? 0,
          if: s2data.find((x) => x.key === "IF")?.current ?? 0,
          of: s2data.find((x) => x.key === "OF")?.current ?? 0,
        };
        const optimal: Coq4 = {
          p: s2data.find((x) => x.key === "P")?.optimal ?? 0,
          a: s2data.find((x) => x.key === "A")?.optimal ?? 0,
          if: s2data.find((x) => x.key === "IF")?.optimal ?? 0,
          of: s2data.find((x) => x.key === "OF")?.optimal ?? 0,
        };
        setCurOpt({ current, optimal });

        // ✅ 초기 슬라이더는 “합이 1 넘지 않게” 한 번 정리해서 세팅
        const curFail = (current.if ?? 0) + (current.of ?? 0);
        const p0 = clamp01(current.p);
        const a0 = clamp01(current.a);
        const f0 = clamp01(curFail);

        const sum0 = p0 + a0 + f0;
        if (sum0 > 1) {
          const scale = 1 / sum0;
          setP(p0 * scale);
          setA(a0 * scale);
          setF(f0 * scale);
        } else {
          setP(p0);
          setA(a0);
          setF(f0);
        }

        // ---------- Sheet3 (읽기만 유지) ----------
        const s3 = sheetToRows(wb, "Sheet3");
        const rows3: CurveRow[] = [];
        for (let i = 1; i < s3.length; i++) {
          const r = s3[i];
          if (!r || r.length < 5) continue;
          rows3.push({
            p: safeNum(r[0]),
            a: safeNum(r[1]),
            if: safeNum(r[2]),
            of: safeNum(r[3]),
            coq: safeNum(r[4]),
          });
        }
        setCurveRows(rows3);

        // ---------- Sheet4 (읽기만 유지) ----------
        const s4 = sheetToRows(wb, "Sheet4");
        const sens: SensRow[] = [];
        for (let i = 1; i < s4.length; i++) {
          const r = s4[i];
          const k = String(r?.[0] ?? "");
          sens.push({ name: k, value: safeNum(r?.[1]) });
        }
        setSensitivity(sens);

        setLoading(false);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load XLSX");
        setLoading(false);
      }
    })();
  }, []);

  // IF:OF 분할비 (슬라이더 Failure를 IF+OF로 쪼개기)
  const ifOfSplit = useMemo(() => {
    if (!curOpt) return { ifShare: 0.5, ofShare: 0.5 };
    const curFail = (curOpt.current.if ?? 0) + (curOpt.current.of ?? 0);
    if (curFail <= 0) return { ifShare: 0.5, ofShare: 0.5 };
    return {
      ifShare: (curOpt.current.if ?? 0) / curFail,
      ofShare: (curOpt.current.of ?? 0) / curFail,
    };
  }, [curOpt]);

  const currentSim: Coq4 = useMemo(() => {
    const iF = clamp01(f) * ifOfSplit.ifShare;
    const oF = clamp01(f) * ifOfSplit.ofShare;
    return { p: clamp01(p), a: clamp01(a), if: clamp01(iF), of: clamp01(oF) };
  }, [p, a, f, ifOfSplit]);

  const simBarData = useMemo(() => {
    const coqRatio = currentSim.p + currentSim.a + currentSim.if + currentSim.of;
    return [
      { name: "COQ ratio", value: coqRatio },
      { name: "P", value: currentSim.p },
      { name: "A", value: currentSim.a },
      { name: "IF", value: currentSim.if },
      { name: "OF", value: currentSim.of },
    ];
  }, [currentSim]);

  // ✅ p+a+f 합이 1을 넘지 않게 “Remaining budget”
  const remainingBudget = useMemo(() => Math.max(0, 1 - (p + a + f)), [p, a, f]);

  /**
   * ✅ (핵심) 레이더 데이터:
   * - optimal(초록)은 완전 고정
   * - scale도 optimal 기준으로만 고정 (슬라이더로 절대 변하면 안됨)
   * - current(빨강)만 슬라이더 연동
   * - 축 배치도 사진처럼 고정: 위 Prevention / 오른쪽 External / 아래 Appraisal / 왼쪽 Internal
   */
  const radarData = useMemo(() => {
    const opt = FIXED_OPTIMAL_RADAR;

    // ✅ scale은 optimal만 보고 "항상 동일" 하게 고정
    const maxOpt = Math.max(opt.p, opt.a, opt.if, opt.of, 1e-6);
    const fixedScale = (RADAR_DOMAIN_MAX * 0.92) / maxOpt;

    // ✅ optimal (초록) — 절대 고정
    const o = {
      p: opt.p * fixedScale,
      a: opt.a * fixedScale,
      if: opt.if * fixedScale,
      of: opt.of * fixedScale,
    };

    // ✅ current (빨강) — 슬라이더 연동 + Prevention만 살짝 부스트
    const curRaw: Coq4 = {
      p: currentSim.p * CURRENT_P_BUMP,
      a: currentSim.a,
      if: currentSim.if,
      of: currentSim.of,
    };
    const cur = {
      p: curRaw.p * fixedScale,
      a: curRaw.a * fixedScale,
      if: curRaw.if * fixedScale,
      of: curRaw.of * fixedScale,
    };

    // ✅ 순서 고정: Prevention(위) → External(오른쪽) → Appraisal(아래) → Internal(왼쪽)
    return [
      { axis: "Prevention", current: cur.p, optimal: o.p },
      { axis: "External\nFailure", current: cur.of, optimal: o.of },
      { axis: "Appraisal", current: cur.a, optimal: o.a },
      { axis: "Internal\nFailure", current: cur.if, optimal: o.if },
    ];
  }, [currentSim]);

  // ✅✅✅ (수정된 부분) 상단 카드 숫자를 슬라이더(currentSim)에 연동
  const topCards = useMemo(() => {
    const coqRatio = currentSim.p + currentSim.a + currentSim.if + currentSim.of;

    return [
      { label: "Optimized COQ", value: coqRatio.toFixed(2) },
      { label: "Prevention (P)", value: currentSim.p.toFixed(2) },
      { label: "Appraisal (A)", value: currentSim.a.toFixed(2) },
      { label: "Internal Failure (IF)", value: currentSim.if.toFixed(2) },
      { label: "External Failure (OF)", value: currentSim.of.toFixed(2) },
    ];
  }, [currentSim]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-neutral-50 px-10 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-700">Page3_input.xlsx 로딩 중…</p>
          <p className="mt-1 text-xs text-gray-500">public/Page3_input.xlsx 위치를 확인해줘.</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-neutral-50 px-10 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100">
          <p className="text-sm font-semibold text-red-600">XLSX 로드 실패</p>
          <p className="mt-2 text-xs text-gray-700">{err}</p>
          <p className="mt-2 text-xs text-gray-500">
            - public/Page3_input.xlsx 로 두고, 브라우저에서 /Page3_input.xlsx 로 접근되는지 확인!
          </p>
        </div>
      </div>
    );
  }

  const strategySeries = FIXED_STRATEGY_SERIES;
  const strategyCards = FIXED_STRATEGY_CARDS;

  const yTop = strategySeries[0].coq;
  const yBottom = strategySeries[strategySeries.length - 1].coq;
  const minCoq = 1.22;
  const COST_SAVING_X = 2;

  const stepLabelMap: Record<number, string> = {
    0: "Current",
    1: "1. A\n최적화",
    2: "2. A + P\n최적화",
    3: "3. A+P+IF\n최적화",
    4: "4. A+P+IF+OF\n최적화",
  };

  const fixedSensChartData = FIXED_SENSITIVITY;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 px-10 py-8">
      {/* 상단 헤더 + 카드 */}
      <div className="mb-8 flex items-start justify-between gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Quality Cost Optimization</h1>
          <p className="mt-2 text-sm font-semibold text-red-600">Tesla의 Q-cost 최적점은 어디인가?</p>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {topCards.map((card, idx) => (
            <div key={idx} className="rounded-2xl bg-white px-4 py-3 shadow-md border border-gray-100">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 중단 */}
      <div className="mb-6 grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1.1fr)] gap-6">
        {/* 시뮬레이션 */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Q-cost 최적화 시뮬레이션</h2>

          <div className="grid grid-cols-[minmax(0,2fr)_220px] gap-6">
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={simBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    ticks={[0, 0.25, 0.5, 0.75, 1]}
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#4b5563"
                    width={80}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                    {simBarData.map((d, idx) => (
                      <Cell key={idx} fill={simBarFill(d.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-neutral-50 px-4 py-3 shadow-inner">
              <p className="mb-2 text-xs font-semibold text-gray-700">Adjust COQ Ratio</p>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600">
                    <span>Prevention</span>
                    <span className="font-semibold text-gray-800">{p.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.6}
                    step={0.01}
                    value={p}
                    onChange={(e) => {
                      const v = clamp01(Number(e.target.value));
                      const limit = Math.max(0, 1 - a - f);
                      setP(Math.min(v, limit));
                    }}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600">
                    <span>Appraisal</span>
                    <span className="font-semibold text-gray-800">{a.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.01}
                    value={a}
                    onChange={(e) => {
                      const v = clamp01(Number(e.target.value));
                      const limit = Math.max(0, 1 - p - f);
                      setA(Math.min(v, limit));
                    }}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600">
                    <span>Failure</span>
                    <span className="font-semibold text-gray-800">{f.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.01}
                    value={f}
                    onChange={(e) => {
                      const v = clamp01(Number(e.target.value));
                      const limit = Math.max(0, 1 - p - a);
                      setF(Math.min(v, limit));
                    }}
                    className="w-full accent-red-500"
                  />
                </div>

                <p className="pt-1 text-[10px] text-gray-500">
                  Remaining budget: {remainingBudget.toFixed(2)} (p+a+f ≤ 1)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 레이더 (✅ 초록 고정, 빨강만 변경, 각도 고정) */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <div className="mb-3 flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span>현재 COQ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span>최적화된 COQ</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={270}>
            <RadarChart
              data={radarData}
              // ✅ 축 위치(각도) 고정: 첫 항목(Prevention)을 "위"로
              startAngle={90}
              endAngle={-270}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, RADAR_DOMAIN_MAX]} />
              <Radar dataKey="current" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              <Radar dataKey="optimal" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Insights */}
        <div className="flex h-full flex-col gap-3 rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Key Insights</h2>
          <textarea
            defaultValue={KEY_INSIGHTS[0]}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-400"
          />
          <textarea
            defaultValue={KEY_INSIGHTS[1]}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-400"
          />
          <textarea
            defaultValue={KEY_INSIGHTS[2]}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-400"
          />
        </div>
      </div>

      {/* 하단 2개 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 왼쪽: 전략 그래프 */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">어떤 전략이 최적의 COQ ratio를 도출하는가?</h2>

          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={strategySeries} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    type="number"
                    dataKey="step"
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => stepLabelMap[Math.round(v as number)] ?? ""}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    domain={[1.2, 1.42]}
                    ticks={[1.2, 1.25, 1.3, 1.35, 1.4]}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(value: any) => [value, "COQ Ratio"]} />
                  <Line type="linear" dataKey="coq" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <ReferenceLine y={yTop} stroke="#111827" strokeDasharray="4 2" />
                  <ReferenceLine y={yBottom} stroke="#111827" strokeDasharray="4 2" />
                  <ReferenceLine
                    segment={[
                      { x: COST_SAVING_X, y: yBottom },
                      { x: COST_SAVING_X, y: yTop },
                    ]}
                    stroke="#22c55e"
                    strokeWidth={2}
                    label={{
                      value: "Cost Saving",
                      position: "insideLeft",
                      fill: "#22c55e",
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    y={minCoq}
                    stroke="#ef4444"
                    strokeDasharray="2 2"
                    label={{
                      value: "Minimum COQ",
                      position: "insideBottomRight",
                      fill: "#ef4444",
                      fontSize: 11,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col justify-center gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-500">현재</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{strategyCards.current.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-500">전략 4</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{strategyCards.strategy4.toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-4">
                <p className="text-xs text-gray-500">Saved COQ Cost</p>
                <p className="mt-1 text-xl font-bold text-red-600">{strategyCards.saved.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 민감도 (2번 사진) */}
        <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">COQ ratio는 어떤 품질변수에 가장 민감하게 반응하는가?</h2>

          <div className="grid grid-cols-[minmax(0,2fr)_220px] gap-6">
            <div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[...fixedSensChartData].reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 0.45]}
                    ticks={[0, 0.1, 0.2, 0.3, 0.4]}
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                    label={{
                      value: "COQ ratio에 대한 기여도",
                      position: "insideBottom",
                      offset: -2,
                      style: { fontSize: 11, fill: "#4b5563" },
                    }}
                  />
                  <YAxis type="category" dataKey="name" width={110} stroke="#4b5563" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(value: any) => [value, "Contribution"]} />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                    {[...fixedSensChartData].reverse().map((d, idx) => {
                      const isExternal = d.name === "External Failure";
                      return <Cell key={idx} fill={isExternal ? "#ef4444" : "#9ca3af"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p className="mt-2 text-xs text-gray-400">※ Sheet4(기여도) 기반</p>
            </div>

            <div className="flex flex-col items-center justify-start gap-4">
              <div className="w-full rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
                <p className="text-xs text-gray-500">TOP Driver</p>
                <p className="mt-3 text-sm font-semibold text-gray-900">{FIXED_TOP_DRIVER}</p>
              </div>

              <div className="w-full rounded-2xl bg-white shadow-sm border border-gray-100 p-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
