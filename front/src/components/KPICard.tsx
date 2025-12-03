import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  sparklineData: number[];
  delay?: number;
  status?: 'good' | 'warning' | 'danger';
}

export default function KPICard({ 
  title, 
  value, 
  trend, 
  trendValue, 
  sparklineData, 
  delay = 0,
  status = 'neutral'
}: KPICardProps) {
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min;

  const points = sparklineData
    .map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  const statusColors = {
    good: 'border-gray-200/80 bg-white/50',
    warning: 'border-gray-200/80 bg-white/50',
    danger: 'border-red-200/80 bg-red-50/60',
    neutral: 'border-gray-200/60 bg-white/50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border p-8 ${statusColors[status]} hover:bg-white/70 transition-all duration-300 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02]`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-gray-600 text-sm mb-3 tracking-wide uppercase font-medium text-[13px]">{title}</p>
            <p className="text-4xl text-black font-semibold tracking-tight">{value}</p>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 backdrop-blur-xl border border-gray-200/80 shadow-lg ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{trendValue}</span>
          </div>
        </div>

        {/* Sparkline */}
        <svg viewBox="0 0 100 30" className="w-full h-10 opacity-60">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={trend === 'down' ? '#dc2626' : trend === 'up' ? '#dc2626' : '#525252'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={trend === 'down' ? '#dc2626' : trend === 'up' ? '#dc2626' : '#525252'} stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <polyline
            points={points}
            fill="none"
            stroke={`url(#gradient-${title})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
