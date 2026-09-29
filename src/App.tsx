import React, { useState, useEffect, useRef } from 'react';
import { BookProject, PageItem, BookMetadata, Chapter, ProcessingMode, QueueBookItem } from './types';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { Step1Upload } from './components/Step1Upload';
import { Step2Analyze } from './components/Step2Analyze';
import { Step3Process } from './components/Step3Process';
import { Step4Review } from './components/Step4Review';
import { Step5Export } from './components/Step5Export';
import { QueueWidget } from './components/QueueWidget';
import { saveProjectToDB, getLatestProject, clearAllProjectsFromDB } from './services/db';
import { createSampleBookProject } from './services/sampleData';
import { extractPagesFromPDF } from './services/pdfExtractor';
import { generateEpubBlob, downloadEpubBlob } from './services/epubGenerator';
import { requestNotificationPermission, sendBackgroundNotification } from './services/notificationService';

export default function App() {
  const [project, setProject] = useState<BookProject | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);
  const [delayMs, setDelayMs] = useState<number>(6000);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(true);

  // Continuous Multi-Book Queue State
  const [queue, setQueue] = useState<QueueBookItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);

  // Load latest project from IndexedDB on mount
  useEffect(() => {
    async function loadSavedProject() {
      try {
        const saved = await getLatestProject();
        if (saved) {
          setProject(saved);
          setCurrentStep(saved.currentStep || 1);
          setMaxUnlockedStep(Math.max(saved.currentStep || 1, 1));
          
          // Seed queue with saved project
          setQueue([
            {
              id: `queue_${saved.metadata.id}`,
              project: saved,
              status: saved.status === 'completed' ? 'completed' : 'processing',
              progressPercent: saved.status === 'completed' ? 100 : 0,
              addedAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        console.warn('Could not load saved project:', e);
      } finally {
        setIsLoadingDB(false);
      }
    }
    loadSavedProject();
  }, []);

  // Update Dynamic Document Title
  useEffect(() => {
    if (project && isProcessingQueue) {
      const activeQueueItem = queue[currentQueueIndex];
      const percent = activeQueueItem?.progressPercent || 0;
      document.title = `(${percent}%) LivroTTS AI - ${project.metadata.title || 'Processando'}`;
    } else if (project?.metadata?.title) {
      document.title = `LivroTTS AI - ${project.metadata.title}`;
    } else {
      document.title = 'LivroTTS AI - Editor de Livros para Voz & EPUB';
    }
  }, [project, isProcessingQueue, queue, currentQueueIndex]);

  // Save project to IndexedDB whenever it updates
  const updateProject = async (updated: BookProject) => {
    setProject(updated);
    await saveProjectToDB(updated);

    // Sync queue item
    setQueue((prev) =>
      prev.map((item) =>
        item.project.metadata.id === updated.metadata.id
          ? { ...item, project: updated }
          : item
      )
    );
  };

  const handleLoadSample = async () => {
    const sample = createSampleBookProject();
    setProject(sample);
    setCurrentStep(4); // Review step
    setMaxUnlockedStep(5);
    await saveProjectToDB(sample);

    setQueue((prev) => [
      ...prev.filter((q) => q.project.metadata.id !== sample.metadata.id),
      {
        id: `queue_${sample.metadata.id}`,
        project: sample,
        status: 'completed',
        progressPercent: 100,
        addedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleResetProject = async () => {
    if (window.confirm('Deseja iniciar um novo livro? Os dados salvos localmente serão limpos.')) {
      await clearAllProjectsFromDB();
      setProject(null);
      setQueue([]);
      setCurrentStep(1);
      setMaxUnlockedStep(1);
      setIsProcessingQueue(false);
    }
  };

  const createProjectFromPages = (
    pages: PageItem[],
    fileInfo: { name: string; size: string; type: 'pdf' | 'images' }
  ): BookProject => {
    const newMetadata: BookMetadata = {
      id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: fileInfo.name.replace(/\.(pdf|png|jpg|jpeg)$/i, '').replace(/[-_]/g, ' '),
      author: '',
      language: 'pt-BR',
      description: 'Livro didático processado para TTS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOriginalPages: pages.length,
      fileType: fileInfo.type,
      fileName: fileInfo.name,
      fileSizeFormatted: fileInfo.size,
    };

    const initialChapters: Chapter[] = [
      {
        id: 'chap_1',
        title: newMetadata.title || 'Início da Leitura',
        order: 1,
        startPage: 1,
        endPage: pages.length,
        blocks: [],
      },
    ];

    return {
      metadata: newMetadata,
      pages,
      chapters: initialChapters,
      mode: 'economic',
      status: 'ready_to_process',
      currentStep: 2,
      currentProcessingIndex: 0,
      totalBlocks: Math.ceil(pages.length / 2),
      stats: {
        callsMade: 0,
        callsPending: Math.ceil(pages.length / 2),
        errorsCount: 0,
        wordsCount: 0,
      },
    };
  };

  const handlePagesReady = async (
    pages: PageItem[],
    fileInfo: { name: string; size: string; type: 'pdf' | 'images' }
  ) => {
    const newProject = createProjectFromPages(pages, fileInfo);
    await updateProject(newProject);
    setCurrentStep(2);
    setMaxUnlockedStep(Math.max(maxUnlockedStep, 2));

    setQueue((prev) => [
      ...prev.filter((q) => q.project.metadata.id !== newProject.metadata.id),
      {
        id: `queue_${newProject.metadata.id}`,
        project: newProject,
        status: 'queued',
        progressPercent: 0,
        addedAt: new Date().toISOString(),
      },
    ]);
  };

  // Batch Upload: user uploaded 2+ PDF files at once
  const handleBatchUpload = async (incomingFiles: FileList | File[]) => {
    requestNotificationPermission();
    const files = Array.from(incomingFiles);
    const newQueueItems: QueueBookItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const pages = await extractPagesFromPDF(file);
        const formatSize = (bytes: number) =>
          bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
        
        const newProj = createProjectFromPages(pages, {
          name: file.name,
          size: formatSize(file.size),
          type: 'pdf',
        });

        newQueueItems.push({
          id: `queue_${newProj.metadata.id}`,
          project: newProj,
          status: 'queued',
          progressPercent: 0,
          addedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not extract PDF in batch:', file.name, e);
      }
    }

    if (newQueueItems.length > 0) {
      setQueue((prev) => [...prev, ...newQueueItems]);

      // If no active project or not running, start with first one
      if (!project || project.status !== 'processing') {
        const first = newQueueItems[0].project;
        setProject(first);
        setCurrentStep(2);
        setMaxUnlockedStep(2);
      }
    }
  };

  const handleStartProcessing = (delay: number) => {
    if (!project) return;
    requestNotificationPermission();
    setDelayMs(delay);
    setIsProcessingQueue(true);

    const updated: BookProject = {
      ...project,
      status: 'processing',
      currentStep: 3,
    };
    updateProject(updated);
    setCurrentStep(3);
    setMaxUnlockedStep(Math.max(maxUnlockedStep, 3));

    // Mark current item as processing in queue
    setQueue((prev) =>
      prev.map((item) =>
        item.project.metadata.id === updated.metadata.id
          ? { ...item, status: 'processing', project: updated }
          : item
      )
    );
  };

  const handleBlockCompleted = (updated: BookProject) => {
    setProject(updated);

    // Calculate progress
    const totalBlocks = Math.max(updated.totalBlocks, 1);
    const finishedBlocks = updated.chapters.reduce((acc, c) => acc + (c.blocks?.length || 0), 0);
    const percent = Math.min(99, Math.round((finishedBlocks / totalBlocks) * 100));

    setQueue((prev) =>
      prev.map((item) =>
        item.project.metadata.id === updated.metadata.id
          ? { ...item, progressPercent: percent, project: updated }
          : item
      )
    );
  };

  // Continuous Queue Transition when a book completes
  const handleAllCompleted = async (finalProject: BookProject) => {
    // Generate EPUB Blob in background
    let epubBlob: Blob | undefined;
    try {
      epubBlob = await generateEpubBlob(finalProject);
    } catch (e) {
      console.warn('Could not auto-generate EPUB for queue item:', e);
    }

    // Mark current queue item as completed
    setQueue((prev) =>
      prev.map((item) =>
        item.project.metadata.id === finalProject.metadata.id
          ? {
              ...item,
              status: 'completed',
              progressPercent: 100,
              completedAt: new Date().toISOString(),
              epubBlob,
              project: finalProject,
            }
          : item
      )
    );

    // Send Background Notification and chime
    sendBackgroundNotification(
      '🎉 Livro Concluído com Sucesso!',
      `O EPUB de "${finalProject.metadata.title}" foi gerado e está pronto para audição no ElevenReader.`
    );

    // Check if there is another queued book to process next
    const nextQueuedIndex = queue.findIndex(
      (item) => item.status === 'queued' && item.project.metadata.id !== finalProject.metadata.id
    );

    if (nextQueuedIndex !== -1) {
      const nextItem = queue[nextQueuedIndex];
      setCurrentQueueIndex(nextQueuedIndex);

      // Automatically initialize and start next book in queue
      const nextProject: BookProject = {
        ...nextItem.project,
        status: 'processing',
        currentStep: 3,
      };

      setProject(nextProject);
      await saveProjectToDB(nextProject);

      setQueue((prev) =>
        prev.map((item, idx) =>
          idx === nextQueuedIndex
            ? { ...item, status: 'processing', project: nextProject }
            : item
        )
      );

      setCurrentStep(3);
    } else {
      // All items in queue completed
      setIsProcessingQueue(false);
      setProject(finalProject);
      setCurrentStep(4); // Review
      setMaxUnlockedStep(5);
    }
  };

  const handleProceedToExport = () => {
    if (!project) return;
    const updated: BookProject = {
      ...project,
      currentStep: 5,
    };
    updateProject(updated);
    setCurrentStep(5);
    setMaxUnlockedStep(5);
  };

  const handleDownloadQueueEpub = async (item: QueueBookItem) => {
    try {
      const blob = item.epubBlob || (await generateEpubBlob(item.project));
      downloadEpubBlob(blob, `${item.project.metadata.title || 'Livro'}.epub`);
    } catch (e: any) {
      alert('Erro ao baixar EPUB: ' + e.message);
    }
  };

  const handleSelectProjectToView = (item: QueueBookItem) => {
    setProject(item.project);
    setCurrentStep(item.project.currentStep || 4);
    setMaxUnlockedStep(Math.max(item.project.currentStep || 4, 5));
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <Header
        project={project}
        onResetProject={handleResetProject}
        onLoadSample={handleLoadSample}
      />

      {/* 5-Step Workflow Stepper */}
      <StepIndicator
        currentStep={currentStep}
        maxUnlockedStep={maxUnlockedStep}
        onSelectStep={(step) => setCurrentStep(step)}
      />

      {/* Main App Body */}
      <main className="flex-1 pb-20">
        {currentStep === 1 && (
          <Step1Upload
            onPagesReady={handlePagesReady}
            onBatchUpload={handleBatchUpload}
            onLoadSample={handleLoadSample}
            existingProject={project}
          />
        )}

        {currentStep === 2 && project && (
          <Step2Analyze
            metadata={project.metadata}
            pages={project.pages}
            chapters={project.chapters}
            mode={project.mode}
            onUpdateMetadata={(meta) => updateProject({ ...project, metadata: meta })}
            onUpdateChapters={(chaps) => updateProject({ ...project, chapters: chaps })}
            onUpdateMode={(m) => updateProject({ ...project, mode: m })}
            onStartProcessing={handleStartProcessing}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && project && (
          <Step3Process
            project={project}
            delayMs={delayMs}
            onBlockCompleted={handleBlockCompleted}
            onAllCompleted={handleAllCompleted}
            onCancel={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && project && (
          <Step4Review
            project={project}
            onProjectUpdated={updateProject}
            onProceedToExport={handleProceedToExport}
          />
        )}

        {currentStep === 5 && project && (
          <Step5Export
            project={project}
            onBackToReview={() => setCurrentStep(4)}
            onResetProject={handleResetProject}
          />
        )}
      </main>

      {/* Persistent Floating Queue Widget / Background Runner */}
      <QueueWidget
        queue={queue}
        currentIndex={currentQueueIndex}
        isProcessingQueue={isProcessingQueue}
        onAddFilesToQueue={handleBatchUpload}
        onRemoveFromQueue={handleRemoveFromQueue}
        onDownloadEpub={handleDownloadQueueEpub}
        onSelectProjectToView={handleSelectProjectToView}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            LivroTTS AI • Produção em segundo plano com suporte a lote contínuo e compatibilidade com ElevenReader.
          </p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Segundo Plano Ativo</span>
            <span>•</span>
            <span>EPUB 3.0 Validade IDPF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
