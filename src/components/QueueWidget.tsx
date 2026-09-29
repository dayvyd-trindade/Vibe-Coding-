import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Trash2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { QueueBookItem } from '../types';

interface QueueWidgetProps {
  queue: QueueBookItem[];
  currentIndex: number;
  isProcessingQueue: boolean;
  onAddFilesToQueue: (files: FileList | File[]) => void;
  onRemoveFromQueue: (id: string) => void;
  onDownloadEpub: (item: QueueBookItem) => void;
  onSelectProjectToView: (item: QueueBookItem) => void;
}

export const QueueWidget: React.FC<QueueWidgetProps> = ({
  queue,
  currentIndex,
  isProcessingQueue,
  onAddFilesToQueue,
  onRemoveFromQueue,
  onDownloadEpub,
  onSelectProjectToView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (queue.length === 0) return null;

  const activeItem = queue[currentIndex] || queue[0];
  const completedCount = queue.filter((item) => item.status === 'completed').length;
  const currentProgress = activeItem?.progressPercent || 0;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFilesToQueue(e.target.files);
            e.target.value = '';
          }
        }}
        accept=".pdf"
        multiple
        className="hidden"
      />

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-50 transition-all duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
          
          {/* Header Pill */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition select-none"
          >
            <div className="flex items-center space-x-3 truncate">
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isProcessingQueue ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isProcessingQueue ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <div className="truncate">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white truncate">
                    {isProcessingQueue ? 'Produção em Segundo Plano' : 'Fila de Produção Concluída'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {completedCount}/{queue.length} Livros
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {activeItem?.project?.metadata?.title || 'Processando lote...'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              {isProcessingQueue && (
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {currentProgress}%
                </span>
              )}
              <button
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Progress Bar under header */}
          {isProcessingQueue && (
            <div className="w-full bg-slate-800 h-1">
              <div
                className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          )}

          {/* Expanded Drawer Body */}
          {isExpanded && (
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Livros na Fila de Execução</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Livro à Fila</span>
                </button>
              </div>

              <div className="space-y-2">
                {queue.map((item, idx) => {
                  const isCurrent = idx === currentIndex && item.status === 'processing';
                  const isDone = item.status === 'completed';
                  const isQueued = item.status === 'queued';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                          : isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-200 truncate">
                            {idx + 1}. {item.project?.metadata?.title || 'Livro Sem Título'}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{item.project?.pages?.length || 0} págs</span>
                            <span>•</span>
                            <span className={isCurrent ? 'text-indigo-400 font-medium' : isDone ? 'text-emerald-400' : 'text-slate-500'}>
                              {isDone ? 'Concluído' : isCurrent ? `Processando (${item.progressPercent}%)` : 'Na fila'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {isDone && (
                          <button
                            type="button"
                            onClick={() => onDownloadEpub(item)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-medium transition cursor-pointer text-[11px]"
                            title="Baixar EPUB"
                          >
                            <Download className="w-3 h-3" />
                            <span>Baixar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectProjectToView(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          title="Visualizar Detalhes"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => onRemoveFromQueue(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                            title="Remover da fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-1 text-slate-400">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Notificação sonora e no navegador ao terminar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
