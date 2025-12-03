import { motion } from 'motion/react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
  pulse?: boolean;
}

export default function StatusBadge({ status, text, pulse = false }: StatusBadgeProps) {
  const statusStyles = {
    success: 'bg-green-50/80 text-green-700 border-green-200/80',
    warning: 'bg-yellow-50/80 text-yellow-700 border-yellow-200/80',
    error: 'bg-red-50/80 text-red-700 border-red-200/80',
    info: 'bg-gray-50/80 text-gray-700 border-gray-200/80',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-xl text-xs font-medium ${statusStyles[status]} ${
        pulse ? 'animate-subtle-pulse' : ''
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${
        status === 'success' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
        status === 'warning' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' :
        status === 'error' ? 'bg-red-600 shadow-lg shadow-red-500/50' :
        'bg-gray-500 shadow-lg shadow-gray-500/50'
      }`}></div>
      <span>{text}</span>
    </motion.div>
  );
}
