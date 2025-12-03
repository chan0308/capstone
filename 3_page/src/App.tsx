import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Page1COQOverview from './components/Page1COQOverview';
import Page2OTARecall from './components/Page2OTARecall';
import Page3Optimization from './components/Page3Optimization';
import Page4Strategy from './components/Page4Strategy';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  const [currentPage, setCurrentPage] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
        nextPage();
      } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  const pages = [
    { component: Page1COQOverview, title: 'COQ Overview' },
    { component: Page2OTARecall, title: 'OTA & Safety Story' },
    { component: Page3Optimization, title: 'Optimization Analysis' },
    { component: Page4Strategy, title: 'Strategic Plan' }
  ];

  const CurrentPageComponent = pages[currentPage].component;

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-600 to-red-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        
        <div className="max-w-[1800px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-10 h-10 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-red-500 rounded-2xl opacity-20 blur-xl"></div>
                <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-700 tracking-wide font-medium">Quality Analytics Dashboard</span>
          </div>
          
          {/* Page Indicators */}
          <div className="flex items-center gap-2">
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`relative min-w-[48px] h-12 px-5 rounded-2xl transition-all duration-300 font-medium shadow-lg ${
                  index === currentPage
                    ? 'bg-red-600 text-white shadow-red-500/30'
                    : 'bg-white/50 text-gray-600 hover:bg-white/70 hover:text-black border border-gray-200/80 backdrop-blur-xl'
                }`}
              >
                {index === currentPage && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-red-600 rounded-2xl"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{index + 1}</span>
              </button>
            ))}
          </div>

          <div className="w-32"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-32 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <CurrentPageComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <div className="fixed bottom-8 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-[1800px] mx-auto px-8 flex items-center justify-between">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 font-medium shadow-xl ${
              currentPage === 0
                ? 'bg-white/30 text-gray-400 cursor-not-allowed border border-gray-200/40 backdrop-blur-xl'
                : 'bg-white/70 text-black hover:bg-white/90 backdrop-blur-2xl border border-gray-200/80 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm tracking-wide">Previous</span>
          </button>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-2xl rounded-2xl border border-gray-200/80 shadow-xl">
              <div className="text-sm text-gray-600 font-medium">Page {currentPage + 1}</div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="text-sm text-black font-medium">{pages.length}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-600 font-medium">
                {currentPage === 0 && 'COQ Overview'}
                {currentPage === 1 && 'OTA Recall Analysis'}
                {currentPage === 2 && 'Optimization Models'}
                {currentPage === 3 && 'Strategic Plan'}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-gray-200/60 backdrop-blur-xl">
                <kbd className="text-[10px] text-gray-500 font-mono">←</kbd>
                <kbd className="text-[10px] text-gray-500 font-mono">→</kbd>
              </div>
            </div>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className={`pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 font-medium shadow-xl relative overflow-hidden ${
              currentPage === pages.length - 1
                ? 'bg-white/30 text-gray-400 cursor-not-allowed border border-gray-200/40 backdrop-blur-xl'
                : 'bg-red-600 text-white hover:scale-105 hover:shadow-2xl hover:shadow-red-500/40'
            }`}
          >
            {currentPage !== pages.length - 1 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            )}
            <span className="text-sm tracking-wide relative z-10">Next</span>
            <ChevronRight className="w-5 h-5 relative z-10" />
          </button>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
