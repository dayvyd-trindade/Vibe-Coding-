import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  BookOpen,
  FileCheck,
  Smartphone,
  Headphones,
  Sparkles,
  ArrowLeft,
  Share2,
  Layers,
  FileText,
  ShieldCheck,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { BookProject } from '../types';
import { generateEpubBlob } from '../services/epubGenerator';

interface Step5ExportProps {
  project: BookProject;
  onBackToReview: () => void;
  onResetProject: () => void;
}

export const Step5Export: React.FC<Step5ExportProps> = ({
  project,
  onBackToReview,
  onResetProject,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadEpub = async () => {
    try {
      setIsGenerating(true);
      const epubBlob = await generateEpubBlob(project);

      // Trigger browser download
      const cleanTitle = (project.metadata.title || 'LivroTTS')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const fileName = `${cleanTitle}_TTS.epub`;

      const url = URL.createObjectURL(epubBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
    } catch (err) {
      console.error('Error generating EPUB:', err);
      alert('Erro ao gerar arquivo EPUB. Verifique o console.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Etapa 5 de 5: Pronto para Download</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          EPUB Otimizado e Pronto para Leitura por Voz
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          O seu livro foi reestruturado e empacotado no padrão EPUB 3 com acessibilidade fonética, compatível com os principais aplicativos de leitura e síntese de voz.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Download Card */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 mb-5">
            <BookOpen className="w-10 h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
            {project.metadata.title || 'Livro Didático Otimizado'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            Por {project.metadata.author || 'Autor Desconhecido'} • {project.chapters.length} Capítulos • ~{project.stats.wordsCount.toLocaleString('pt-BR')} palavras
          </p>

          <div className="max-w-md mx-auto mb-6">
            <button
              type="button"
              onClick={handleDownloadEpub}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Empacotando EPUB 3...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Baixar Arquivo .EPUB</span>
                </>
              )}
            </button>

            {downloadSuccess && (
              <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center justify-center space-x-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Download iniciado com sucesso!</span>
              </p>
            )}
          </div>

          {/* Standards & Specs Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Padrão EPUB 3.0 Refluível</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Preparado para TTS</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sumário Nav & NCX Duplo</span>
            </span>
          </div>
        </div>

        {/* EPUB Architecture Checklist */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 mb-4">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Validação da Estrutura do Arquivo EPUB</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">mimetype uncompressed</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Primeiro arquivo armazenado sem compressão no zip conforme norma IDPF.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">OEBPS/content.opf & Dublin Core</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Metadados (título, autor, idioma pt-BR, UUID e data) com manifesto e spine completos.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">OEBPS/nav.xhtml & toc.ncx</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Sumário moderno EPUB 3 mais compatibilidade retroativa para leitores legados.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">Estilos CSS & Acessibilidade TTS</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Fórmulas matemáticas com pronúncia e tabelas organizadas para leitura linear.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Listen in Readers Guide */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 mb-4">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Como Abrir e Ouvir nos Melhores Leitores com TTS</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* ElevenReader */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-xs text-slate-200">ElevenReader (Vozes IA)</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Abra o app ElevenReader no celular (Android/iOS), toque em "Import" e selecione o arquivo EPUB baixado. A leitura começará com vozes ultra-realistas.
              </p>
            </div>

            {/* ReadEra */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-xs text-slate-200">ReadEra (Android)</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Abra o ReadEra, localize o EPUB e toque no ícone de fones de ouvido 🎧 no menu superior para iniciar a leitura contínua offline em português.
              </p>
            </div>

            {/* Google Play Books */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-xs text-slate-200">Google Play Livros</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Faça o upload do EPUB no Google Play Livros (Web ou app). Toque nos 3 pontinhos e selecione "Ler em voz alta" para sincronizar áudio e texto.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBackToReview}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Revisão</span>
          </button>

          <button
            type="button"
            onClick={onResetProject}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Converter Outro Livro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
