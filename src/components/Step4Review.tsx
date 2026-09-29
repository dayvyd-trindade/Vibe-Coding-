import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Volume2,
  Play,
  Pause,
  Square,
  Edit3,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { BookProject, Chapter } from '../types';
import { ttsAudio, VoiceOption } from '../services/ttsAudio';
import { saveProjectToDB } from '../services/db';

interface Step4ReviewProps {
  project: BookProject;
  onProjectUpdated: (project: BookProject) => void;
  onProceedToExport: () => void;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  project,
  onProjectUpdated,
  onProceedToExport,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    project.chapters[0]?.id || ''
  );
  const [viewTab, setViewTab] = useState<'visual' | 'tts_text' | 'editor'>('visual');
  const [editingContent, setEditingContent] = useState<string>('');
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);

  // Audio TTS player states
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPausedAudio, setIsPausedAudio] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [highlightRange, setHighlightRange] = useState<{ start: number; length: number } | null>(null);

  const selectedChapter =
    project.chapters.find((c) => c.id === selectedChapterId) || project.chapters[0];

  useEffect(() => {
    if (selectedChapter) {
      setEditingContent(selectedChapter.cleanTextForTTS || selectedChapter.htmlContent || '');
    }
  }, [selectedChapterId]);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = ttsAudio.getAvailableVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      ttsAudio.stop();
    };
  }, []);

  const handlePlayVoice = () => {
    if (!selectedChapter) return;
    const textToSpeak = selectedChapter.cleanTextForTTS || selectedChapter.htmlContent?.replace(/<[^>]+>/g, ' ') || '';

    if (isPausedAudio) {
      ttsAudio.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    setIsPlayingAudio(true);
    setIsPausedAudio(false);

    const voice = availableVoices[selectedVoiceIndex]?.voice;

    ttsAudio.speak(textToSpeak, {
      voice,
      rate: audioSpeed,
      onBoundary: (charIndex, length) => {
        setHighlightRange({ start: charIndex, length });
      },
      onEnd: () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        setHighlightRange(null);
      },
      onError: () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        setHighlightRange(null);
      },
    });
  };

  const handlePauseVoice = () => {
    ttsAudio.pause();
    setIsPausedAudio(true);
    setIsPlayingAudio(false);
  };

  const handleStopVoice = () => {
    ttsAudio.stop();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setHighlightRange(null);
  };

  const handleSaveChapterEdits = async () => {
    if (!selectedChapter) return;

    const updatedChapters = project.chapters.map((chap) => {
      if (chap.id === selectedChapter.id) {
        return {
          ...chap,
          cleanTextForTTS: editingContent,
          htmlContent: `<p>${editingContent.split('\n\n').join('</p><p>')}</p>`,
        };
      }
      return chap;
    });

    const updatedProject: BookProject = {
      ...project,
      chapters: updatedChapters,
      metadata: {
        ...project.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    await saveProjectToDB(updatedProject);
    onProjectUpdated(updatedProject);

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  // Extract all validation warnings across chapters
  const allWarnings = project.chapters.flatMap((c) =>
    (c.blocks || []).flatMap((b) => b.validationWarnings || [])
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Eye className="w-3.5 h-3.5" />
          <span>Etapa 4 de 5: Revisão & Teste de Áudio TTS</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Revise e Ouça o Conteúdo Preparado
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
          Ouça como o leitor de voz reproduzirá cada capítulo sem interrupções por cabeçalhos ou colunas truncadas. Você pode ajustar textos manualmente antes de exportar o EPUB final.
        </p>
      </div>

      {/* Voice Player Sticky Toolbar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 mb-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-indigo-300' : ''}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              Testador de Leitura por Voz (TTS Integrado)
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              Ouvindo: {selectedChapter?.title || 'Capítulo'}
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          {/* Voices Dropdown */}
          {availableVoices.length > 0 && (
            <select
              value={selectedVoiceIndex}
              onChange={(e) => {
                handleStopVoice();
                setSelectedVoiceIndex(Number(e.target.value));
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 max-w-[170px] truncate"
              title="Selecione a voz de síntese"
            >
              {availableVoices.map((v, idx) => (
                <option key={idx} value={idx}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          {/* Speed selector */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
            <span className="text-[10px] text-slate-400">Velocidade:</span>
            {[0.8, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setAudioSpeed(speed)}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  audioSpeed === speed
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Play / Pause / Stop Buttons */}
          <div className="flex items-center space-x-1.5">
            {!isPlayingAudio ? (
              <button
                type="button"
                onClick={handlePlayVoice}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ouvir Capítulo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseVoice}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStopVoice}
              disabled={!isPlayingAudio && !isPausedAudio}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition disabled:opacity-30 cursor-pointer"
              title="Parar áudio"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Chapters & Summary */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Capítulos ({project.chapters.length})</span>
            </h3>

            <div className="space-y-1.5">
              {project.chapters.map((chap, idx) => {
                const isSelected = chap.id === selectedChapterId;
                const wordCount =
                  chap.blocks?.reduce((acc, b) => acc + b.wordCount, 0) ||
                  chap.cleanTextForTTS?.split(/\s+/).length ||
                  0;

                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      handleStopVoice();
                      setSelectedChapterId(chap.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200'
                        : 'hover:bg-slate-800/60 text-slate-400 border border-transparent'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 line-clamp-1">{chap.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Págs. {chap.startPage}–{chap.endPage}</span>
                      <span>~{wordCount} palavras</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Book Metrics Badge */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span>Total de Palavras:</span>
              <span className="font-mono font-bold text-emerald-400">
                {project.stats.wordsCount.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Páginas Processadas:</span>
              <span className="font-mono font-bold text-slate-200">{project.pages.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Qualidade para Voz:</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Otimizado</span>
              </span>
            </div>
          </div>

          {/* Validation audit summary */}
          {allWarnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Avisos de Validação ({allWarnings.length})</span>
              </div>
              <ul className="list-disc pl-4 text-[11px] text-amber-200/90 space-y-0.5">
                {allWarnings.slice(0, 3).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Content Area: Viewer & Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {/* View Switcher Tabs */}
            <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewTab('visual')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewTab === 'visual'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualização Formatada (EPUB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewTab('tts_text')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewTab === 'tts_text'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Fluxo de Áudio TTS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewTab('editor')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewTab === 'editor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Texto</span>
                </button>
              </div>

              {viewTab === 'editor' && (
                <button
                  type="button"
                  onClick={handleSaveChapterEdits}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              )}
            </div>

            {/* Saved Banner */}
            {isSavedAlert && (
              <div className="p-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Alterações salvas no banco de dados local com sucesso!</span>
              </div>
            )}

            {/* Tab 1: Visual Formatted Reader */}
            {viewTab === 'visual' && (
              <div className="p-6 bg-slate-950 text-slate-100 min-h-[420px] max-h-[600px] overflow-y-auto space-y-4">
                <h2 className="text-xl font-bold text-slate-100 border-b border-slate-800 pb-2">
                  {selectedChapter?.title}
                </h2>

                <div
                  className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedChapter?.htmlContent ||
                      `<p>${selectedChapter?.cleanTextForTTS?.replace(/\n\n/g, '</p><p>')}</p>` ||
                      '<p>Nenhum conteúdo disponível.</p>',
                  }}
                />
              </div>
            )}

            {/* Tab 2: Clean TTS Voice Flow */}
            {viewTab === 'tts_text' && (
              <div className="p-6 bg-slate-950 text-slate-200 min-h-[420px] max-h-[600px] overflow-y-auto font-sans leading-relaxed text-sm whitespace-pre-wrap">
                <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>
                    Este é o fluxo contínuo lido por leitores de voz (ElevenReader, ReadEra, Google Play Books). Números soltos de página e hifens foram removidos.
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed font-sans">
                  {selectedChapter?.cleanTextForTTS || 'Sem texto extraído.'}
                </div>
              </div>
            )}

            {/* Tab 3: Editor */}
            {viewTab === 'editor' && (
              <div className="p-4 bg-slate-950 min-h-[420px] flex flex-col">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full flex-1 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y min-h-[380px]"
                  placeholder="Edite o conteúdo do capítulo..."
                />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onProceedToExport}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Avançar para Gerar EPUB</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
