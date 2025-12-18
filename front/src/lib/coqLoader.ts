// src/lib/coqLoader.ts
import * as XLSX from "xlsx";

export type PAFPoint = {
  date: Date;
  monthLabel: string; // recharts x축 표시용 (e.g., "Jan 20")
  P: number;
  A: number;
  F: number;
};

export type PAFRecent = {
  P_avg: number;
  A_avg: number;
  F_avg: number;
  P_deltaPct: number; // % (예: 1.6)
  A_deltaPct: number; // % (예: -4.7)
  F_deltaPct: number; // % (예: 5.5)
  recentPie: { name: string; value: number }[];
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function monthLabel(d: Date) {
  // "Jan 20" 스타일
  const mon = d.toLocaleString("en-US", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon} ${yy}`;
}

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function loadCoqFromXlsx(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch xlsx: ${res.status}`);
  const buf = await res.arrayBuffer();

  const wb = XLSX.read(buf, { type: "array" });

  // ---------- Sheet1: P/A/F ratio stream graph ----------
  const s1 = wb.Sheets["Sheet1"];
  if (!s1) throw new Error("Sheet1 not found in xlsx");

  const s1Json = XLSX.utils.sheet_to_json<any>(s1, { defval: null });

  const pafAll: PAFPoint[] = s1Json
    .map((r) => {
      const d = toDate(r["MONTH"]);
      if (!d) return null;

      const P = toNum(r["Prevention_Ratio"]);
      const A = toNum(r["Appraisal_Ratio"]);
      const F = toNum(r["Failure_Ratio"]);

      // 비정상 행(예: NaT, 합이 너무 이상한 값) 방어
      const sum = P + A + F;
      if (!Number.isFinite(sum) || sum <= 0) return null;

      return {
        date: d,
        monthLabel: monthLabel(d),
        P,
        A,
        F,
      } as PAFPoint;
    })
    .filter(Boolean) as PAFPoint[];

  pafAll.sort((a, b) => a.date.getTime() - b.date.getTime());

  // ---------- Sheet2: 최근 3개월 도넛 ----------
  const s2 = wb.Sheets["Sheet2"];
  if (!s2) throw new Error("Sheet2 not found in xlsx");
  const s2Json = XLSX.utils.sheet_to_json<any>(s2, { defval: null });

  // Sheet2는 최근 3개월치 row들이라 가정하고 평균을 내서 도넛 값으로 사용
  const recentRows = s2Json
    .map((r) => ({
      P: toNum(r["Prevention_Ratio"]),
      A: toNum(r["Appraisal_Ratio"]),
      F: toNum(r["Failure_Ratio"]),
    }))
    .filter((r) => Number.isFinite(r.P + r.A + r.F) && (r.P + r.A + r.F) > 0);

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const P_avg = avg(recentRows.map((r) => r.P));
  const A_avg = avg(recentRows.map((r) => r.A));
  const F_avg = avg(recentRows.map((r) => r.F));

  const recentPie = [
    { name: "Prevention (P)", value: P_avg },
    { name: "Appraisal (A)", value: A_avg },
    { name: "Failure (F)", value: F_avg },
  ];

  // ---------- Sheet3: 최근 3개월 평균 & 증감율 ----------
  const s3 = wb.Sheets["Sheet3"];
  if (!s3) throw new Error("Sheet3 not found in xlsx");
  const s3Json = XLSX.utils.sheet_to_json<any>(s3, { defval: null });

  const findRow = (key: string) =>
    s3Json.find((r) => String(r["Unnamed: 0"]).trim() === key);

  const rP = findRow("P");
  const rA = findRow("A");
  const rF = findRow("F");

  const P_deltaPct = rP ? toNum(rP["3개월 추세"]) : 0;
  const A_deltaPct = rA ? toNum(rA["3개월 추세"]) : 0;
  const F_deltaPct = rF ? toNum(rF["3개월 추세"]) : 0;

  const out: PAFRecent = {
    P_avg: rP ? toNum(rP["3개월 평균"]) : P_avg,
    A_avg: rA ? toNum(rA["3개월 평균"]) : A_avg,
    F_avg: rF ? toNum(rF["3개월 평균"]) : F_avg,
    P_deltaPct,
    A_deltaPct,
    F_deltaPct,
    recentPie,
  };

  return { pafAll, recent: out };
}

// x축 tick을 “Jan-2020, 2021, 2022, 2023, 2024, 2025, Apr-2025”처럼 만들기 위한 함수
export function buildYearTicks(pafAll: PAFPoint[]) {
  if (!pafAll.length) return [] as string[];

  const min = pafAll[0].date;
  const max = pafAll[pafAll.length - 1].date;

  const years: number[] = [];
  for (let y = min.getFullYear(); y <= max.getFullYear(); y++) years.push(y);

  // 각 연도의 "1월 데이터"가 있으면 그 label을 tick으로
  const ticks: string[] = [];

  for (const y of years) {
    const jan = pafAll.find(
      (p) => p.date.getFullYear() === y && p.date.getMonth() === 0
    );
    if (jan) ticks.push(jan.monthLabel);
    else {
      // 1월이 없으면 그 해의 첫 데이터라도 잡아줌(데이터가 월별/일별로 다를 수 있어서)
      const first = pafAll.find((p) => p.date.getFullYear() === y);
      if (first) ticks.push(first.monthLabel);
    }
  }

  // 마지막 tick: "Apr-2025" 같은 마지막 달(실제 max 데이터) label
  const last = pafAll[pafAll.length - 1].monthLabel;
  if (ticks[ticks.length - 1] !== last) ticks.push(last);

  // 중복 제거
  return Array.from(new Set(ticks));
}
