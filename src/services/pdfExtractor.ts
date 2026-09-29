import * as pdfjsLib from 'pdfjs-dist';
import { PageItem } from '../types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export async function extractPagesFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PageItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: PageItem[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Calculate balanced viewport for fast network transfer and crisp Gemini OCR
    const baseViewport = page.getViewport({ scale: 1.0 });
    const maxDimension = 1200;
    const currentMax = Math.max(baseViewport.width, baseViewport.height);
    const targetScale = currentMax > 0 ? Math.min(1.3, maxDimension / currentMax) : 1.0;
    const viewport = page.getViewport({ scale: Math.max(0.8, targetScale) });

    // Render page to canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };
      await (page.render(renderContext as any) as any).promise;
    }

    // High quality balanced JPEG for Gemini multimodal OCR (~100KB-200KB per page)
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
    
    // Create smaller thumbnail for fast UI gallery
    const thumbCanvas = document.createElement('canvas');
    const thumbContext = thumbCanvas.getContext('2d');
    const thumbScale = 0.25;
    thumbCanvas.width = Math.round(viewport.width * thumbScale);
    thumbCanvas.height = Math.round(viewport.height * thumbScale);
    if (thumbContext) {
      thumbContext.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }
    const thumbnailBase64 = thumbCanvas.toDataURL('image/jpeg', 0.6);

    // Also extract raw selectable text if available in PDF
    let rawText = '';
    try {
      const textContent = await page.getTextContent();
      // Join text items with space or line break depending on coordinates
      let lastY: number | null = null;
      const lines: string[] = [];
      let currentLine = '';

      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += (currentLine ? ' ' : '') + item.str;
        }
        lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      rawText = lines.join('\n');
    } catch (e) {
      console.warn(`Could not extract raw text from page ${pageNum}:`, e);
    }

    pages.push({
      id: `page_${pageNum}_${Date.now()}`,
      pageNumber: pageNum,
      originalName: `Página ${pageNum}`,
      imageBase64,
      thumbnailBase64,
      mimeType: 'image/jpeg',
      rawText: rawText.trim(),
      width: viewport.width,
      height: viewport.height,
    });

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  return pages;
}

export async function processImageFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<PageItem[]> {
  const pages: PageItem[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageBase64 = await readFileAsBase64(file);
    const thumbnailBase64 = await createThumbnailFromBase64(imageBase64, file.type);

    pages.push({
      id: `img_page_${i + 1}_${Date.now()}`,
      pageNumber: i + 1,
      originalName: file.name,
      imageBase64: imageBase64.split(',')[1],
      thumbnailBase64,
      mimeType: file.type || 'image/jpeg',
      rawText: '', // Will be extracted by Gemini OCR
    });

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return pages;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createThumbnailFromBase64(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 240;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType || 'image/jpeg', 0.7));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
