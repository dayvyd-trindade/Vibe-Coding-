import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import { BookMetadata, Chapter, PageItem, ProcessingMode } from '../types';

interface Step2AnalyzeProps {
  metadata: BookMetadata;
  pages: PageItem[];
  chapters: Chapter[];
  mode: ProcessingMode;
  onUpdateMetadata: (meta: BookMetadata) => void;
  onUpdateChapters: (chaps: Chapter[]) => void;
  onUpdateMode: (mode: ProcessingMode) => void;
  onStartProcessing: (delayMs: number) => void;
  onBack: () => void;
}

export const Step2Analyze: React.FC<Step2AnalyzeProps> = ({
  metadata,
  pages,
  chapters,
  mode,
  onUpdateMetadata,
  onUpdateChapters,
  onUpdateMode,
  onStartProcessing,
  onBack,
}) => {
  const [title, setTitle] = useState(metadata.title || '');
  const [author, setAuthor] = useState(metadata.author || '');
  const [language, setLanguage] = useState(metadata.language || 'pt-BR');
  const [description, setDescription] = useState(metadata.description || '');
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>(mode || 'economic');
  const [delayBetweenCallsSec, setDelayBetweenCallsSec] = useState<number>(6); // Safe default for free tier
  const [isAnalyzingStructure, setIsAnalyzingStructure] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [localChapters, setLocalChapters] = useState<Chapter[]>(
    chapters.length > 0
      ? chapters
      : [
          {
            id: 'chap_1',
            title: 'Capítulo 1: Conteúdo Principal',
            order: 1,
            startPage: 1,
            endPage: pages.length || 1,
            blocks: [],
          },
        ]
  );

  useEffect(() => {
    // If title is empty, trigger quick initial structure suggestion or use filename
    if (!title && pages.length > 0) {
      const cleanFileName = metadata.fileName
        ? metadata.fileName.replace(/\.(pdf|jpg|jpeg|png)$/i, '').replace(/[-_]/g, ' ')
        : 'Livro de Estudo';
      setTitle(cleanFileName);
    }
  }, []);

  const handleAutoAnalyzeStructure = async () => {
    try {
      setIsAnalyzingStructure(true);
      setAnalysisStatus('Examinando as primeiras páginas com Gemini para detectar sumário e capítulos...');

      // Gather sample text from the first 3 pages
      const sampleText = pages
        .slice(0, 3)
        .map((p) => `[Página ${p.pageNumber}]\n${p.rawText || ''}`)
        .join('\n\n');

      // Prepare thumbnail images if available for multimodal analysis
      const sampleImages = pages
        .slice(0, 3)
        .filter((p) => p.imageBase64)
        .map((p) => ({
          mimeType: p.mimeType || 'image/jpeg',
          data: p.imageBase64,
        }));

      const res = await fetch('/api/gemini/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          samplePagesText: sampleText,
          imagesBase64: sampleImages,
          mode: selectedMode,
          docTitle: title || metadata.fileName,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.title && d.title !== 'Sem título') setTitle(d.title);
        if (d.author && d.author !== 'Não informado') setAuthor(d.author);
        if (d.description) setDescription(d.description);

        if (d.estimatedChapters && Array.isArray(d.estimatedChapters) && d.estimatedChapters.length > 0) {
          const generatedChapters: Chapter[] = d.estimatedChapters.map((c: any, idx: number) => ({
            id: c.id || `chap_${idx + 1}`,
            title: c.title || `Capítulo ${idx + 1}`,
            order: idx + 1,
            startPage: c.startPage || 1,
            endPage: c.estimatedEndPage || pages.length,
            blocks: [],
          }));
          setLocalChapters(generatedChapters);
        }
      }
    } catch (err) {
      console.warn('Auto analyze error:', err);
    } finally {
      setIsAnalyzingStructure(false);
      setAnalysisStatus('');
    }
  };

  // Automatically scan the book for chapters/structure on load
  useEffect(() => {
    if (pages.length > 0 && (!metadata.author || localChapters.length <= 1)) {
      handleAutoAnalyzeStructure();
    }
  }, []);

  const handleStart = () => {
    onUpdateMetadata({
      ...metadata,
      title: title.trim() || 'Livro Sem Título',
      author: author.trim() || 'Autor do Livro',
      language,
      description: description.trim() || 'Processado pelo LivroTTS AI.',
      updatedAt: new Date().toISOString(),
    });
    onUpdateChapters(localChapters);
    onUpdateMode(selectedMode);
    onStartProcessing(delayBetweenCallsSec * 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>Etapa 2 de 5: Configuração & Estrutura</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Metadados e Organização dos Capítulos
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          Confira o título, autor e divisão dos capítulos. O EPUB gerará arquivos XHTML separados para cada capítulo, mantendo a leitura leve e navegável.
        </p>
      </div>

      <div className="space-y-6">
        {/* Book Metadata Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Informações do Livro</span>
            </h2>

            <button
              type="button"
              onClick={handleAutoAnalyzeStructure}
              disabled={isAnalyzingStructure}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {isAnalyzingStructure ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analisando Sumário...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Identificar com IA</span>
                </>
              )}
            </button>
          </div>

          {analysisStatus && (
            <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{analysisStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Título da Obra / Livro *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Manual de Física e Termodinâmica"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Autor(es) / Organização
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Prof. Dr. Ricardo Mendonça"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Idioma Principal do Material
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="pt-BR">Português (Brasil) - pt-BR</option>
                <option value="pt-PT">Português (Portugal) - pt-PT</option>
                <option value="en-US">Inglês - en-US</option>
                <option value="es-ES">Espanhol - es-ES</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descrição Breve
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Material de estudo estruturado para leitores de voz (TTS)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Specialized ElevenReader & TTS Optimizations Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                Otimizações Especializadas para ElevenReader & Leitores TTS
              </h2>
              <p className="text-xs text-slate-400">
                Padrões aplicados automaticamente pelo LivroTTS AI para garantir leitura fluida
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-2">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Soldagem de Frases Entre Páginas</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Evita quedas de tom e pausas falsas unificando sentenças cortadas no final de página.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Pronúncia Fonética de Fórmulas</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Gera transcrição falada de equações (ex: "E é igual a m vezes c ao quadrado").
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Expansão de Unidades & Siglas</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Converte "km/h", "m/s²", "°C", "R$", "pág." em palavras por extenso no fluxo de áudio.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Narrativa Linear para Tabelas</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Cria resumo audível claro para o sintetizador não se perder em colunas numéricas soltas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Mode Selection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Modo de Processamento & Economia de API</span>
            </h2>
            <span className="text-xs text-slate-400">Otimizado para cota gratuita</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mode: Economic */}
            <div
              onClick={() => setSelectedMode('economic')}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedMode === 'economic'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ECONÔMICO (Padrão)
                  </span>
                  {selectedMode === 'economic' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-300 font-medium">Menor número de chamadas</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Blocos maiores (2–3 págs), modelo Flash-Lite ultra econômico. Ideal para livros e apostilas de qualquer tamanho.
                </p>
              </div>
            </div>

            {/* Mode: Balanced */}
            <div
              onClick={() => setSelectedMode('balanced')}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedMode === 'balanced'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    EQUILIBRADO
                  </span>
                  {selectedMode === 'balanced' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-xs text-slate-300 font-medium">Análise aprofundada</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Utiliza Gemini Flash para análise minuciosa de colunas complexas, tabelas e fórmulas científicas.
                </p>
              </div>
            </div>

            {/* Mode: Quality */}
            <div
              onClick={() => setSelectedMode('quality')}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedMode === 'quality'
                  ? 'bg-purple-500/10 border-purple-500/50 shadow-md shadow-purple-500/5'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    QUALIDADE MÁXIMA
                  </span>
                  {selectedMode === 'quality' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-xs text-slate-300 font-medium">Decomposição página a página</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Para livros escaneados com muitas anotações laterais ou fórmulas matemáticas densas.
                </p>
              </div>
            </div>
          </div>

          {/* Rate limiting delay control */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Intervalo entre requisições (proteção contra erro 429):</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={3}
                max={20}
                step={1}
                value={delayBetweenCallsSec}
                onChange={(e) => setDelayBetweenCallsSec(Number(e.target.value))}
                className="w-28 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-indigo-300 w-12 text-right">
                {delayBetweenCallsSec}s
              </span>
            </div>
          </div>
        </div>

        {/* Naturally Detected Book Structure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Estrutura Original do Livro ({localChapters.length} {localChapters.length === 1 ? 'Capítulo' : 'Capítulos'})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seguindo automaticamente a paginação e os tópicos reais da obra ({pages.length} páginas)
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoAnalyzeStructure}
              disabled={isAnalyzingStructure}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reanalisar Sumário</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {localChapters.map((chap, idx) => (
              <div
                key={chap.id}
                className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 font-mono text-[11px] flex items-center justify-center font-bold border border-indigo-500/30">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {chap.title}
                  </span>
                </div>

                <div className="text-right text-slate-400 font-mono text-[11px] bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  Páginas {chap.startPage} a {chap.endPage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Páginas</span>
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Iniciar Preparação para TTS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
