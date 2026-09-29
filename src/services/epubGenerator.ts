import JSZip from 'jszip';
import { BookProject } from '../types';

export async function generateEpubBlob(project: BookProject): Promise<Blob> {
  const zip = new JSZip();

  const title = project.metadata.title || 'Livro Sem Título';
  const author = project.metadata.author || 'Autor Desconhecido';
  const language = project.metadata.language || 'pt-BR';
  const description = project.metadata.description || 'Convertido e otimizado para TTS pelo LivroTTS AI.';
  const bookId = `urn:uuid:${project.metadata.id || 'livrotts-' + Date.now()}`;
  const nowIso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  // 1. mimetype MUST be the first file and uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/styles.css
  const stylesCss = `
@charset "UTF-8";

/* Estilos Otimizados para Leitura Visual e Leitores TTS (ElevenReader, ReadEra, Google Play Books) */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.65;
  color: #1a1a1a;
  background-color: #ffffff;
  padding: 1em 1.5em;
  margin: 0;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  font-family: inherit;
  font-weight: 700;
  color: #0f172a;
  margin-top: 1.5em;
  margin-bottom: 0.6em;
  line-height: 1.3;
}

h1 {
  font-size: 1.8em;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.3em;
}

h2 {
  font-size: 1.4em;
  color: #1e293b;
}

h3 {
  font-size: 1.15em;
  color: #334155;
}

p {
  margin-top: 0;
  margin-bottom: 1.1em;
  text-align: justify;
  hyphens: auto;
}

/* Fórmulas Matemáticas & Acessibilidade TTS */
.math-formula {
  background-color: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 0.8em 1em;
  margin: 1.2em 0;
  border-radius: 0 6px 6px 0;
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
  overflow-x: auto;
}

.math-visual {
  display: block;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 0.3em;
}

.tts-spoken-math {
  display: block;
  font-size: 0.9em;
  font-style: italic;
  color: #475569;
  border-top: 1px dashed #cbd5e1;
  padding-top: 0.4em;
  margin-top: 0.4em;
}

/* Tabelas Acessíveis */
.accessible-table-wrapper {
  margin: 1.4em 0;
  overflow-x: auto;
}

table.accessible-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.8em;
  font-size: 0.95em;
}

table.accessible-table th, table.accessible-table td {
  border: 1px solid #cbd5e1;
  padding: 0.6em 0.8em;
  text-align: left;
}

table.accessible-table th {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}

table.accessible-table caption {
  caption-side: top;
  font-weight: 700;
  text-align: left;
  margin-bottom: 0.5em;
  color: #1e293b;
}

.tts-table-reading {
  font-size: 0.9em;
  color: #64748b;
  background-color: #f8fafc;
  padding: 0.5em 0.8em;
  border-radius: 4px;
}

/* Blocos de Código */
pre.code-block {
  background-color: #0f172a;
  color: #f8fafc;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
  font-size: 0.88em;
  line-height: 1.5;
  margin: 1.2em 0;
}

pre.code-block code {
  font-family: inherit;
}

/* Caixas de Definição, Exemplos e Exercícios */
.callout-definition {
  background-color: #f0fdf4;
  border-left: 4px solid #22c55e;
  padding: 0.9em 1.2em;
  margin: 1.2em 0;
  border-radius: 0 6px 6px 0;
}

.example-box {
  background-color: #fefce8;
  border-left: 4px solid #eab308;
  padding: 0.9em 1.2em;
  margin: 1.2em 0;
  border-radius: 0 6px 6px 0;
}

.exercise-item {
  background-color: #fdf2f8;
  border-left: 4px solid #ec4899;
  padding: 0.9em 1.2em;
  margin: 1.2em 0;
  border-radius: 0 6px 6px 0;
}

.exercise-title, .example-title, .definition-title {
  font-weight: 700;
  margin-bottom: 0.4em;
  display: block;
}

/* Listas */
ul, ol {
  padding-left: 1.5em;
  margin-bottom: 1.2em;
}

li {
  margin-bottom: 0.4em;
}

/* Elementos de Imagem */
figure {
  margin: 1.5em 0;
  text-align: center;
}

figcaption {
  font-size: 0.9em;
  color: #64748b;
  margin-top: 0.5em;
}
`;
  zip.file('OEBPS/styles.css', stylesCss);

  // 4. Create Chapters XHTML
  const chapters = project.chapters && project.chapters.length > 0
    ? project.chapters
    : [
        {
          id: 'chap_1',
          title: project.metadata.title || 'Conteúdo Principal',
          order: 1,
          startPage: 1,
          endPage: project.pages.length || 1,
          blocks: [],
          htmlContent: `<p>${project.pages.map((p) => p.rawText || '').join('</p><p>') || 'Sem conteúdo processado.'}</p>`,
        },
      ];

  const manifestItems: { id: string; href: string; mediaType: string; properties?: string }[] = [
    { id: 'styles', href: 'styles.css', mediaType: 'text/css' },
    { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' },
    { id: 'ncx', href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml' },
  ];

  const spineItems: { idref: string }[] = [];

  // Write each chapter XHTML file
  chapters.forEach((chapter, index) => {
    const chapIndex = (index + 1).toString().padStart(2, '0');
    const chapFileName = `chapter_${chapIndex}.xhtml`;
    const chapId = `chap_${chapIndex}`;

    manifestItems.push({
      id: chapId,
      href: `chapters/${chapFileName}`,
      mediaType: 'application/xhtml+xml',
    });

    spineItems.push({ idref: chapId });

    // Assemble chapter content from its processed blocks or htmlContent
    let chapterBody = '';
    if (chapter.blocks && chapter.blocks.length > 0) {
      chapterBody = chapter.blocks.map((b) => b.htmlContent).join('\n');
    } else if (chapter.htmlContent) {
      chapterBody = chapter.htmlContent;
    } else if (chapter.cleanTextForTTS) {
      chapterBody = chapter.cleanTextForTTS
        .split('\n\n')
        .map((p) => `<p>${escapeXml(p.trim())}</p>`)
        .join('\n');
    } else {
      chapterBody = `<p>Conteúdo do capítulo.</p>`;
    }

    // Clean and sanitize to ensure 100% publication-grade XHTML
    const sanitizedBody = sanitizeEpubChapterHtml(chapterBody, chapter.title);

    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${language}" lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles.css" />
</head>
<body epub:type="bodymatter">
  <section epub:type="chapter" role="doc-chapter">
    <h1>${escapeXml(chapter.title)}</h1>
    ${sanitizedBody}
  </section>
</body>
</html>`;

    zip.file(`OEBPS/chapters/${chapFileName}`, chapterXhtml);
  });

  // 5. OEBPS/nav.xhtml (EPUB 3 Navigation Document)
  const navListHtml = chapters
    .map((chap, idx) => {
      const chapIndex = (idx + 1).toString().padStart(2, '0');
      return `      <li><a href="chapters/chapter_${chapIndex}.xhtml">${escapeXml(chap.title)}</a></li>`;
    })
    .join('\n');

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${language}" lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>Índice - ${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body epub:type="frontmatter">
  <nav epub:type="toc" id="toc" role="doc-toc">
    <h1>Sumário</h1>
    <ol>
${navListHtml}
    </ol>
  </nav>
  <nav epub:type="landmarks" class="hidden">
    <ol>
      <li><a epub:type="toc" href="#toc">Sumário</a></li>
      <li><a epub:type="bodymatter" href="chapters/chapter_01.xhtml">Início da Leitura</a></li>
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 6. OEBPS/toc.ncx (EPUB 2 NCX for older readers)
  const navPointsNcx = chapters
    .map((chap, idx) => {
      const order = idx + 1;
      const chapIndex = order.toString().padStart(2, '0');
      return `    <navPoint id="navPoint-${order}" playOrder="${order}">
      <navLabel>
        <text>${escapeXml(chap.title)}</text>
      </navLabel>
      <content src="chapters/chapter_${chapIndex}.xhtml"/>
    </navPoint>`;
    })
    .join('\n');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(author)}</text>
  </docAuthor>
  <navMap>
${navPointsNcx}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  // 7. OEBPS/content.opf (Package Document)
  const manifestXml = manifestItems
    .map(
      (item) =>
        `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"${
          item.properties ? ` properties="${item.properties}"` : ''
        }/>`
    )
    .join('\n');

  const spineXml = spineItems.map((item) => `    <itemref idref="${item.idref}"/>`).join('\n');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0" xml:lang="${language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:description>${escapeXml(description)}</dc:description>
    <dc:date>${nowIso.split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${nowIso}</meta>
    <meta name="generator" content="LivroTTS AI"/>
    <meta name="accessibilityFeature" content="structuralNavigation"/>
    <meta name="accessibilityFeature" content="readingOrder"/>
    <meta name="accessibilityFeature" content="alternativeText"/>
    <meta name="accessibilitySummary" content="Este EPUB foi estruturado semanticamente para leitura por voz (TTS), com ordem de leitura contínua, pronúncia fonética de expressões matemáticas e tabelas narradas."/>
  </metadata>
  <manifest>
${manifestXml}
  </manifest>
  <spine toc="ncx">
${spineXml}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // Generate EPUB Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return blob;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeEpubChapterHtml(rawHtml: string, chapterTitle: string): string {
  if (!rawHtml) return '<p></p>';

  let clean = rawHtml;

  // 1. Remove markdown code fences if present
  clean = clean.replace(/```(?:html|xml|json)?/gi, '').replace(/```/g, '');

  // 2. Remove AI preamble/meta phrases that do not belong to the book
  clean = clean.replace(/^(?:Aqui está o conteúdo|Aqui está o texto|Processamento da página|Nota do assistente|Nota do editor):.*?\n+/gim, '');
  clean = clean.replace(/\[(?:Aviso|Nota|ValidationWarning|Conteúdo das Páginas)[^\]]*\]/gi, '');

  // 3. Remove generic placeholder headings like "Capítulo 1: Conteúdo Principal" or "Conteúdo Principal"
  clean = clean.replace(/<h[1-6][^>]*>[\s\S]*?(?:Conteúdo Principal|Capítulo 1:\s*Conteúdo Principal)[\s\S]*?<\/h[1-6]>/gi, '');

  // 4. Remove duplicate headings matching chapterTitle (h1 to h3)
  if (chapterTitle && chapterTitle.trim()) {
    const escapedTitle = chapterTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const duplicateHeadingRegex = new RegExp(`<h[1-6][^>]*>\\s*${escapedTitle}\\s*<\\/h[1-6]>`, 'gi');
    clean = clean.replace(duplicateHeadingRegex, '');
  }

  // 5. Clean up any empty paragraphs or empty headings
  clean = clean.replace(/<p>\s*<\/p>/gi, '');
  clean = clean.replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/gi, '');

  // 6. Fix broken sentence continuation across paragraph tags
  // (e.g. "<p>...baseadas em</p><p>informações...</p>" -> merge into one continuous paragraph)
  clean = clean.replace(/([a-zà-ÿ0-9,;\s])<\/p>\s*<p>([a-zà-ÿ])/gi, '$1 $2');

  // 7. Wrap raw isolated text lines in proper <p> if needed
  if (!clean.includes('<p>') && !clean.includes('<div>') && !clean.includes('<h2>') && !clean.includes('<h3>')) {
    clean = clean
      .split(/\n\n+/)
      .filter((line) => line.trim().length > 0)
      .map((line) => `<p>${line.trim()}</p>`)
      .join('\n');
  }

  return clean.trim();
}

export function downloadEpubBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.epub') ? filename : `${filename}.epub`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

