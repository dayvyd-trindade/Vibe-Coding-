import React from 'react';
import { BookOpen, Volume2, ShieldCheck, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { BookProject, ProcessingMode } from '../types';

interface HeaderProps {
  project: BookProject | null;
  onResetProject: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({ project, onResetProject, onLoadSample }) => {
  const getModeLabel = (mode: ProcessingMode) => {
    switch (mode) {
      case 'economic':
        return { text: 'Modo Econômico', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'balanced':
        return { text: 'Modo Equilibrado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'quality':
        return { text: 'Modo Qualidade', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
  };

  const modeBadge = project ? getModeLabel(project.mode) : null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                LivroTTS AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EPUB + TTS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Livros Didáticos & Materiais para Leitura por Voz
            </p>
          </div>
        </div>

        {/* Center / Mode & Status */}
        <div className="hidden md:flex items-center space-x-3">
          {modeBadge && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${modeBadge.color}`}>
              {modeBadge.text}
            </span>
          )}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fidelidade Total • Sem Resumos</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {!project && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition shadow-sm"
              title="Carregar livro de exemplo com fórmulas e tabelas para testar agora"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Carregar Exemplo</span>
            </button>
          )}

          {project && (
            <>
              <button
                onClick={onLoadSample}
                className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                title="Carregar livro de teste"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Exemplo</span>
              </button>

              <button
                onClick={onResetProject}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition"
                title="Novo Livro / Limpar"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Livro</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
