import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import * as XLSX from "xlsx";
import { buildYearTicks, loadCoqFromXlsx, type PAFPoint } from "../lib/coqLoader";

// 오른쪽 최적 비율 카드용 컴포넌트
interface RatioCardProps {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
}

function RatioCard({ label, value, delta, direction }: RatioCardProps) {
  const isUp = direction === "up";
  const colorClass = isUp ? "text-red-500" : "text-gray-500";
  const bgClass = "bg-white";

  return (
    <div
      className={`${bgClass} rounded-2xl shadow-md px-5 py-4 flex items-center justify-between`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-2xl font-bold text-black">{value}</span>
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2 shadow-sm">
        <div className="w-8 h-5 flex items-center justify-center">
          {isUp ? (
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <span className={`text-xs font-semibold ${colorClass}`}>{delta}</span>
      </div>
    </div>
  );
}

function fmtRatio(n: number) {
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(2).replace(/\.00$/, "");
}

function fmtDeltaPct(n: number) {
  if (!Number.isFinite(n)) return "0.0%";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

/** ===== (추가) Efficiency용 타입 ===== */
type EfficiencyPoint = {
  date: Date;
  monthLabel: string;
  efficiency: number;
};

type TimelineItem = {
  year: number;
  status: "개선" | "중립" | "안정";
};

// "Apr 20" 형태
function monthLabelFromDate(d: Date) {
  const mon = d.toLocaleString("en-US", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon} ${yy}`;
}

// 엑셀 날짜/문자/숫자 모두 파싱
function parseMonthLike(v: any): Date | null {
  if (v == null || v === "") return null;

  if (v instanceof Date && Number.isFinite(v.getTime())) return v;

  // excel serial number
  if (typeof v === "number" && Number.isFinite(v)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = v * 24 * 60 * 60 * 1000;
    const d = new Date(excelEpoch.getTime() + ms);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  const s = String(v).trim();
  if (!s) return null;

  // "2025-01-20" 같은 ISO
  const dIso = new Date(s);
  if (Number.isFinite(dIso.getTime())) return dIso;

  // "Jan 20" / "Jan-20"
  const m1 = s.match(/^([A-Za-z]{3,})[\s\-_/]*([0-9]{2})$/);
  if (m1) {
    const monStr = m1[1].slice(0, 3).toLowerCase();
    const yy = Number(m1[2]);
    const yyyy = 2000 + yy;
    const monMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    if (monStr in monMap) {
      const d = new Date(yyyy, monMap[monStr], 1);
      return Number.isFinite(d.getTime()) ? d : null;
    }
  }

  return null;
}

/**
 * ✅ COQ Efficiency tick 규칙
 * - Jan-2020
 * - 2021, 2022, 2023, 2024, 2025 (각 연도 1월 포인트가 있으면 그걸 tick)
 * - Apr-2025(마지막 포인트)
 */
function buildEfficiencyTicks(points: EfficiencyPoint[]) {
  if (!points.length) return [] as string[];

  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstYear = sorted[0].date.getFullYear();
  const lastYear = sorted[sorted.length - 1].date.getFullYear();

  const startY = Math.min(2020, firstYear);
  const endY = Math.max(2025, lastYear);

  const ticks: string[] = [];

  for (let y = startY; y <= endY; y++) {
    const jan = sorted.find(
      (p) => p.date.getFullYear() === y && p.date.getMonth() === 0
    );
    if (jan) ticks.push(jan.monthLabel);
    else {
      const first = sorted.find((p) => p.date.getFullYear() === y);
      if (first) ticks.push(first.monthLabel);
    }
  }

  const last = sorted[sorted.length - 1].monthLabel;
  if (ticks[ticks.length - 1] !== last) ticks.push(last);

  return Array.from(new Set(ticks));
}

/** ✅ 분위수 기준 분류 */
const Q33 = 1.889647;
const Q66 = 2.485925;

function classifyEfficiency(avg: number): "개선" | "중립" | "안정" {
  if (!Number.isFinite(avg)) return "중립";
  if (avg <= Q33) return "개선";
  if (avg <= Q66) return "중립";
  return "안정";
}

/** ✅ Sheet5 컬럼 자동 탐지 (연도/평균/분류) */
function normalizeKey(k: string) {
  return String(k).replace(/\s+/g, "").toLowerCase();
}
function pickYearKey(row: any) {
  const keys = Object.keys(row || {});
  // 숫자 2020~2025 같은 값을 가진 키 우선
  for (const k of keys) {
    const v = Number(row[k]);
    if (Number.isFinite(v) && v >= 1900 && v <= 2100) return k;
  }
  // 그래도 못 찾으면 키 이름으로 추정
  const byName =
    keys.find((k) => normalizeKey(k).includes("year")) ??
    keys.find((k) => normalizeKey(k).includes("연도")) ??
    keys.find((k) => normalizeKey(k).includes("unnamed:0"));
  return byName ?? null;
}
function pickAvgKey(row: any) {
  const keys = Object.keys(row || {});
  return (
    keys.find((k) => normalizeKey(k).includes("평균")) ??
    keys.find((k) => normalizeKey(k).includes("average")) ??
    keys.find((k) => normalizeKey(k).includes("avg")) ??
    null
  );
}
function pickClassKey(row: any) {
  const keys = Object.keys(row || {});
  return (
    keys.find((k) => normalizeKey(k).includes("분류")) ??
    keys.find((k) => normalizeKey(k).includes("class")) ??
    keys.find((k) => normalizeKey(k).includes("label")) ??
    null
  );
}
function parseStatus(v: any): "개선" | "중립" | "안정" | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (s.includes("개선")) return "개선";
  if (s.includes("중립")) return "중립";
  if (s.includes("안정")) return "안정";
  return null;
}

export default function Page1COQOverview() {
  const [pafData, setPafData] = useState<PAFPoint[]>([]);
  const [recentPieData, setRecentPieData] = useState<
    { name: string; value: number }[]
  >([]);
  const [kpi, setKpi] = useState({
    P_avg: 0,
    A_avg: 0,
    F_avg: 0,
    P_deltaPct: 0,
    A_deltaPct: 0,
    F_deltaPct: 0,
  });
  const [loading, setLoading] = useState(true);

  // ✅✅✅ COQ Efficiency / Timeline state
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyPoint[]>([]);
  const [efficiencyTicks, setEfficiencyTicks] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // ✅ 여기 파일 경로만 맞추면 됨 (public 아래)
  const XLSX_URL = "/IFOF.coq_efficiency_summary.xlsx";

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // ===== 기존(P/A/F) 로딩 =====
        const { pafAll, recent } = await loadCoqFromXlsx(XLSX_URL);

        if (!alive) return;

        setPafData(pafAll);
        setRecentPieData(recent.recentPie);

        setKpi({
          P_avg: recent.P_avg,
          A_avg: recent.A_avg,
          F_avg: recent.F_avg,
          P_deltaPct: recent.P_deltaPct,
          A_deltaPct: recent.A_deltaPct,
          F_deltaPct: recent.F_deltaPct,
        });

        // ===== Sheet4/5 로딩 =====
        const res = await fetch(XLSX_URL);
        if (!res.ok) throw new Error(`Failed to fetch xlsx: ${res.status}`);
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });

        // ---- Sheet4: MONTH / COQ_Efficiency ----
        const s4 = wb.Sheets["Sheet4"];
        if (s4) {
          const rows = XLSX.utils.sheet_to_json<any>(s4, { defval: null });

          const points: EfficiencyPoint[] = rows
            .map((r) => {
              const d = parseMonthLike(r["MONTH"] ?? r["Month"] ?? r["month"]);
              const eff = Number(
                r["COQ_Efficiency"] ??
                  r["COQ Efficiency"] ??
                  r["efficiency"] ??
                  r["Efficiency"]
              );
              if (!d || !Number.isFinite(eff)) return null;

              const date = new Date(d.getFullYear(), d.getMonth(), 1);
              return {
                date,
                monthLabel: monthLabelFromDate(date),
                efficiency: eff,
              } as EfficiencyPoint;
            })
            .filter(Boolean) as EfficiencyPoint[];

          points.sort((a, b) => a.date.getTime() - b.date.getTime());

          if (alive) {
            setEfficiencyData(points);
            setEfficiencyTicks(buildEfficiencyTicks(points));
          }
        }

        // ---- ✅ Sheet5: "연도 / 평균 / 분류"를 자동으로 찾아서 그대로 표시 ----
        const s5 = wb.Sheets["Sheet5"];
        if (s5) {
          const rows = XLSX.utils.sheet_to_json<any>(s5, { defval: null });

          const items: TimelineItem[] = rows
            .map((r) => {
              const yearKey = pickYearKey(r);
              if (!yearKey) return null;

              const year = Number(r[yearKey]);
              if (!Number.isFinite(year) || year < 1900 || year > 2100) return null;

              const classKey = pickClassKey(r);
              const avgKey = pickAvgKey(r);

              // 1) Sheet5에 이미 "COQ 효율성 분류"가 있으면 그걸 그대로 사용
              const statusFromSheet = classKey ? parseStatus(r[classKey]) : null;
              if (statusFromSheet) return { year, status: statusFromSheet };

              // 2) 분류 컬럼이 없으면 평균으로 분위수 분류
              const avg = avgKey ? Number(r[avgKey]) : NaN;
              const status = classifyEfficiency(avg);
              return { year, status };
            })
            .filter(Boolean) as TimelineItem[];

          items.sort((a, b) => a.year - b.year);

          if (alive) {
            // ✅ 그래도 비면(구조가 더 깨져있으면) 3번 사진 결과로 fallback
            setTimeline(
              items.length
                ? items
                : [
                    { year: 2020, status: "안정" },
                    { year: 2021, status: "안정" },
                    { year: 2022, status: "중립" },
                    { year: 2023, status: "개선" },
                    { year: 2024, status: "중립" },
                    { year: 2025, status: "개선" },
                  ]
            );
          }
        } else {
          // Sheet5 자체가 없으면 fallback
          if (alive) {
            setTimeline([
              { year: 2020, status: "안정" },
              { year: 2021, status: "안정" },
              { year: 2022, status: "중립" },
              { year: 2023, status: "개선" },
              { year: 2024, status: "중립" },
              { year: 2025, status: "개선" },
            ]);
          }
        }
      } catch (e) {
        console.error(e);
        // 오류 나도 Timeline은 3번 사진 값으로 보여주기
        if (alive) {
          setTimeline([
            { year: 2020, status: "안정" },
            { year: 2021, status: "안정" },
            { year: 2022, status: "중립" },
            { year: 2023, status: "개선" },
            { year: 2024, status: "중립" },
            { year: 2025, status: "개선" },
          ]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // x축 tick: Jan-2020, 2021... Apr-2025 형태로 남기기(데이터에 맞춰 자동 생성)
  const xTicks = useMemo(() => buildYearTicks(pafData), [pafData]);

  // ===== 2번 사진 톤에 맞춘 팔레트 =====
  // Stream: P=노랑, A=빨강, F=파랑
  const P_FILL = "#facc15";
  const P_STROKE = "#eab308";
  const A_FILL = "#f87171";
  const A_STROKE = "#ef4444";
  const F_FILL = "#93c5fd";
  const F_STROKE = "#60a5fa";

  // Donut: P=밝은 회색, A=진한(거의 검정), F=빨강 (톤 미세 조정)
  const DONUT_P = "#d6d9de";
  const DONUT_A = "#0f172a";
  const DONUT_F = "#ef4444";

  // ✅ KEY INSIGHTS 문구 (요청한 3개 그대로)
  const KEY_INSIGHTS_TEXTS = [
    "Appraisal 중심 구조가 지속되며 효율적인 품질구조로의 전환은 제한적임",
    "실패비용은 이미 낮은 수준으로, 예방·평가 비용 증가는 한계효과 구간에 진입",
    "과하게 높은 효율성 지표를 유지해 실패비용에 대한 비율 재분배가 필요함",
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-10 py-10">
      {/* 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-extrabold text-black mb-2">
          Tesla 현재 품질비용 구조
        </h1>
        <p className="text-sm font-semibold">
          <span className="text-red-500 mr-1">Where Should Tesla Move?</span>
          <span className="text-gray-700">(Optimal Ratio)</span>
        </p>
      </motion.header>

      {/* 상단 큰 카드: Area + Donut + KPI 카드 */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="bg-white rounded-[32px] shadow-lg px-8 py-6 mb-7 flex gap-8 items-stretch"
      >
        {/* 좌측 – COQ 비율 구조 Stream(Area) */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            COQ 비율 구조 (2020.01 - 2025.04)
          </h3>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={pafData}>
                <defs>
                  {/* 파랑(상) */}
                  <linearGradient id="areaF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={F_FILL} stopOpacity={0.85} />
                    <stop offset="95%" stopColor={F_FILL} stopOpacity={0.15} />
                  </linearGradient>
                  {/* 빨강(중) */}
                  <linearGradient id="areaA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={A_FILL} stopOpacity={0.85} />
                    <stop offset="95%" stopColor={A_FILL} stopOpacity={0.15} />
                  </linearGradient>
                  {/* 노랑(하) */}
                  <linearGradient id="areaP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={P_FILL} stopOpacity={0.85} />
                    <stop offset="95%" stopColor={P_FILL} stopOpacity={0.18} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />

                <XAxis
                  dataKey="monthLabel"
                  ticks={xTicks}
                  tick={{ fontSize: 10, fill: "#737373" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />

                <YAxis
                  domain={[0, 1]}
                  tick={{ fontSize: 10, fill: "#737373" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    border: "1px solid rgba(0,0,0,0.08)",
                    padding: "10px 12px",
                  }}
                  labelStyle={{ fontSize: 11, color: "#4b5563" }}
                  itemStyle={{ fontSize: 11, color: "#111827" }}
                  formatter={(v: any) => (Number(v) * 100).toFixed(1) + "%"}
                />

                {/* ✅✅✅ 색은 파/빨/노 고정, "데이터만" 상(P)/중(A)/하(F)로 매핑 */}
                {/* 하단(노랑) = Failure_Ratio */}
                <Area
                  type="monotone"
                  dataKey="F"
                  stackId="1"
                  stroke={P_STROKE}
                  fill="url(#areaP)"
                />
                {/* 중단(빨강) = Appraisal_Ratio */}
                <Area
                  type="monotone"
                  dataKey="A"
                  stackId="1"
                  stroke={A_STROKE}
                  fill="url(#areaA)"
                />
                {/* 상단(파랑) = Prevention_Ratio */}
                <Area
                  type="monotone"
                  dataKey="P"
                  stackId="1"
                  stroke={F_STROKE}
                  strokeWidth={2}
                  fill="url(#areaF)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ✅ 범례도 색-데이터 매핑에 맞게 수정 */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: P_FILL }} />
              <span className="text-[11px] text-gray-700 font-medium">
                Failure_Ratio
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: A_STROKE }} />
              <span className="text-[11px] text-gray-700 font-medium">
                Appraisal_Ratio
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: F_STROKE }} />
              <span className="text-[11px] text-gray-700 font-medium">
                Prevention_Ratio
              </span>
            </div>
          </div>

          {loading && (
            <div className="mt-3 text-xs text-gray-500">Loading xlsx data...</div>
          )}
        </div>

        {/* 중앙 – 최근 3개월 도넛 */}
        <div className="w-[34%] flex flex-col items-center">
          <h3 className="w-full text-sm font-semibold text-gray-800 mb-4">
            COQ 비율 구조 (최근 3개월)
          </h3>

          <div className="w-full flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={recentPieData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill={DONUT_P} />
                  <Cell fill={DONUT_A} />
                  <Cell fill={DONUT_F} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-1 space-y-1 text-xs text-gray-700 self-start pl-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_P }} />
              <span>Prevention (P)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_A }} />
              <span>Appraisal (A)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_F }} />
              <span>Failure (F)</span>
            </div>
          </div>
        </div>

        {/* 오른쪽 – 최근 3개월 평균 + 증감율 (Sheet3) */}
        <div className="w-[22%] flex flex-col gap-4 justify-center">
          <RatioCard
            label="Prevention (P)"
            value={fmtRatio(kpi.P_avg)}
            delta={fmtDeltaPct(kpi.P_deltaPct)}
            direction={kpi.P_deltaPct >= 0 ? "up" : "down"}
          />
          <RatioCard
            label="Appraisal (A)"
            value={fmtRatio(kpi.A_avg)}
            delta={fmtDeltaPct(kpi.A_deltaPct)}
            direction={kpi.A_deltaPct >= 0 ? "up" : "down"}
          />
          <RatioCard
            label="Failure (F)"
            value={fmtRatio(kpi.F_avg)}
            delta={fmtDeltaPct(kpi.F_deltaPct)}
            direction={kpi.F_deltaPct >= 0 ? "up" : "down"}
          />
        </div>
      </motion.section>

      {/* 하단 레이아웃: KEY INSIGHTS / Efficiency / Timeline */}
      <section className="grid grid-cols-[1.3fr_2fr_1.1fr] gap-6">
        {/* KEY INSIGHTS 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-[32px] shadow-lg px-7 py-6 flex flex-col"
        >
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            KEY INSIGHTS
          </h3>
          <div className="flex-1 flex flex-col gap-4">
            {KEY_INSIGHTS_TEXTS.map((text, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-2xl bg-[#fef2f2] border border-[#fee2e2] shadow-inner px-5 py-4 flex items-start"
              >
                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* COQ Efficiency: Sheet4 기반 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-white rounded-[32px] shadow-lg px-7 py-6 flex flex-col"
        >
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            COQ Efficiency
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="monthLabel"
                  ticks={efficiencyTicks}
                  tick={{ fontSize: 10, fill: "#737373" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#737373" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    border: "1px solid rgba(0,0,0,0.08)",
                    padding: "10px 12px",
                  }}
                  labelStyle={{ fontSize: 11, color: "#4b5563" }}
                  itemStyle={{ fontSize: 11, color: "#111827" }}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#ef4444" }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Efficiency Timeline: 3번 사진 결과 그대로 표시(=Sheet5 분류 or fallback) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white rounded-[32px] shadow-lg px-7 py-6 flex flex-col"
        >
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Efficiency Timeline
          </h3>

          <div className="flex-1 flex flex-col gap-3 mt-1">
            {timeline.map((item) => {
              const isGood = item.status === "개선";
              const isStable = item.status === "안정";

              const dotColor = isGood
                ? "bg-red-500"
                : isStable
                ? "bg-green-400"
                : "bg-gray-400";

              const badgeBg = isGood
                ? "bg-red-100 text-red-700 border-red-200"
                : isStable
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-700 border-gray-200";

              return (
                <div key={item.year} className="flex items-center gap-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                  <span className="text-xs font-medium text-gray-800 w-10">
                    {item.year}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span
                    className={`text-[11px] px-3 py-1 rounded-xl border font-semibold ${badgeBg}`}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
