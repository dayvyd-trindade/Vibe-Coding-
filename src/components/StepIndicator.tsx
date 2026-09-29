import React from 'react';
import { UploadCloud, Search, Sparkles, Eye, Download, Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  maxUnlockedStep: number;
  onSelectStep: (step: number) => void;
}

const STEPS = [
  { id: 1, title: 'Adicionar livro', subtitle: 'PDF ou Imagens', icon: UploadCloud },
  { id: 2, title: 'Analisar livro', subtitle: 'Sumário & Metadados', icon: Search },
  { id: 3, title: 'Preparar para TTS', subtitle: 'OCR & Ordem Lógica', icon: Sparkles },
  { id: 4, title: 'Revisar', subtitle: 'Estrutura & Teste de Voz', icon: Eye },
  { id: 5, title: 'Gerar EPUB', subtitle: 'Download & Leitores', icon: Download },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  maxUnlockedStep,
  onSelectStep,
}) => {
  return (
    <div className="w-full bg-slate-900/40 border-b border-slate-800/80 py-4 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-5 gap-1 sm:gap-4 relative">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = currentStep === step.id;
            const isCompleted = step.id < currentStep || (step.id <= maxUnlockedStep && step.id !== currentStep);
            const isClickable = step.id <= maxUnlockedStep;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onSelectStep(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-200 group relative ${
                  isCurrent
                    ? 'bg-indigo-600/10 border border-indigo-500/40 shadow-sm'
                    : isClickable
                    ? 'hover:bg-slate-800/50 cursor-pointer opacity-90'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Step Circle */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[11px] sm:text-xs font-bold leading-tight line-clamp-1 ${
                      isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block font-normal mt-0.5">
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
