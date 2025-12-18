import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Microscope, 
  AlertTriangle, 
  ChevronDown, 
  CheckCircle, 
  Building2,
  Lightbulb,
  Zap,
  AlertOctagon
} from 'lucide-react';

export default function Page4Strategy() {
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [expandedBenchmark, setExpandedBenchmark] = useState<string | null>(null);

  // Three main strategies from the report
  const strategies = [
    {
      id: 1,
      category: '검사비용',
      categoryEn: 'Appraisal Cost',
      title: 'XAI 기반 검증체계 구축',
      titleEn: 'XAI-Based Verification System',
      icon: Microscope,
      color: 'blue',
      painPoints: [
        {
          title: '투자 대비 낮은 안전성',
          description: '13조 원(100억 달러) AI 인프라 투입, 경쟁사(Waymo) 대비 안전성 1/750 수준'
        },
        {
          title: '구조적 검증 한계',
          description: 'End-to-End 신경망의 블랙박스 특성으로 오류 원인 규명 불가, 전체 데이터 재검증 반복'
        },
        {
          title: '데이터 선별의 비효율',
          description: '시스템 결함과 운전자 습관을 구분 불가, 위험도 낮은 데이터까지 동일한 검증 절차 적용'
        }
      ],
      benchmark: {
        company: 'BMW',
        title: 'AI 예측적 품질관리',
        why: '비전 AI 도입 및 모델 튜닝으로 가짜 결함 알람 최소화, 특정 라인에서 결함률 60% 감소 및 검사 비용 절감',
        insight: '무조건적 데이터 수집보다 가짜 불량 선별이 비용 절감의 핵심. 선별적 검증 도입 필요'
      },
      strategy: {
        approach: 'XAI (설명 가능한 AI) 기반 검증체계',
        tactics: [
          {
            name: '판단 근거의 시각화',
            detail: '경량 XAI 레이어 추가로 오류 발생 원인(예: 역광) 즉시 규명'
          },
          {
            name: '타겟팅된 데이터 학습',
            detail: '취약 시나리오(역광, 악천후, 복잡한 교차로) 선별 및 집중 학습·검증'
          },
          {
            name: '검증 자원 최적화',
            detail: '전체 데이터 재검증이 아닌, 문제 발생 가능성 높은 구간에만 자원 투입'
          }
        ],
        effect: '기형적으로 높은 평가비용(A) 구조 혁신 및 FSD 완성도 조기 확보'
      },
      metrics: {
        current: 'A: 0.53',
        target: 'A: 0.43',
        change: '-18.9%',
        timeline: '6-12개월',
        investment: '중간'
      }
    },
    {
      id: 2,
      category: '예방비용',
      categoryEn: 'Prevention Cost',
      title: 'AI-SQE 공급망 품질관리',
      titleEn: 'AI-SQE Supply Chain Quality Engineering',
      icon: Shield,
      color: 'green',
      painPoints: [
        {
          title: '초기 품질 관리 부재',
          description: '입고 부품의 40%가 재작업 대상, 최종 검사 단계 90% 결함률로 전이'
        },
        {
          title: '신공정 도입의 걸림돌',
          description: 'Unboxed Process는 부품 품질 편차에 민감, 단일 부품 불량으로 전체 공정 중단 가능'
        },
        {
          title: '사후 대응 비효율',
          description: '입고 후 발견되는 불량으로 인한 재작업 비용 및 생산 지연 반복'
        }
      ],
      benchmark: {
        company: 'Hyundai',
        title: 'Family Supplier 모델',
        why: '90년대 후반 품질 위기 시 협력사와 설계·공정 단계부터 품질 육성 전략. 약 5년 만에 JD Power 지표에서 도요타와 경쟁 가능한 수준으로 도약',
        insight: '사후 수습이 아닌 공급망 단계의 원천 차단. 협력사 품질 육성은 Unboxed Process의 필수 전제 조건'
      },
      strategy: {
        approach: 'AI-SQE (공급망 품질 엔지니어링) 시스템',
        tactics: [
          {
            name: '품질 리스크 예측',
            detail: 'AI가 공급업체 데이터와 물류 환경 분석, 입고 전 불량 가능성 사전 예측'
          },
          {
            name: '선제적 차단 프로세스',
            detail: '고위험 부품군은 공장 반입 전 검사 강화 또는 반송, 라인 내 불량 유입 원천 봉쇄'
          },
          {
            name: '협력사 육성 프로그램',
            detail: '설계·공정 단계부터 협력사와 협업, 품질 표준 공유 및 지속적 개선 체계 구축'
          }
        ],
        effect: '재작업(Rework) 비용 제거 및 Unboxed 공정의 생산성 목표 달성'
      },
      metrics: {
        current: 'P: 0.12',
        target: 'P: 0.24',
        change: '+100%',
        timeline: '12-18개월',
        investment: '중간-높음'
      }
    },
    {
      id: 3,
      category: '사후실패비용',
      categoryEn: 'External Failure Cost',
      title: '위험도 기반 하이브리드 리콜',
      titleEn: 'Risk-Based Hybrid Recall System',
      icon: AlertOctagon,
      color: 'red',
      painPoints: [
        {
          title: 'OTA 해결의 한계',
          description: '물리적 수리가 필수적인 하드웨어 결함까지 소프트웨어(OTA)로 대응, 해결 지연'
        },
        {
          title: '비용 변동성 확대',
          description: '뒤늦은 대규모 리콜로 서비스센터 과부하 및 외부실패비용(OF)의 예측 불가능한 급증'
        },
        {
          title: '브랜드 신뢰 저하',
          description: 'OTA 패치 남발로 인한 소비자 불안감 증폭, 안전에 대한 신뢰도 하락'
        }
      ],
      benchmark: {
        company: 'Ford',
        title: '리콜 대응 채널 이원화',
        why: '2025년 상반기 88가지 결함 유형을 분류 시스템(Triage)으로 완벽 소화. OTA 해결 건과 센터 입고 건을 즉시 배분하여 서비스 혼란 방지',
        insight: '어떤 결함이 터져도 즉시 대응 경로를 지정하는 분류 시스템 필요. 사전 분류 체계로 비용과 리스크 통제'
      },
      strategy: {
        approach: '위험도 기반 하이브리드 리콜',
        tactics: [
          {
            name: '대응 경로 이원화',
            detail: '결함 확인 즉시 안전 영향도와 SW 해결 가능성 기준으로 OTA/서비스센터 대상 지정'
          },
          {
            name: '조기 전환 기준 설정',
            detail: 'OTA 우선 적용 후, 일정 기간 내 미해소 시 물리적 리콜로 전환하는 명확한 판단 기준'
          },
          {
            name: '실시간 모니터링',
            detail: 'OTA 적용 후 차량 데이터 실시간 분석, 추가 위험 신호 감지 시 즉시 대응 전환'
          }
        ],
        effect: 'OTA 과의존으로 인한 브랜드 신뢰 저하 예방, 외부실패비용 변동성 체계적 관리'
      },
      metrics: {
        current: 'OF: 0.35',
        target: 'OF: 0.28-0.33',
        change: '-5.7% ~ -20%',
        timeline: '지속적 운영',
        investment: '낮음'
      }
    }
  ];

  const getCategoryColor = (color: string, type: 'bg' | 'text' | 'border' | 'accent') => {
    const colors = {
      blue: {
        bg: 'bg-blue-50/60',
        text: 'text-blue-700',
        border: 'border-blue-200/80',
        accent: 'bg-blue-600'
      },
      green: {
        bg: 'bg-green-50/60',
        text: 'text-green-700',
        border: 'border-green-200/80',
        accent: 'bg-green-600'
      },
      red: {
        bg: 'bg-red-50/60',
        text: 'text-red-700',
        border: 'border-red-200/80',
        accent: 'bg-red-600'
      }
    };
    return colors[color as keyof typeof colors]?.[type] || '';
  };

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14"
      >
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-6xl text-black font-bold tracking-tight">전략 제안</h1>
          <span className="text-4xl text-gray-400 font-light">/ Strategic Plan</span>
        </div>
        <h2 className="text-3xl text-gray-700 mb-6 font-semibold">
          품질비용 비율의 전략적 재구조화
        </h2>
        <div className="flex items-start gap-4 max-w-6xl mb-8">
          <div className="w-1.5 h-16 bg-red-600 rounded-full mt-1"></div>
          <div>
            <p className="text-gray-700 text-xl leading-relaxed font-medium mb-3">
              핵심: 절대량이 아닌 네 가지 품질 변수의 <span className="text-red-600 font-bold">각 비율의 관점</span>에서 바라볼 것
            </p>
          </div>
        </div>

        {/* Key Principle Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/80 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100/80 rounded-xl">
                <Microscope className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-sm font-bold text-gray-700">검사비용 혁신</span>
            </div>
            <p className="text-xs text-gray-600">무한 재검증 고리를 끊고 검증 효율화</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/80 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100/80 rounded-xl">
                <Shield className="w-5 h-5 text-green-700" />
              </div>
              <span className="text-sm font-bold text-gray-700">예방비용 강화</span>
            </div>
            <p className="text-xs text-gray-600">입고 품질 리스크 사전 차단</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/80 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100/80 rounded-xl">
                <AlertOctagon className="w-5 h-5 text-red-700" />
              </div>
              <span className="text-sm font-bold text-gray-700">실패비용 통제</span>
            </div>
            <p className="text-xs text-gray-600">OTA 과의존 탈피, 체계적 리콜 관리</p>
          </div>
        </div>
      </motion.div>

      {/* Strategy Cards */}
      <div className="space-y-8">
        {strategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/80 shadow-2xl overflow-hidden"
          >
            {/* Strategy Header */}
            <div className={`${getCategoryColor(strategy.color, 'bg')} border-b ${getCategoryColor(strategy.color, 'border')} p-8`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className={`p-5 ${getCategoryColor(strategy.color, 'accent')} rounded-2xl shadow-xl`}>
                    <strategy.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className={`text-sm font-bold ${getCategoryColor(strategy.color, 'text')} uppercase tracking-wider`}>
                        {strategy.category}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{strategy.categoryEn}</span>
                    </div>
                    <h3 className="text-3xl text-black font-bold mb-2">{strategy.title}</h3>
                    <p className="text-lg text-gray-600 font-medium">{strategy.titleEn}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 divide-x divide-gray-200/60">
              {/* Left Column: Problems & Benchmark */}
              <div className="p-8 space-y-8">
                {/* Pain Points */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="text-lg font-bold text-black">현재의 문제점 / Pain Points</h4>
                  </div>
                  <div className="space-y-4">
                    {strategy.painPoints.map((point, idx) => (
                      <div key={idx} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/60">
                        <h5 className="text-sm font-bold text-gray-800 mb-2">{point.title}</h5>
                        <p className="text-xs text-gray-600 leading-relaxed">{point.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benchmark */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <h4 className="text-lg font-bold text-black">벤치마크 / Benchmark</h4>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 rounded-2xl p-6 border border-purple-200/60 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/90 rounded-xl shadow-sm">
                          <span className="text-xl font-bold text-purple-700">{strategy.benchmark.company}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedBenchmark(expandedBenchmark === strategy.category ? null : strategy.category)}
                        className="p-2 hover:bg-white/60 rounded-xl transition-all duration-300"
                      >
                        <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform duration-300 ${
                          expandedBenchmark === strategy.category ? 'rotate-180' : ''
                        }`} />
                      </button>
                    </div>
                    <h5 className="text-sm font-bold text-purple-900 mb-3">{strategy.benchmark.title}</h5>
                    
                    <AnimatePresence>
                      {expandedBenchmark === strategy.category && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t border-purple-200/60 space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-purple-700 mb-2">Why {strategy.benchmark.company}?</div>
                              <p className="text-xs text-gray-700 leading-relaxed">{strategy.benchmark.why}</p>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-purple-700 mb-2">테슬라 시사점</div>
                              <p className="text-xs text-gray-700 leading-relaxed">{strategy.benchmark.insight}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right Column: Strategy & Tactics */}
              <div className="p-8 bg-gradient-to-br from-white/50 to-gray-50/30">
                <div className="flex items-center gap-2 mb-5">
                  <Lightbulb className={`w-5 h-5 ${getCategoryColor(strategy.color, 'text')}`} />
                  <h4 className="text-lg font-bold text-black">제안 전략 / Proposed Strategy</h4>
                </div>

                <div className="mb-6">
                  <div className={`inline-block px-5 py-3 ${getCategoryColor(strategy.color, 'bg')} border ${getCategoryColor(strategy.color, 'border')} rounded-2xl mb-4`}>
                    <span className={`text-base font-bold ${getCategoryColor(strategy.color, 'text')}`}>
                      {strategy.strategy.approach}
                    </span>
                  </div>
                </div>

                {/* Tactics */}
                <div className="space-y-4 mb-6">
                  {strategy.strategy.tactics.map((tactic, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 p-1.5 ${getCategoryColor(strategy.color, 'accent')} rounded-lg`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-gray-800 mb-2">{tactic.name}</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">{tactic.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Expected Effect */}
                <div className={`bg-gradient-to-br ${getCategoryColor(strategy.color, 'bg')} border ${getCategoryColor(strategy.color, 'border')} rounded-2xl p-6 shadow-lg`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className={`w-5 h-5 ${getCategoryColor(strategy.color, 'text')}`} />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">기대 효과 / Expected Effect</span>
                  </div>
                  <p className={`text-sm ${getCategoryColor(strategy.color, 'text')} font-bold leading-relaxed`}>
                    {strategy.strategy.effect}
                  </p>
                </div>

                {/* Implementation Info */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
