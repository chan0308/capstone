import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Microscope, AlertOctagon, Users, ChevronDown, ChevronRight, ArrowRight, CheckCircle } from 'lucide-react';

export default function Page4Strategy() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const strategyCards = [
    {
      id: 1,
      title: 'Strengthen Prevention',
      subtitle: 'Prevention > Detection Mindset',
      icon: Shield,
      color: 'border-gray-200/80 bg-white/50',
      iconColor: 'text-gray-700',
      summary: 'Integrate quality in design & manufacturing phases',
      details: [
        'Design for Manufacturing (DFM) protocols in early R&D',
        'FMEA (Failure Mode Effects Analysis) at design stage',
        'Supplier quality integration programs',
        'Root cause prevention workshops',
      ],
      metrics: {
        target: 'P: 0.18 → 0.24',
        timeline: '12-18 months',
        investment: 'Medium'
      }
    },
    {
      id: 2,
      title: 'Reduce Appraisal Overload',
      subtitle: 'Smart Automation & Efficiency',
      icon: Microscope,
      color: 'border-gray-200/80 bg-white/50',
      iconColor: 'text-gray-700',
      summary: 'Automatic testing pipelines & intelligent inspection',
      details: [
        'Hardware-in-the-Loop (HIL) automated testing',
        'Software-in-the-Loop (SiL) simulation testing',
        'AI-powered visual inspection systems',
        'Streamline redundant inspection processes',
      ],
      metrics: {
        target: 'A: 0.53 → 0.43',
        timeline: '6-12 months',
        investment: 'High (upfront), Low (operational)'
      }
    },
    {
      id: 3,
      title: 'Failure Threshold Control',
      subtitle: 'Manage Catastrophic Risk',
      icon: AlertOctagon,
      color: 'border-red-200/80 bg-red-50/60',
      iconColor: 'text-red-600',
      summary: 'Prioritize safety-critical failure prevention',
      details: [
        'Tiered failure classification system',
        'Focus on catastrophic & safety-critical failures',
        'Acceptable failure zones for non-critical systems',
        'Real-time failure monitoring dashboard',
      ],
      metrics: {
        target: 'F: Keep 0.34-0.38',
        timeline: 'Ongoing',
        investment: 'Low'
      }
    },
    {
      id: 4,
      title: 'Rebuild Safety Trust for RoboTaxi',
      subtitle: 'Transparency & Preventive Visibility',
      icon: Users,
      color: 'border-gray-200/80 bg-white/50',
      iconColor: 'text-black',
      summary: 'Lower recall dependency & increase trust',
      details: [
        'Public-facing quality metrics dashboard',
        'Proactive safety communication strategy',
        'Reduced reliance on OTA recall patches',
        'Third-party safety certification programs',
      ],
      metrics: {
        target: 'Sentiment: -0.4 → +0.2',
        timeline: '18-24 months',
        investment: 'Medium'
      }
    }
  ];

  const flowSteps = [
    { label: 'Current State', status: 'complete', description: 'Appraisal-heavy (0.53)' },
    { label: 'Bottlenecks', status: 'complete', description: 'Low Prevention (0.12)' },
    { label: 'Optimization', status: 'active', description: 'Analysis complete' },
    { label: 'Strategic Shift', status: 'pending', description: 'Implementation' },
    { label: 'Outcomes', status: 'pending', description: 'Target achieved' },
  ];

  const expectedOutcomes = [
    {
      title: 'Higher COQ Efficiency',
      current: '1.78',
      target: '2.40',
      change: '+35%',
      status: 'good'
    },
    {
      title: 'Reduced Safety-Critical Failures',
      current: '11 / week',
      target: '< 3 / week',
      change: '-73%',
      status: 'good'
    },
    {
      title: 'Stronger Consumer Trust',
      current: '-0.42',
      target: '+0.15',
      change: '+136%',
      status: 'good'
    },
    {
      title: 'RoboTaxi Scalability',
      current: 'High Risk',
      target: 'Launch Ready',
      change: 'Enabled',
      status: 'good'
    }
  ];

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14"
      >
        <h1 className="text-6xl mb-6 text-black font-bold tracking-tight">Strategic Plan</h1>
        <h2 className="text-3xl text-gray-700 mb-4 font-semibold">Building a Prevention-Centric Quality System</h2>
        <div className="flex items-start gap-4 max-w-5xl">
          <div className="w-1.5 h-8 bg-red-600 rounded-full mt-1"></div>
          <p className="text-gray-700 text-lg leading-relaxed font-medium">
            Transform Tesla's quality cost model into a Prevention-first system to restore safety trust and ensure RoboTaxi scalability.
          </p>
        </div>
      </motion.div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-2 gap-6 mb-12">
        {strategyCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`backdrop-blur-2xl rounded-3xl border overflow-hidden transition-all duration-300 shadow-xl ${card.color} ${
              expandedCard === card.id ? 'ring-4 ring-red-200/40 scale-[1.02]' : 'hover:scale-[1.01]'
            }`}
          >
            <button
              onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
              className="w-full p-8 text-left hover:bg-white/40 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 bg-white/80 rounded-2xl shadow-lg ${card.iconColor}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl mb-2 text-black font-semibold">{card.title}</h3>
                      <p className="text-sm text-gray-600 font-medium">{card.subtitle}</p>
                    </div>
                    <div className={`transition-transform duration-300 ${expandedCard === card.id ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-6 h-6 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium">{card.summary}</p>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedCard === card.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-8 pt-4 border-t border-gray-200/60 bg-white/40">
                    <div className="mb-6">
                      <h4 className="text-sm text-gray-600 mb-4 uppercase tracking-wide font-semibold">Key Actions</h4>
                      <div className="space-y-3">
                        {card.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                            <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/80 shadow-lg">
                        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-semibold">Target</div>
                        <div className="text-sm text-black font-bold">{card.metrics.target}</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/80 shadow-lg">
                        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-semibold">Timeline</div>
                        <div className="text-sm text-black font-bold">{card.metrics.timeline}</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/80 shadow-lg">
                        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-semibold">Investment</div>
                        <div className="text-sm text-black font-bold">{card.metrics.investment}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Flow Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-10 shadow-xl"
      >
        <h3 className="text-2xl mb-8 text-black font-semibold">Implementation Flow</h3>
        <div className="flex items-center justify-between">
          {flowSteps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl ${
                  step.status === 'complete' ? 'bg-gray-700 text-white' :
                  step.status === 'active' ? 'bg-red-600 text-white animate-pulse' :
                  'bg-white/80 text-gray-400 border border-gray-200/80'
                }`}>
                  {step.status === 'complete' ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <span className="text-xl font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-black font-semibold mb-1">{step.label}</p>
                  <p className="text-xs text-gray-600 font-medium">{step.description}</p>
                </div>
              </div>
              {index < flowSteps.length - 1 && (
                <ArrowRight className={`w-6 h-6 mx-4 ${
                  step.status === 'complete' ? 'text-gray-600' : 'text-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Expected Outcomes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3 className="text-2xl mb-6 text-black font-semibold">Expected Outcomes</h3>
        <div className="grid grid-cols-4 gap-6">
          {expectedOutcomes.map((outcome, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-2xl rounded-3xl border border-gray-200/80 p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <h4 className="text-lg mb-6 text-black font-semibold leading-tight">{outcome.title}</h4>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Current</span>
                  <span className="text-xl text-gray-700 font-bold">{outcome.current}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Target</span>
                  <span className="text-xl text-red-600 font-bold">{outcome.target}</span>
                </div>
              </div>
              <div className="mt-6 px-4 py-2 bg-red-100/80 border border-red-200/80 rounded-xl text-center shadow-lg">
                <span className="text-red-700 font-bold text-sm">{outcome.change}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 bg-red-50/80 backdrop-blur-2xl rounded-3xl border border-red-200/60 p-10 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl mb-3 text-black font-bold">Ready to Transform Quality</h3>
            <p className="text-gray-700 text-lg font-medium max-w-2xl">
              A Prevention-centric COQ structure is the foundation for Tesla's RoboTaxi success and sustained market leadership.
            </p>
          </div>
          <div className="px-10 py-5 bg-red-600 rounded-2xl text-white shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <span className="text-xl font-bold">Begin Implementation</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
