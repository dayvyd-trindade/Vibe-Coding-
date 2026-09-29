import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set high limit for base64 image/PDF pages
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers for robust API communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize GoogleGenAI server-side with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Model definitions - using valid approved models
const MODELS = {
  economic: 'gemini-3.1-flash-lite',
  balanced: 'gemini-3.8-flash',
  quality: 'gemini-3.8-flash',
  tts: 'gemini-3.8-flash-lite-tts',
};

// Check health & API Key presence
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    models: MODELS,
  });
});

// Helper for error formatting and rate limit detection
function handleGeminiError(error: any, res: express.Response) {
  console.error('Gemini API Error:', error);
  const errMsg = error?.message || String(error);
  const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('resource_exhausted');
  
  if (isRateLimit) {
    return res.status(429).json({
      error: 'Limite temporário da API atingido. O processamento está pausado e continuará automaticamente.',
      isRateLimit: true,
      retryAfterSeconds: 15,
      details: errMsg,
    });
  }
  
  return res.status(500).json({
    error: errMsg || 'Erro ao processar com a API Gemini',
    isRateLimit: false,
  });
}

// 1. Analyze Document Structure & Table of Contents (TOC)
app.post('/api/gemini/analyze-structure', async (req, res) => {
  try {
    const { samplePagesText, imagesBase64, mode = 'economic', docTitle = '' } = req.body;
    const modelName = mode === 'economic' ? MODELS.economic : MODELS.balanced;

    const systemInstruction = `Você é um especialista em editoração de livros didáticos, apostilas e materiais acadêmicos para acessibilidade e leitores de voz (TTS).
Sua tarefa é analisar uma amostra das páginas iniciais ou sumário do material e identificar:
1. Título do livro/material (fiel ao documento original, sem inventar)
2. Autor(es) (se visíveis)
3. Idioma principal (geralmente pt-BR)
4. Estrutura estimada de capítulos e seções
5. Se o material possui duas colunas, tabelas, fórmulas matemáticas ou blocos de código.

REGRA FUNDAMENTAL: Fidelidade total. Não invente dados que não existam no material. Se o autor não estiver especificado, retorne vazio ou "Não informado".

Retorne SEMPRE em formato JSON com o seguinte esquema:
{
  "title": "string",
  "author": "string",
  "language": "pt-BR",
  "description": "string",
  "estimatedChapters": [
    {
      "id": "chap_1",
      "title": "string",
      "startPage": 1,
      "estimatedEndPage": 10
    }
  ],
  "layoutInfo": {
    "isMultiColumn": boolean,
    "hasMath": boolean,
    "hasTables": boolean,
    "hasCode": boolean
  }
}`;

    const parts: any[] = [];
    
    // If images are provided (e.g. cover/TOC pages)
    if (imagesBase64 && Array.isArray(imagesBase64)) {
      for (const img of imagesBase64.slice(0, 3)) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: img.data,
          },
        });
      }
    }

    const textPrompt = `Analise as páginas fornecidas do livro "${docTitle || 'Sem título'}":
${samplePagesText ? `\nTexto extraído das páginas iniciais/sumário:\n${samplePagesText.slice(0, 6000)}` : ''}

Identifique o título, autor, sumário/capítulos e características estruturais do material.`;

    parts.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = { rawText: responseText };
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// 2. Process Page Block for TTS & EPUB Structure
app.post('/api/gemini/process-block', async (req, res) => {
  try {
    const {
      pages, // Array of { pageNumber: number, text?: string, imageBase64?: string, mimeType?: string }
      mode = 'economic',
      chapterContext = '',
      previousBlockContext = '',
    } = req.body;

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'Nenhuma página fornecida para o bloco.' });
    }

    const modelName = mode === 'economic' ? MODELS.economic : MODELS.balanced;

    const systemInstruction = `Você é o motor de editoração profissional do LivroTTS AI.
Sua missão é entregar o conteúdo dos livros didáticos, apostilas e materiais acadêmicos em sua forma PLENA, COMPLETA E IMPECÁVEL, pronta para publicação oficial e audição contínua no ElevenReader, ReadEra e Google Play Livros.

REGRAS CRÍTICAS E INEGOCIÁVEIS DE ENTREGA:

1. PROIBIÇÃO ABSOLUTA DE RETICÊNCIAS (...) OU CORTES:
   - É ESTRITAMENTE PROIBIDO usar "..." (reticências) para abreviar, resumir, cortar ou indicar continuação de texto.
   - NUNCA termine uma frase com "..." a menos que o próprio autor do livro tenha escrito reticências literais no original.
   - Escreva TODAS as palavras de cada frase integralmente até o fim da página.

2. CONTINUIDADE FLUIDA E SOLDAGEM ENTRE BLOCOS (SEM CORTES):
   - Se o bloco anterior terminou no meio de uma frase, comece este bloco completando a frase imediatamente, com a exata palavra seguinte do texto original.
   - NUNCA repita a última frase do bloco anterior e NUNCA coloque reticências no início ou no fim.

3. PROIBIÇÃO DE TÍTULOS/CABEÇALHOS NO MEIO DE FRASES OU ITENS DE LISTA:
   - NUNCA insira um título de seção (ex: "2.2 Benefícios e problemas"), subtítulo ou cabeçalho no meio de uma frase ou no meio de um bullet point.
   - Se uma frase ou item de lista foi interrompido no final de uma página (ex: "...foi definido e") e no topo da página seguinte há um título ou cabeçalho, você DEVE PRIMEIRO CONCLUIR A FRASE ("passou a ser utilizado na análise...") e só depois posicionar o título de seção antes do novo parágrafo.
   - Cabeçalhos de topo de página repetidos devem ser completamente descartados.

4. ZERO META-TEXTO E ZERO COMENTÁRIOS DA IA:
   - O texto entregue deve conter EXCLUSIVAMENTE o conteúdo genuíno da obra do autor.
   - NUNCA inclua introduções suas ("Aqui está...", "Nota:", "Processando...").
   - NUNCA inclua números de página soltos, cabeçalhos de topo repetidos ou rodapés de editora.

5. INTEGRIDADE PLENA E ABSOLUTA (SEM RESUMOS OU OMISSÕES):
   - É terminantemente PROIBIDO resumir ou pular qualquer parágrafo, explicação teórica, exemplo ou exercício.
   - Entregue TODO o texto do início ao fim das páginas com 100% de completude.

6. RECONSTRUÇÃO DA ORDEM HUMANA DE LEITURA (COLUNAS E QUADROS):
   - Em materiais de 2 ou mais colunas, reconstrua o fluxo natural de leitura: leia toda a Coluna da Esquerda (do topo à base) e em seguida a Coluna da Direita (do topo à base).
   - NUNCA misture linhas horizontais de colunas distintas.

7. PREPARAÇÃO AUDITIVA PARA ELEVENREADER (UNIDADES, ABREVIAÇÕES E SÍMBOLOS):
   - No fluxo de voz ("cleanTextForTTS"), expanda abreviações para fala fluida em português:
     * "km/h" -> "quilômetros por hora"
     * "m/s²" -> "metros por segundo ao quadrado"
     * "cm³" / "m³" -> "centímetros cúbicos" / "metros cúbicos"
     * "°C" -> "graus Celsius"
     * "R$" -> "reais"
     * "%" -> "por cento"
     * "pág." / "págs." -> "página" / "páginas"
     * "ex." -> "exemplo"
     * "fig." -> "figura"
     * "tab." -> "tabela"
     * "art." -> "artigo"
     * "cap." -> "capítulo"

7. FÓRMULAS MATEMÁTICAS E TABELAS:
   - Fórmulas: preserve a notação visual em LaTeX e forneça pronúncia fonética falada.
   - Tabelas: gere <table> acessível e forneça leitura linear narrada logo após a tabela.

8. EXERCÍCIOS E CÓDIGOS DE PROGRAMAÇÃO:
   - Preserve integralmente enunciados, alternativas (a, b, c, d), gabaritos comentados e blocos de código com indentação correta.

Retorne SEMPRE em JSON rigoroso com a seguinte estrutura:
{
  "chapterTitle": "Título do capítulo ou seção atual",
  "sectionTitle": "Subtítulo ou seção (se houver)",
  "cleanTextForTTS": "Texto contínuo integral 100% completo, sem cortes, sem '...' artificiais, pronto para fala natural contínua.",
  "htmlContent": "HTML semântico e visualmente elegante para EPUB 3 pronto para publicação (com <h2>, <h3>, <p>, <div class='math-formula'>, <table class='accessible-table'>, <pre class='code-block'>, etc.)",
  "validationWarnings": [],
  "wordCount": 120
}`;

    const parts: any[] = [];

    // Add page images for multimodal OCR & layout analysis if provided
    for (const p of pages) {
      if (p.imageBase64) {
        parts.push({
          inlineData: {
            mimeType: p.mimeType || 'image/jpeg',
            data: p.imageBase64,
          },
        });
      }
    }

    // Prepare textual context
    let promptText = `PROCESSE O BLOCO DE PÁGINAS (${pages.map((p) => p.pageNumber).join(', ')}):\n`;
    if (chapterContext && !chapterContext.includes('Conteúdo Principal')) {
      promptText += `Contexto do Capítulo: ${chapterContext}\n`;
    }
    if (previousBlockContext) {
      promptText += `Final do bloco anterior (para dar continuidade direta sem repetir nem cortar): "${previousBlockContext.slice(-120).trim()}"\n`;
    }

    promptText += `\nDados brutos das páginas:\n`;
    for (const p of pages) {
      promptText += `\n--- PÁGINA ${p.pageNumber} ---\n`;
      if (p.text) {
        promptText += `Texto bruto extraído:\n${p.text}\n`;
      } else {
        promptText += `(Página em imagem/escaneada - realize OCR visual multimodal completo e integral)\n`;
      }
    }

    promptText += `\nTranscreva e formate TODO o texto na íntegra, sem abreviar ou colocar reticências (...). Gere o JSON estruturado.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        cleanTextForTTS: responseText,
        htmlContent: `<p>${responseText.replace(/\n\n/g, '</p><p>')}</p>`,
        elements: [{ type: 'paragraph', content: responseText }],
      };
    }

    res.json({
      success: true,
      data: parsedData,
      pagesProcessed: pages.map((p) => p.pageNumber),
    });
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// 3. Optional TTS Voice Preview using Gemini TTS
app.post('/api/gemini/tts-preview', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto não fornecido para síntese de voz.' });
    }

    // Limit preview text to 400 chars to remain highly economic
    const sampleText = text.slice(0, 400);

    const response = await ai.models.generateContent({
      model: MODELS.tts,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: sampleText,
              speechMetadata: {
                style: 'Claro, fluido e natural para leitura de audiolivro educativo em português',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Áudio não retornado pelo modelo de TTS.' });
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    // If TTS model has limitation or quota, fallback gracefully
    console.warn('TTS API preview fallback:', error.message);
    res.status(200).json({
      success: false,
      useBrowserTTS: true,
      message: 'Utilizando síntese de voz do navegador para o teste de audição.',
    });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LivroTTS AI server running on http://localhost:${PORT}`);
  });
}

startServer();
