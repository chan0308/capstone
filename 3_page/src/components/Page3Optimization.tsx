import { useState, useRef } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";

/* ============================================================
   CUSTOM HORIZONTAL SLIDER COMPONENT
============================================================ */
function HorizontalSlider({
  label,
  value,
  setValue,
  min,
  max,
  color,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  color: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handleDrag = (clientX: number) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offset = clientX - rect.left;
    const ratio = Math.min(Math.max(offset / rect.width, 0), 1);
    const newValue = min + ratio * (max - min);

    setValue(parseFloat(newValue.toFixed(2)));
  };

  const startDrag = (e: any) => {
    e.preventDefault();
    handleDrag(e.clientX || e.touches?.[0]?.clientX);

    const move = (ev: any) =>
      handleDrag(ev.clientX || ev.touches?.[0]?.clientX);
    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
  };

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-700 w-20">
        {label}
      </span>

      <div className="flex items-center gap-2 flex-1">
        <div
          ref={trackRef}
          className="relative h-2 bg-gray-200 rounded-full flex-1"
          style={{ minWidth: 120 }}
        >
          {/* active fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${percent}%`,
              backgroundColor: color,
            }}
          />

          {/* thumb */}
          <div
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 shadow rounded-full cursor-pointer"
            style={{
              left: `calc(${percent}% - 8px)`,
              borderColor: color,
            }}
          />
        </div>

        <span className="text-xs font-semibold text-gray-800 w-10 text-right">
          {value.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE 3
============================================================ */
export default function Page3Optimization() {
  /* SLIDER STATE */
  const [pValue, setPValue] = useState(0.12);
  const [aValue, setAValue] = useState(0.53);
  const [fValue, setFValue] = useState(0.35);

  /* CALCULATE COQ */
  const calculateCOQ = (p: number, a: number, f: number) =>
    Math.max(
      0.5,
      Math.min(
        5,
        3.5 + 1.12 * p * 10 - 2.84 * a * 10 - 0.95 * f * 10,
      ),
    );

  const currentCOQ = calculateCOQ(pValue, aValue, fValue);

  // Optimal values
  const optimalP = 0.23;
  const optimalA = 0.42;
  const optimalF = 0.34;
  const optimalCOQ = 0.5;

  /* COQ BAR DATA */
  const coqBarData = [
    { name: "COQ ratio", value: currentCOQ, color: "#dc2626" },
    { name: "P", value: pValue, color: "#6b7280" },
    { name: "A", value: aValue, color: "#525252" },
    { name: "F", value: fValue, color: "#737373" },
  ];

  /* ElasticNet - What drives bad COQ */
  const elasticNetData = [
    { label: "Prevention", coefficient: 1, color: "#9ca3af" },
    { label: "Appraisal", coefficient: 2, color: "#dc2626" },
    { label: "Failure", coefficient: -1, color: "#22c55e" },
  ];

  /* Sensitivity - Which change reduces COQ the most */
  const sensitivityData = [
    { label: "변경", point: 0, a: 2.0, p: 1.8, f: 1.9 },
    { label: "A -10%", point: 1, a: 1.5, p: null, f: null },
    { label: "P -5%", point: 2, a: null, p: 1.6, f: null },
    { label: "P +5%", point: 3, a: null, p: null, f: 2.1 },
  ];

  /* Radar */
  const radarData = [
    {
      metric: "Prevention",
      Current: pValue,
      Optimal: optimalP,
      Theoretical: 0.3,
    },
    {
      metric: "Appraisal",
      Current: aValue,
      Optimal: optimalA,
      Theoretical: 0.2,
    },
    {
      metric: "Failure",
      Current: fValue,
      Optimal: optimalF,
      Theoretical: 0.5,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-12">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-black mb-2">
            Quality Cost Optimization
          </h1>
          <h2 className="text-lg font-semibold">
            <span className="text-red-600">
              Where Should Tesla Move?
            </span>
            <span className="text-gray-700">
              {" "}
              (Optimal Ratio)
            </span>
          </h2>
        </div>

        {/* ========================= TOP ROW: METRIC CARDS + KEY INSIGHTS ========================= */}
        <div className="grid grid-cols-[1fr,300px] gap-6 mb-8">
          {/* Left: 4 Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="text-xs text-gray-500 font-medium mb-2">
                Optimized COQ
              </div>
              <div className="text-4xl font-bold text-red-600">
                {optimalCOQ.toFixed(1)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="text-xs text-gray-500 font-medium mb-2">
                Prevention (P)
              </div>
              <div className="text-4xl font-bold text-red-600">
                {optimalP.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="text-xs text-gray-500 font-medium mb-2">
                Appraisal (A)
              </div>
              <div className="text-4xl font-bold text-red-600">
                {optimalA.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="text-xs text-gray-500 font-medium mb-2">
                Failure (F)
              </div>
              <div className="text-4xl font-bold text-red-600">
                {optimalF.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Right: Key Insights */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-black mb-4">
              Key Insights
            </h3>
            <div className="space-y-3">
              <div className="h-12 bg-gray-50 rounded-lg"></div>
              <div className="h-12 bg-gray-50 rounded-lg"></div>
              <div className="h-12 bg-gray-50 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* ========================= MIDDLE ROW: SIMULATION + RADAR ========================= */}
        <div className="grid grid-cols-[1fr,420px] gap-6 mb-8">
          {/* Left: COQ Optimizing Simulation */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-black mb-6">
              COQ Optimizing Simulation
            </h3>

            <div className="grid grid-cols-[1fr,200px] gap-6">
              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={coqBarData}
                    layout="horizontal"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e5e5"
                      vertical={false}
                    />
                    <XAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#525252" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                    />
                    <YAxis
                      type="number"
                      domain={[0, 3.5]}
                      tick={{ fontSize: 11, fill: "#525252" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {coqBarData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sliders */}
              <div className="flex flex-col justify-center space-y-4">
                <HorizontalSlider
                  label="Prevention"
                  value={pValue}
                  setValue={setPValue}
                  min={0.1}
                  max={0.3}
                  color="#6b7280"
                />
                <HorizontalSlider
                  label="Appraisal"
                  value={aValue}
                  setValue={setAValue}
                  min={0.2}
                  max={0.6}
                  color="#525252"
                />
                <HorizontalSlider
                  label="Failure"
                  value={fValue}
                  setValue={setFValue}
                  min={0.2}
                  max={0.5}
                  color="#737373"
                />
              </div>
            </div>
          </div>

          {/* Right: Radar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-xs font-medium text-gray-700">
                  Current
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-xs font-medium text-gray-700">
                  Optimal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-xs font-medium text-gray-700">
                  Theoretical
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e5e5" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{
                    fontSize: 11,
                    fill: "#525252",
                    fontWeight: 600,
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 0.6]}
                  tick={{ fontSize: 10, fill: "#737373" }}
                />
                <Radar
                  name="Current"
                  dataKey="Current"
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Optimal"
                  dataKey="Optimal"
                  stroke="#facc15"
                  fill="#facc15"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Theoretical"
                  dataKey="Theoretical"
                  stroke="#60a5fa"
                  fill="#60a5fa"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ========================= BOTTOM ROW: DRIVERS + SENSITIVITY ========================= */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: What drives bad COQ? */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-black mb-6">
              What drives bad COQ?
            </h3>

            <div className="grid grid-cols-[1fr,200px] gap-6">
              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={elasticNetData}
                    layout="horizontal"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e5e5"
                      vertical={false}
                    />
                    <XAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#525252" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                    />
                    <YAxis
                      type="number"
                      domain={[-2, 2]}
                      tick={{ fontSize: 11, fill: "#525252" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="coefficient"
                      radius={[4, 4, 0, 0]}
                    >
                      {elasticNetData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Text */}
              <div className="flex flex-col justify-center space-y-2 text-xs text-gray-700">
                <p className="font-semibold">
                  • A 10% (감소)가 COQ 최대폭 개선을 가져 감
                </p>
                <p>• P 5% 초과로 보조적</p>
                <p>• 비용 COQ는 1.53 → +1.19로 총 22% 개선</p>
              </div>
            </div>
          </div>

          {/* Right: Which change reduces COQ the most? */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-black mb-6">
              Which change reduces COQ the most?
            </h3>

            <div className="grid grid-cols-[1fr,200px] gap-6">
              {/* Line Chart */}
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sensitivityData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e5e5"
                    />
                    <XAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#525252" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[1.0, 2.5]}
                      tick={{ fontSize: 11, fill: "#525252" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                      label={{
                        value: "COQ",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11 },
                      }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="a"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={{ fill: "#dc2626", r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="p"
                      stroke="#525252"
                      strokeWidth={2}
                      dot={{ fill: "#525252", r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="f"
                      stroke="#737373"
                      strokeWidth={2}
                      dot={{ fill: "#737373", r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Text */}
              <div className="flex flex-col justify-center space-y-2 text-xs text-gray-700">
                <p className="font-semibold">
                  • A 감소가 COQ 개선 기여도
                </p>
                <p>• P 9% 조정은 보조적</p>
                <p>• 비용 COQ는 1.53 → +1.19로 총 22% 개선</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}