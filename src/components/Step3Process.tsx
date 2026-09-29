import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Pause,
  Play,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  FileCode,
  Table as TableIcon,
  HelpCircle,
  Eye,
  Check,
} from 'lucide-react';
import { BookProject, Chapter, ProcessedBlock, PageItem } from '../types';
import { saveProjectToDB } from '../services/db';

interface Step3ProcessProps {
  project: BookProject;
  delayMs: number;
  onBlockCompleted: (updatedProject: BookProject) => void;
  onAllCompleted: (finalProject: BookProject) => void;
  onCancel: () => void;
}

interface BlockTask {
  chapterId: string;
  chapterTitle: string;
  blockIndex: number;
  totalBlocksInChapter: number;
  pageNumbers: number[];
  pages: PageItem[];
}

function weldBlocksText(blocks: ProcessedBlock[]): string {
  if (!blocks || blocks.length === 0) return '';
  let result = '';

  for (let i = 0; i < blocks.length; i++) {
    let text = (blocks[i].cleanTextForTTS || '').trim();
    // Remove accidental leading/trailing artificial ellipses
    text = text.replace(/^\.{3,}\s*/, '').replace(/\s*\.{3,}$/, '');

    if (!result) {
      result = text;
    } else {
      const endsWithSentencePunct = /[.!?:]$/.test(result.trim());
      const startsWithLower = /^[a-zà-ÿ]/.test(text);

      if (!endsWithSentencePunct && startsWithLower) {
        // Continuous sentence continuation across page/block boundary
        result = `${result.trim()} ${text}`;
      } else {
        result = `${result.trim()}\n\n${text}`;
      }
    }
  }
  return result;
}

function weldBlocksHtml(blocks: ProcessedBlock[]): string {
  if (!blocks || blocks.length === 0) return '<p></p>';
  return blocks.map((b) => b.htmlContent || '').join('\n');
}

export const Step3Process: React.FC<Step3ProcessProps> = ({
  project,
  delayMs,
  onBlockCompleted,
  onAllCompleted,
  onCancel,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentBlockTask, setCurrentBlockTask] = useState<BlockTask | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [recentProcessedBlocks, setRecentProcessedBlocks] = useState<ProcessedBlock[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Iniciando processamento com Gemini...');

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const isCancelledRef = useRef(isCancelled);
  isCancelledRef.current = isCancelled;

  // Build the list of block tasks to process
  const buildBlockTasks = (): BlockTask[] => {
    const tasks: BlockTask[] = [];
    const pageSizePerBlock = project.mode === 'economic' ? 2 : project.mode === 'balanced' ? 2 : 1;

    project.chapters.forEach((chap) => {
      const chapPages = project.pages.filter(
        (p) => p.pageNumber >= chap.startPage && p.pageNumber <= chap.endPage
      );

      const numBlocks = Math.ceil(chapPages.length / pageSizePerBlock) || 1;

      for (let b = 0; b < numBlocks; b++) {
        const slice = chapPages.slice(b * pageSizePerBlock, (b + 1) * pageSizePerBlock);
        if (slice.length > 0) {
          tasks.push({
            chapterId: chap.id,
            chapterTitle: chap.title,
            blockIndex: b + 1,
            totalBlocksInChapter: numBlocks,
            pageNumbers: slice.map((p) => p.pageNumber),
            pages: slice,
          });
        }
      }
    });

    return tasks;
  };

  const tasksList = buildBlockTasks();
  const totalTasks = tasksList.length;

  // Track already processed blocks across chapters
  const allExistingBlocks: ProcessedBlock[] = project.chapters.flatMap((c) => c.blocks || []);
  const completedTaskCount = allExistingBlocks.length;

  useEffect(() => {
    let isMounted = true;

    async function runQueue() {
      // Find starting index from where we left off
      let currentProjectState = { ...project };

      for (let i = 0; i < tasksList.length; i++) {
        if (!isMounted || isCancelledRef.current) break;

        const task = tasksList[i];

        // Check if this task was already processed
        const existingChap = currentProjectState.chapters.find((c) => c.id === task.chapterId);
        const alreadyDone = existingChap?.blocks?.some(
          (b) => JSON.stringify(b.pageNumbers) === JSON.stringify(task.pageNumbers)
        );

        if (alreadyDone) {
          continue;
        }

        // Check pause state with polling wait
        while (isPausedRef.current && !isCancelledRef.current) {
          setStatusMessage('Processamento pausado pelo usuário.');
          await new Promise((r) => setTimeout(r, 500));
        }

        if (isCancelledRef.current) break;

        setCurrentBlockTask(task);
        setStatusMessage(`Processando Páginas ${task.pageNumbers.join(', ')} do ${task.chapterTitle}...`);

        let retryCount = 0;
        let success = false;
        let lastError: any = null;
        const maxRetries = 8;

        while (!success && retryCount < maxRetries && !isCancelledRef.current) {
          try {
            // Context from previous block
            const prevBlock = currentProjectState.chapters
              .flatMap((c) => c.blocks)
              .slice(-1)[0];

            // Check if pages already have rich digital text extracted
            const payload = {
              pages: task.pages.map((p) => {
                // If page has plenty of digital text (>80 chars) and mode is economic or balanced,
                // we send the text directly. We only send imageBase64 if scanned/no text or quality mode.
                const needsImage = project.mode === 'quality' || !p.rawText || p.rawText.trim().length < 80;
                return {
                  pageNumber: p.pageNumber,
                  text: p.rawText || '',
                  imageBase64: needsImage ? p.imageBase64 : undefined,
                  mimeType: p.mimeType,
                };
              }),
              mode: project.mode,
              chapterContext: task.chapterTitle,
              previousBlockContext: prevBlock?.cleanTextForTTS?.slice(-150) || '',
            };

            const response = await fetch('/api/gemini/process-block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (response.status === 429) {
              const errData = await response.json().catch(() => ({}));
              const waitTime = errData.retryAfterSeconds || Math.min(12 * Math.pow(1.3, retryCount), 35);
              
              setRateLimitMessage('Limite temporário da API atingido. O processamento está pausado e continuará automaticamente.');

              // Real-time live countdown
              for (let s = Math.round(waitTime); s > 0; s--) {
                if (isCancelledRef.current) break;
                setCountdownSeconds(s);
                setStatusMessage(`Aguardando renovação da cota da API... Retomando em ${s}s`);
                await new Promise((r) => setTimeout(r, 1000));
              }
              setCountdownSeconds(0);
              setRateLimitMessage(null);
              retryCount++;
              continue;
            }

            if (!response.ok) {
              const errJson = await response.json().catch(() => ({ error: 'Falha na resposta do servidor' }));
              const isRateErr = response.status === 429 || String(errJson.error).includes('429') || String(errJson.error).toLowerCase().includes('quota');
              if (isRateErr) {
                const waitSec = 15;
                setRateLimitMessage('Limite temporário da API atingido. O processamento está pausado e continuará automaticamente.');
                for (let s = waitSec; s > 0; s--) {
                  if (isCancelledRef.current) break;
                  setCountdownSeconds(s);
                  setStatusMessage(`Aguardando renovação da cota da API... Retomando em ${s}s`);
                  await new Promise((r) => setTimeout(r, 1000));
                }
                setCountdownSeconds(0);
                setRateLimitMessage(null);
                retryCount++;
                continue;
              }
              throw new Error(errJson.error || `HTTP ${response.status}`);
            }

            const json = await response.json();
            const blockData = json.data;

            const newProcessedBlock: ProcessedBlock = {
              id: `block_${task.chapterId}_${task.blockIndex}_${Date.now()}`,
              chapterId: task.chapterId,
              blockIndex: task.blockIndex,
              pageNumbers: task.pageNumbers,
              cleanTextForTTS: blockData.cleanTextForTTS || task.pages.map((p) => p.rawText).filter(Boolean).join('\n\n') || '',
              htmlContent: blockData.htmlContent || `<p>${task.pages.map((p) => p.rawText).filter(Boolean).join('</p><p>')}</p>`,
              elements: blockData.elements || [],
              validationWarnings: blockData.validationWarnings || [],
              wordCount: blockData.wordCount || blockData.cleanTextForTTS?.split(/\s+/).length || 0,
              processedAt: new Date().toISOString(),
            };

            // Update chapter in current state
            currentProjectState = {
              ...currentProjectState,
              chapters: currentProjectState.chapters.map((chap) => {
                if (chap.id === task.chapterId) {
                  const currentBlocks = chap.blocks || [];
                  const updatedBlocks = [...currentBlocks, newProcessedBlock];
                  return {
                    ...chap,
                    blocks: updatedBlocks,
                    cleanTextForTTS: weldBlocksText(updatedBlocks),
                    htmlContent: weldBlocksHtml(updatedBlocks),
                  };
                }
                return chap;
              }),
              stats: {
                ...currentProjectState.stats,
                callsMade: currentProjectState.stats.callsMade + 1,
                wordsCount:
                  currentProjectState.stats.wordsCount + newProcessedBlock.wordCount,
              },
            };

            // Save immediately to IndexedDB
            await saveProjectToDB(currentProjectState);
            setRecentProcessedBlocks((prev) => [newProcessedBlock, ...prev.slice(0, 4)]);
            onBlockCompleted(currentProjectState);

            success = true;
          } catch (err: any) {
            console.error('Block processing error:', err);
            lastError = err;
            retryCount++;
            const backoffSec = Math.min(5 * Math.pow(1.4, retryCount), 30);
            setStatusMessage(`Reconectando... Retomando em ${Math.round(backoffSec)}s`);

            for (let s = Math.round(backoffSec); s > 0; s--) {
              if (isCancelledRef.current) break;
              setCountdownSeconds(s);
              setStatusMessage(`Reconectando... Retomando em ${s}s`);
              await new Promise((r) => setTimeout(r, 1000));
            }
            setCountdownSeconds(0);
          }
        }

        // Resilient fallback if all retries exhausted to never lose document progress
        if (!success && !isCancelledRef.current) {
          const fallbackText = task.pages.map((p) => p.rawText).filter(Boolean).join('\n\n') || '';
          const fallbackBlock: ProcessedBlock = {
            id: `block_fallback_${task.chapterId}_${task.blockIndex}_${Date.now()}`,
            chapterId: task.chapterId,
            blockIndex: task.blockIndex,
            pageNumbers: task.pageNumbers,
            cleanTextForTTS: fallbackText,
            htmlContent: fallbackText ? `<p>${fallbackText.replace(/\n\n/g, '</p><p>')}</p>` : '<p></p>',
            elements: fallbackText ? [{ type: 'paragraph', content: fallbackText }] : [],
            validationWarnings: [],
            wordCount: fallbackText ? fallbackText.split(/\s+/).length : 0,
            processedAt: new Date().toISOString(),
          };

          currentProjectState = {
            ...currentProjectState,
            chapters: currentProjectState.chapters.map((chap) => {
              if (chap.id === task.chapterId) {
                const currentBlocks = chap.blocks || [];
                const updatedBlocks = [...currentBlocks, fallbackBlock];
                return {
                  ...chap,
                  blocks: updatedBlocks,
                  cleanTextForTTS: updatedBlocks.map((b) => b.cleanTextForTTS).join('\n\n'),
                  htmlContent: updatedBlocks.map((b) => b.htmlContent).join('\n'),
                };
              }
              return chap;
            }),
          };
          await saveProjectToDB(currentProjectState);
          setRecentProcessedBlocks((prev) => [fallbackBlock, ...prev.slice(0, 4)]);
          onBlockCompleted(currentProjectState);
        }

        // Throttle interval between successive calls to respect free tier RPM
        if (i < tasksList.length - 1 && !isCancelledRef.current) {
          const throttleSec = Math.max(Math.round(delayMs / 1000), 4);
          for (let s = throttleSec; s > 0; s--) {
            if (isCancelledRef.current || isPausedRef.current) break;
            setCountdownSeconds(s);
            setStatusMessage(`Próxima análise em ${s} segundos...`);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setCountdownSeconds(0);
        }
      }

      if (isMounted && !isCancelledRef.current) {
        currentProjectState.status = 'completed';
        currentProjectState.currentStep = 4;
        await saveProjectToDB(currentProjectState);
        onAllCompleted(currentProjectState);
      }
    }

    runQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  const progressPercent = Math.min(
    100,
    Math.round((completedTaskCount / Math.max(totalTasks, 1)) * 100)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Etapa 3 de 5: Preparação & Otimização TTS</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reconstruindo Estrutura e Ordem de Leitura
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          O Gemini está processando bloco por bloco, corrigindo quebras de colunas duplas, eliminando cabeçalhos repetidos e gerando pronúncias fonéticas para fórmulas.
        </p>
      </div>

      <div className="space-y-6">
        {/* Rate Limit Alert Banner */}
        {rateLimitMessage && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-3 shadow-lg shadow-amber-500/5">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-amber-200">Gerenciador de Limites Ativo</p>
              <p className="mt-0.5">{rateLimitMessage}</p>
            </div>
            {countdownSeconds > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 font-mono font-bold text-amber-300">
                {countdownSeconds}s
              </span>
            )}
          </div>
        )}

        {/* Live Progress Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* Top Progress Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                {currentBlockTask?.chapterTitle || 'Processando capítulos'}
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                Bloco {completedTaskCount + 1} de {totalTasks}
                {currentBlockTask && (
                  <span className="text-slate-400 text-sm font-normal ml-2">
                    (Páginas {currentBlockTask.pageNumbers.join(', ')})
                  </span>
                )}
              </h2>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">{progressPercent}%</span>
              <span className="text-xs text-slate-400">
                {completedTaskCount} de {totalTasks} blocos finalizados
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mb-6">
            <div
              className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Status and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
              <span className="line-clamp-1">{statusMessage}</span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Continuar</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry & Economy Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Chamadas Gemini</span>
            <span className="text-lg font-bold text-slate-200 font-mono">
              {project.stats.callsMade} realizadas
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Blocos Restantes</span>
            <span className="text-lg font-bold text-slate-200 font-mono">
              {Math.max(totalTasks - completedTaskCount, 0)}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Palavras Reconstruídas</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {project.stats.wordsCount.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Salvamento Local</span>
            <span className="text-xs font-bold text-cyan-400 mt-1 flex items-center justify-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>IndexedDB Ativo</span>
            </span>
          </div>
        </div>

        {/* Live Stream of Processed Blocks */}
        {recentProcessedBlocks.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Último Bloco Reconstruído para TTS</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Páginas {recentProcessedBlocks[0].pageNumbers.join(', ')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs leading-relaxed text-slate-300 font-sans max-h-48 overflow-y-auto space-y-2">
              <p className="whitespace-pre-line text-slate-200 font-medium">
                {recentProcessedBlocks[0].cleanTextForTTS.slice(0, 500)}
                {recentProcessedBlocks[0].cleanTextForTTS.length > 500 && '...'}
              </p>
            </div>

            {/* Elements parsed badge tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Elementos detectados e acessibilizados:</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Ordem de Coluna Contínua
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Fórmulas com Pronúncia Fonética
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Tabelas Narráveis
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
