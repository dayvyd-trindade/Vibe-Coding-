export type ProcessingMode = 'economic' | 'balanced' | 'quality';

export interface PageItem {
  id: string;
  pageNumber: number;
  originalName?: string;
  imageBase64?: string; // High-res preview/OCR image
  thumbnailBase64?: string;
  mimeType?: string;
  rawText?: string;
  width?: number;
  height?: number;
}

export interface BookMetadata {
  id: string;
  title: string;
  author: string;
  language: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  totalOriginalPages: number;
  fileType: 'pdf' | 'images';
  fileName: string;
  fileSizeFormatted: string;
}

export interface ElementBlock {
  type: 'paragraph' | 'heading' | 'math' | 'table' | 'code' | 'exercise' | 'example' | 'definition' | 'image_desc';
  content: string;
  speechPronunciation?: string;
  level?: 1 | 2 | 3;
  altText?: string;
  caption?: string;
}

export interface ProcessedBlock {
  id: string;
  chapterId: string;
  blockIndex: number;
  pageNumbers: number[];
  cleanTextForTTS: string;
  htmlContent: string;
  elements: ElementBlock[];
  validationWarnings: string[];
  wordCount: number;
  processedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  startPage: number;
  endPage: number;
  blocks: ProcessedBlock[];
  cleanTextForTTS?: string;
  htmlContent?: string;
}

export interface BookProject {
  metadata: BookMetadata;
  pages: PageItem[];
  chapters: Chapter[];
  mode: ProcessingMode;
  status: 'draft' | 'analyzing' | 'ready_to_process' | 'processing' | 'paused' | 'completed' | 'error';
  currentStep: number;
  currentProcessingIndex: number;
  totalBlocks: number;
  stats: {
    callsMade: number;
    callsPending: number;
    errorsCount: number;
    wordsCount: number;
  };
}

export interface ValidationIssue {
  type: 'warning' | 'error' | 'info';
  message: string;
  pageNumber?: number;
  chapterId?: string;
}

export interface QueueBookItem {
  id: string;
  project: BookProject;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progressPercent: number;
  epubBlob?: Blob;
  addedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

