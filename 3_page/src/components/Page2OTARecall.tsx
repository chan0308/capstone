import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, TrendingDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Page2OTARecall() {
  // Sentiment data
  const sentimentData = [
    { topic: 'Safety', score: -0.42, sentiment: 'Negative' },
    { topic: 'Recall', score: -0.38, sentiment: 'Negative' },
    { topic: 'Collision', score: -0.28, sentiment: 'Negative' },
    { topic: 'Autopilot', score: -0.15, sentiment: 'Mixed' },
    { topic: 'Quality', score: 0.05, sentiment: 'Neutral' },
  ];

  const getBarColor = (score: number) => {
    if (score < -0.2) return '#dc2626';
    if (score < 0.1) return '#737373';
    return '#525252';
  };

  // Timeline events
  const timelineEvents = [
    { date: 'Q1 2023', event: 'OTA Recall Wave 1', type: 'recall', count: 3 },
    { date: 'Q2 2023', event: 'Safety Complaints Spike', type: 'complaint', count: 11 },
    { date: 'Q3 2023', event: 'OTA Patch Cycle', type: 'patch', count: 5 },
    { date: 'Q4 2023', event: 'Recurring Recall Issues', type: 'recall', count: 4 },
    { date: 'Q1 2024', event: 'Austin Pilot Incidents', type: 'incident', count: 11 },
    { date: 'Q2 2024', event: 'OTA Emergency Patch', type: 'patch', count: 2 },
  ];

  const metricCards = [
    {
      title: 'Frequent OTA Recalls',
      description: 'Multiple software-based recalls addressing safety-critical issues through over-the-air updates',
      icon: RefreshCw,
      color: 'text-red-600'
    },
    {
      title: 'Higher Early-Stage Failure Events',
      description: 'Austin pilot program: 11 incidents in first week of deployment',
      icon: AlertCircle,
      color: 'text-gray-600'
    },
    {
      title: 'Consumer Sentiment: Safety & Recall',
      description: 'Safety, Recall, and Collision topics show predominantly negative sentiment',
      icon: TrendingDown,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-12">
      {/* Hero Section with Background */}
      <div className="relative mb-16 overflow-hidden rounded-3xl">
        {/* Background Vehicle Silhouette */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
          <svg className="w-full h-full opacity-10" viewBox="0 0 1200 400" fill="none">
            <path
              d="M200 200 L300 200 L350 150 L450 150 L500 200 L1000 200 L950 250 L250 250 Z"
              stroke="currentColor"
              strokeWidth="2"
              className="text-black"
            />
            <circle cx="350" cy="250" r="40" stroke="currentColor" strokeWidth="2" className="text-black" />
            <circle cx="850" cy="250" r="40" stroke="currentColor" strokeWidth="2" className="text-black" />
          </svg>
        </div>

        {/* Content Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 bg-white/70 backdrop-blur-2xl border border-gray-200/80 p-12 rounded-3xl shadow-2xl"
        >
          <h1 className="text-5xl mb-6 text-black font-bold tracking-tight">Background: OTA Recalls and Safety Reliability Challenges</h1>
          <div className="flex items-start gap-4 max-w-5xl">
            <div className="w-1.5 h-8 bg-red-600 rounded-full mt-1"></div>
            <p className="text-2xl text-gray-700 leading-relaxed font-medium">
              Tesla's full OTA recall strategy reduces surface-level costs but functions as a Failure-response, not Prevention — leaving safety trust unresolved.
            </p>
          </div>
        </motion.div>
      </div>

      {/* OTA Reality Info Blocks */}
      <div className="grid grid-cols-3 gap-6 mb-16">
        {metricCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 hover:bg-white/80 hover:scale-[1.02] transition-all duration-300 group shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-white/80 to-white/40 rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg">
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl mb-3 text-black font-semibold">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{card.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Sentiment Visualization */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 hover:bg-white/80 transition-all duration-300 shadow-xl hover:shadow-2xl"
        >
          <h3 className="text-2xl mb-2 text-black font-semibold">Consumer Sentiment Analysis</h3>
          <p className="text-gray-600 mb-8 text-sm font-medium">Reddit discussion sentiment by topic (Scale: -1 to +1)</p>
          
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sentimentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis 
                type="number" 
                domain={[-1, 1]} 
                stroke="#525252"
                tick={{ fill: '#525252', fontSize: 12 }}
                axisLine={{ stroke: '#d4d4d4' }}
              />
              <YAxis 
                dataKey="topic" 
                type="category" 
                stroke="#525252" 
                width={100}
                tick={{ fill: '#000000', fontSize: 13, fontWeight: 600 }}
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
                formatter={(value: any) => [value.toFixed(2), 'Sentiment Score']}
              />
              <Bar dataKey="score" radius={[0, 12, 12, 0]}>
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-500/40"></div>
              <span className="text-sm text-gray-700 font-medium">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500 shadow-lg shadow-gray-400/40"></div>
              <span className="text-sm text-gray-700 font-medium">Mixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600 shadow-lg shadow-gray-500/40"></div>
              <span className="text-sm text-gray-700 font-medium">Neutral</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 hover:bg-white/80 transition-all duration-300 shadow-xl hover:shadow-2xl"
        >
          <h3 className="text-2xl mb-2 flex items-center gap-3 text-black font-semibold">
            <Calendar className="w-6 h-6 text-red-600" />
            Event Timeline
          </h3>
          <p className="text-gray-600 mb-8 text-sm font-medium">Key safety and recall events (2023-2024)</p>

          <div className="space-y-5">
            {timelineEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className="relative"
              >
                <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-white/80 to-white/50 rounded-2xl border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shadow-lg ${
                    event.type === 'recall' ? 'bg-red-600 shadow-red-500/40' :
                    event.type === 'complaint' ? 'bg-gray-600 shadow-gray-500/40' :
                    event.type === 'incident' ? 'bg-red-700 shadow-red-600/40' :
                    'bg-gray-500 shadow-gray-400/40'
                  }`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 font-semibold uppercase tracking-wide">{event.date}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        event.type === 'recall' ? 'bg-red-100 text-red-700 border border-red-200' :
                        event.type === 'complaint' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                        event.type === 'incident' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {event.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-black font-medium mb-1">{event.event}</p>
                    <p className="text-sm text-gray-600 font-medium">Count: {event.count}</p>
                  </div>
                </div>
                
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-[22px] top-full w-0.5 h-5 bg-gradient-to-b from-gray-300 to-transparent"></div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 bg-red-50/80 backdrop-blur-2xl rounded-3xl border border-red-200/60 p-8 shadow-xl"
      >
        <div className="flex items-start gap-5">
          <div className="p-4 bg-red-600/20 rounded-2xl">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h4 className="text-xl mb-3 text-black font-semibold">Strategic Implications</h4>
            <p className="text-gray-700 text-base leading-relaxed font-medium">
              OTA recalls are cost-efficient responses to failures, but do not constitute preventative measures. The recurring pattern suggests systemic quality issues that require upstream Prevention investment to resolve root causes and restore consumer trust.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}