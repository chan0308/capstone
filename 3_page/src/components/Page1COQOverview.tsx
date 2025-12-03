import { motion } from 'motion/react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, TrendingDown, Shield } from 'lucide-react';
import KPICard from './KPICard';

export default function Page1COQOverview() {
  // Mock data for P/A/F trends
  const pafData = [
    { month: 'Jan 20', P: 0.28, A: 0.38, F: 0.34 },
    { month: 'Apr 20', P: 0.27, A: 0.39, F: 0.34 },
    { month: 'Jul 20', P: 0.26, A: 0.40, F: 0.34 },
    { month: 'Oct 20', P: 0.25, A: 0.41, F: 0.34 },
    { month: 'Jan 21', P: 0.24, A: 0.42, F: 0.34 },
    { month: 'Apr 21', P: 0.23, A: 0.43, F: 0.34 },
    { month: 'Jul 21', P: 0.22, A: 0.44, F: 0.34 },
    { month: 'Oct 21', P: 0.21, A: 0.45, F: 0.34 },
    { month: 'Jan 22', P: 0.20, A: 0.46, F: 0.34 },
    { month: 'Apr 22', P: 0.19, A: 0.47, F: 0.34 },
    { month: 'Jul 22', P: 0.18, A: 0.48, F: 0.34 },
    { month: 'Oct 22', P: 0.17, A: 0.48, F: 0.35 },
    { month: 'Jan 23', P: 0.16, A: 0.49, F: 0.35 },
    { month: 'Apr 23', P: 0.15, A: 0.50, F: 0.35 },
    { month: 'Jul 23', P: 0.14, A: 0.51, F: 0.35 },
    { month: 'Oct 23', P: 0.14, A: 0.51, F: 0.35 },
    { month: 'Jan 24', P: 0.13, A: 0.52, F: 0.35 },
    { month: 'Apr 24', P: 0.13, A: 0.52, F: 0.35 },
    { month: 'Jul 24', P: 0.12, A: 0.53, F: 0.35 },
    { month: 'Oct 24', P: 0.12, A: 0.53, F: 0.35 },
  ];

  // COQ Efficiency data
  const efficiencyData = [
    { month: 'Jan 20', efficiency: 3.1 },
    { month: 'Apr 20', efficiency: 3.0 },
    { month: 'Jul 20', efficiency: 2.9 },
    { month: 'Oct 20', efficiency: 2.8 },
    { month: 'Jan 21', efficiency: 2.7 },
    { month: 'Apr 21', efficiency: 2.6 },
    { month: 'Jul 21', efficiency: 2.5 },
    { month: 'Oct 21', efficiency: 2.4 },
    { month: 'Jan 22', efficiency: 2.3 },
    { month: 'Apr 22', efficiency: 2.2 },
    { month: 'Jul 22', efficiency: 2.1 },
    { month: 'Oct 22', efficiency: 2.0 },
    { month: 'Jan 23', efficiency: 1.95 },
    { month: 'Apr 23', efficiency: 1.90 },
    { month: 'Jul 23', efficiency: 1.87 },
    { month: 'Oct 23', efficiency: 1.85 },
    { month: 'Jan 24', efficiency: 1.83 },
    { month: 'Apr 24', efficiency: 1.81 },
    { month: 'Jul 24', efficiency: 1.79 },
    { month: 'Oct 24', efficiency: 1.78 },
  ];

  // Sparkline data for KPIs
  const preventionSparkline = [0.28, 0.26, 0.24, 0.22, 0.20, 0.18, 0.16, 0.14, 0.13, 0.12];
  const appraisalSparkline = [0.38, 0.40, 0.42, 0.44, 0.46, 0.48, 0.50, 0.51, 0.52, 0.53];
  const failureSparkline = [0.34, 0.34, 0.34, 0.34, 0.34, 0.34, 0.35, 0.35, 0.35, 0.35];
  const efficiencySparkline = [3.1, 2.9, 2.7, 2.5, 2.3, 2.1, 1.95, 1.87, 1.81, 1.78];

  const insights = [
    {
      icon: TrendingDown,
      text: "Prevention decreasing leads to Failure growth",
      color: "text-red-600"
    },
    {
      icon: AlertTriangle,
      text: "Appraisal-heavy structure → short-term safety risk",
      color: "text-gray-600"
    },
    {
      icon: Shield,
      text: "Structural imbalance limits cost efficiency",
      color: "text-gray-600"
    }
  ];

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-12">
      {/* Hero Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14"
      >
        <h1 className="text-6xl mb-6 text-black font-bold tracking-tight">Tesla Quality Cost Structure</h1>
        <h2 className="text-3xl text-gray-700 mb-4 font-semibold">Current State Overview</h2>
        <div className="flex items-start gap-4 max-w-4xl">
          <div className="w-1.5 h-8 bg-red-600 rounded-full mt-1"></div>
          <p className="text-red-600 text-lg leading-relaxed font-medium">
            Tesla's COQ structure has shifted from Prevention-driven to Appraisal/Failure-driven, creating long-term safety and cost risks.
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <KPICard
          title="Prevention Ratio (P)"
          value="0.12"
          trend="down"
          trendValue="-57%"
          sparklineData={preventionSparkline}
          delay={0.1}
          status="danger"
        />
        <KPICard
          title="Appraisal Ratio (A)"
          value="0.53"
          trend="up"
          trendValue="+39%"
          sparklineData={appraisalSparkline}
          delay={0.2}
          status="warning"
        />
        <KPICard
          title="Failure Ratio (F)"
          value="0.35"
          trend="up"
          trendValue="+3%"
          sparklineData={failureSparkline}
          delay={0.3}
          status="warning"
        />
        <KPICard
          title="COQ Efficiency"
          value="1.78"
          trend="down"
          trendValue="-43%"
          sparklineData={efficiencySparkline}
          delay={0.4}
          status="danger"
        />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Charts - Takes 2 columns */}
        <div className="col-span-2 space-y-8">
          {/* P/A/F Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 hover:bg-white/80 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            <h3 className="text-2xl mb-8 text-black font-semibold">Monthly P/A/F Ratio Trends (2020–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pafData}>
                <defs>
                  <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#525252" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#525252" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#737373" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#737373" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#525252" 
                  tick={{ fill: '#525252', fontSize: 12 }}
                  axisLine={{ stroke: '#d4d4d4' }}
                />
                <YAxis 
                  stroke="#525252" 
                  tick={{ fill: '#525252', fontSize: 12 }}
                  axisLine={{ stroke: '#d4d4d4' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    color: '#000000',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ color: '#000000', fontSize: '13px', fontWeight: '500' }}
                  labelStyle={{ color: '#525252', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}
                />
                <Area type="monotone" dataKey="P" stroke="#525252" strokeWidth={2} fillOpacity={1} fill="url(#colorP)" />
                <Area type="monotone" dataKey="A" stroke="#737373" strokeWidth={2} fillOpacity={1} fill="url(#colorA)" />
                <Area type="monotone" dataKey="F" stroke="#dc2626" fillOpacity={1} fill="url(#colorF)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-gray-600 shadow-lg shadow-gray-500/40"></div>
                <span className="text-sm text-gray-700 font-medium">Prevention (P)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-gray-500 shadow-lg shadow-gray-400/40"></div>
                <span className="text-sm text-gray-700 font-medium">Appraisal (A)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-500/40"></div>
                <span className="text-sm text-gray-700 font-medium">Failure (F)</span>
              </div>
            </div>
          </motion.div>

          {/* COQ Efficiency Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 hover:bg-white/80 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            <h3 className="text-2xl mb-8 text-black font-semibold">COQ Efficiency Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#525252"
                  tick={{ fill: '#525252', fontSize: 12 }}
                  axisLine={{ stroke: '#d4d4d4' }}
                />
                <YAxis 
                  stroke="#525252" 
                  domain={[1.5, 3.5]}
                  tick={{ fill: '#525252', fontSize: 12 }}
                  axisLine={{ stroke: '#d4d4d4' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    color: '#000000',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ color: '#000000', fontSize: '13px', fontWeight: '500' }}
                  labelStyle={{ color: '#525252', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}
                />
                <ReferenceLine y={2.5} stroke="#525252" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Green Zone', fill: '#525252', position: 'right', fontWeight: 600 }} />
                <ReferenceLine y={1.8} stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Red Zone', fill: '#dc2626', position: 'right', fontWeight: 600 }} />
                <Line type="monotone" dataKey="efficiency" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Insight Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="bg-red-50/80 backdrop-blur-2xl rounded-3xl border border-red-200/60 p-8 shadow-xl">
            <h3 className="text-xl mb-6 flex items-center gap-3 text-black font-semibold">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              Key Insights
            </h3>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-xl rounded-2xl hover:bg-white/80 transition-all duration-300 border border-white/60 shadow-lg"
                >
                  <insight.icon className={`w-5 h-5 mt-1 flex-shrink-0 ${insight.color}`} />
                  <p className="text-gray-700 text-sm leading-relaxed font-medium">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 shadow-xl">
            <h4 className="text-sm text-gray-600 mb-6 tracking-wide uppercase font-semibold">Timeline</h4>
            <div className="space-y-5">
              {['2020', '2021', '2022', '2023', '2024'].map((year, index) => (
                <div key={year} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${index < 3 ? 'bg-gray-500 shadow-lg shadow-gray-500/40' : 'bg-red-600 shadow-lg shadow-red-500/40'}`}></div>
                  <span className="text-sm text-black min-w-[48px] font-medium">{year}</span>
                  <div className="flex-1 h-px bg-gray-300/60"></div>
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-semibold ${index < 3 ? 'text-gray-700 bg-gray-100/80 border border-gray-200/60' : 'text-red-700 bg-red-100/80 border border-red-200/60'}`}>
                    {index < 3 ? 'Optimal' : 'Risk'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
