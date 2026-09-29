import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  MoveLeft,
  MoveRight,
  Trash2,
  AlertCircle,
  FileCheck,
  Plus,
  Loader2,
} from 'lucide-react';
import { PageItem, BookProject } from '../types';
import { extractPagesFromPDF, processImageFiles } from '../services/pdfExtractor';

interface Step1UploadProps {
  onPagesReady: (
    pages: PageItem[],
    fileInfo: { name: string; size: string; type: 'pdf' | 'images' }
  ) => void;
  onBatchUpload?: (files: File[]) => void;
  onLoadSample: () => void;
  existingProject?: BookProject | null;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({
  onPagesReady,
  onBatchUpload,
  onLoadSample,
  existingProject,
}) => {
  const [pages, setPages] = useState<PageItem[]>(existingProject?.pages || []);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    type: 'pdf' | 'images';
  }>({
    name: existingProject?.metadata.fileName || '',
    size: existingProject?.metadata.fileSizeFormatted || '',
    type: existingProject?.metadata.fileType || 'pdf',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handlePdfUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage('');
      setProgressMsg('Lendo arquivo PDF e gerando páginas...');

      const extracted = await extractPagesFromPDF(file, (current, total) => {
        setProgressMsg(`Processando página ${current} de ${total}...`);
      });

      if (extracted.length === 0) {
        throw new Error('Não foi possível extrair páginas deste arquivo PDF.');
      }

      setPages(extracted);
      setFileInfo({
        name: file.name,
        size: formatFileSize(file.size),
        type: 'pdf',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao carregar o arquivo PDF.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    try {
      setIsProcessing(true);
      setErrorMessage('');
      setProgressMsg('Lendo imagens das páginas...');

      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)
      );

      if (fileArray.length === 0) {
        throw new Error('Nenhum arquivo de imagem válido selecionado (PNG, JPG, JPEG).');
      }

      const totalSize = fileArray.reduce((acc, f) => acc + f.size, 0);

      const extracted = await processImageFiles(fileArray, (current, total) => {
        setProgressMsg(`Carregando imagem ${current} de ${total}...`);
      });

      // Append to current pages if any
      const updatedPages = [...pages, ...extracted].map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
      }));

      setPages(updatedPages);
      setFileInfo({
        name: `${fileArray.length} imagens selecionadas`,
        size: formatFileSize(totalSize),
        type: 'images',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao carregar imagens.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      if (pdfFiles.length > 1 && onBatchUpload) {
        onBatchUpload(pdfFiles);
      } else if (pdfFiles.length === 1) {
        handlePdfUpload(pdfFiles[0]);
      } else {
        handleImageUpload(e.dataTransfer.files);
      }
    }
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    // Reindex page numbers
    const reindexed = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));
    setPages(reindexed);
  };

  const removePage = (index: number) => {
    const newPages = pages.filter((_, idx) => idx !== index);
    const reindexed = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));
    setPages(reindexed);
  };

  const handleContinue = () => {
    if (pages.length === 0) return;
    onPagesReady(pages, fileInfo);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Intro Hero */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fidelidade Total ao Material Original</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Adicione seu Livro ou Material Didático
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Suporta PDFs (com texto ou escaneados) e sequências de imagens (JPG/PNG). O Gemini interpretará colunas duplas, fórmulas e tabelas para criar uma leitura por voz impecável.
        </p>
      </div>

      {/* Upload Dropzone */}
      {pages.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/50'
          }`}
        >
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 1 && onBatchUpload) {
                onBatchUpload(Array.from(files));
              } else if (files && files.length === 1) {
                handlePdfUpload(files[0]);
              }
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-sm font-medium text-slate-200">{progressMsg}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-200">
                  Arraste e solte o livro em PDF ou conjunto de imagens aqui
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF com texto, PDF escaneado, apostilas em JPG ou PNG
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Selecionar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Selecionar Imagens</span>
                </button>
              </div>

              {/* Sample Button in Dropzone */}
              <div className="pt-4 border-t border-slate-800 w-full max-w-sm mt-4">
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ou clique aqui para testar com livro de física de exemplo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pages Preview & Reordering Grid */}
      {pages.length > 0 && (
        <div className="space-y-6">
          {/* File summary bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">{fileInfo.name || 'Documento Carregado'}</h3>
                <p className="text-xs text-slate-400">
                  {pages.length} {pages.length === 1 ? 'página' : 'páginas'} • {fileInfo.size || 'Tamanho desconhecido'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Páginas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPages([]);
                  setFileInfo({ name: '', size: '', type: 'pdf' });
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>
          </div>

          {/* Helper notice */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>Você pode reordenar as páginas usando as setas abaixo de cada miniatura.</span>
            <span className="text-indigo-400 font-medium">Ordem sequencial: 1 até {pages.length}</span>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col group hover:border-slate-700 transition shadow-sm"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">
                  {page.thumbnailBase64 || page.imageBase64 ? (
                    <img
                      src={page.thumbnailBase64 || `data:${page.mimeType || 'image/jpeg'};base64,${page.imageBase64}`}
                      alt={`Página ${page.pageNumber}`}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="p-2 text-[10px] text-slate-400 overflow-hidden font-mono line-clamp-6">
                      {page.rawText || 'Página de texto'}
                    </div>
                  )}

                  {/* Badge page number */}
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/90 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                    Pág. {page.pageNumber}
                  </span>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removePage(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600/80 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm"
                    title="Remover esta página"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Page Controls */}
                <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-slate-400">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => movePage(idx, idx - 1)}
                    className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Mover para esquerda"
                  >
                    <MoveLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-medium text-slate-400">
                    {idx + 1} / {pages.length}
                  </span>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => movePage(idx, idx + 1)}
                    className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Mover para direita"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Continue button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Avançar para Análise de Estrutura</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
