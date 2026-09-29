import { BookProject } from '../types';

export function createSampleBookProject(): BookProject {
  const samplePages = [
    {
      id: 'sample_p1',
      pageNumber: 1,
      originalName: 'Capa & Sumário - Termodinâmica.jpg',
      mimeType: 'image/jpeg',
      rawText: `MANUAL DE FÍSICA APLICADA E TERMODINÂMICA
Volume 1 - Energia, Calor e Transformações Térmicas
Prof. Dr. Ricardo Mendonça & Profa. Dra. Elena Vasconcelos
Sumário:
Capítulo 1: Fundamentos de Termodinâmica e Primeira Lei (Páginas 2 a 3)
Capítulo 2: Segunda Lei, Ciclos e Entropia (Páginas 4 a 5)`,
    },
    {
      id: 'sample_p2',
      pageNumber: 2,
      originalName: 'Página 2 - Introdução e Primeira Lei',
      mimeType: 'image/jpeg',
      rawText: `[COLUNA 1]
1.1 Conceitos Fundamentais
A Termodinâmica é a ciência que investiga as relações entre calor, trabalho mecânico e outras formas de energia. Em sistemas físicos, a conservação de energia é um princípio basilar do universo.

A energia interna de uma substância compreende a energia cinética microscópica de suas moléculas associada à temperatura absoluta.

[COLUNA 2]
1.2 A Primeira Lei da Termodinâmica
A variação da energia interna de um sistema fechado é dada pela diferença entre o calor fornecido ao sistema e o trabalho realizado por ele sobre a vizinhança.

Expressão Matemática:
ΔU = Q - W

Onde:
ΔU representa a variação de energia interna (em Joules);
Q representa a quantidade de calor transferido (em Joules);
W representa o trabalho realizado pelo sistema (em Joules).`,
    },
    {
      id: 'sample_p3',
      pageNumber: 3,
      originalName: 'Página 3 - Transferência de Calor e Tabela',
      mimeType: 'image/jpeg',
      rawText: `1.3 Mecanismos de Transferência e Condutividade Térmica

A condução térmica através de uma parede plana de espessura L é regida pela Lei de Fourier:
q = -k * A * (dT/dx)

Abaixo, a Tabela 1.1 apresenta os coeficientes de condutividade térmica (k em W/(m·K)) para materiais comuns a 25 °C:

Tabela 1.1 - Condutividade Térmica dos Materiais
Material | Condutividade k [W/(m·K)] | Aplicação Típica
Cobre Puro | 385.0 | Condutores elétricos e trocadores de calor
Alumínio | 205.0 | Dissipadores e ligas estruturais
Vidro Comum | 0.8 | Janelas e isolamento moderado
Madeira (Pinho) | 0.13 | Construção civil e isolamento

Exemplo 1.1:
Calcule o fluxo de calor através de uma placa de cobre de área 0.5 m² e espessura de 2 cm quando a diferença de temperatura entre as faces for de 40 °C.`,
    },
    {
      id: 'sample_p4',
      pageNumber: 4,
      originalName: 'Página 4 - Segunda Lei e Ciclo de Carnot',
      mimeType: 'image/jpeg',
      rawText: `Capítulo 2: Segunda Lei, Ciclos e Entropia

2.1 O Ciclo de Carnot e Eficiência Máxima
Nenhuma máquina térmica operando entre duas temperaturas fixas pode ser mais eficiente do que uma máquina reversível de Carnot.

A eficiência de Carnot (η) é calculada por:
η = 1 - (Tc / Tq)

Onde:
Tc é a temperatura da fonte fria em Kelvin;
Tq é a temperatura da fonte quente em Kelvin.

Simulação Computacional em Python:
\`\`\`python
def rendimento_carnot(temp_fria_k, temp_quente_k):
    """Calcula a eficiência teórica máxima de Carnot."""
    if temp_quente_k <= 0 or temp_fria_k >= temp_quente_k:
        raise ValueError("Temperaturas físicas inválidas")
    rendimento = 1.0 - (temp_fria_k / temp_quente_k)
    return rendimento * 100.0

print(f"Rendimento: {rendimento_carnot(300, 600):.1f}%")
\`\`\``,
    },
    {
      id: 'sample_p5',
      pageNumber: 5,
      originalName: 'Página 5 - Exercícios e Questões',
      mimeType: 'image/jpeg',
      rawText: `Exercícios de Fixação - Capítulo 1 e 2

Questão 1:
Um gás ideal contido em um cilindro com êmbolo móvel recebe 1500 J de calor de uma chama externa e realiza simultaneamente um trabalho de expansão de 900 J sobre o ambiente.
Determine a variação da energia interna do gás.
a) +2400 J
b) +600 J
c) -600 J
d) +900 J

Resposta comentada:
Pela Primeira Lei: ΔU = Q - W = 1500 - 900 = +600 J. Alternativa correta: B.

Questão 2:
Uma usina termoelétrica opera com vapor superaquecido a 800 K (fonte quente) e rejeita calor para um rio a 300 K (fonte fria). Qual é o rendimento teórico máximo de Carnot para esta usina?
Solução: η = 1 - (300/800) = 1 - 0.375 = 0.625 ou 62.5%.`,
    },
  ];

  const processedBlock1 = {
    id: 'block_sample_1',
    chapterId: 'chap_1',
    blockIndex: 1,
    pageNumbers: [1, 2],
    cleanTextForTTS: `Manual de Física Aplicada e Termodinâmica. Volume 1: Energia, Calor e Transformações Térmicas. Autores: Professor Doutor Ricardo Mendonça e Professora Doutora Elena Vasconcelos.

Capítulo 1: Fundamentos de Termodinâmica e Primeira Lei.

Seção 1.1: Conceitos Fundamentais.
A Termodinâmica é a ciência que investiga as relações entre calor, trabalho mecânico e outras formas de energia. Em sistemas físicos, a conservação de energia é um princípio basilar do universo. A energia interna de uma substância compreende a energia cinética microscópica de suas moléculas associada à temperatura absoluta.

Seção 1.2: A Primeira Lei da Termodinâmica.
A variação da energia interna de um sistema fechado é dada pela diferença entre o calor fornecido ao sistema e o trabalho realizado por ele sobre a vizinhança.

Fórmula da Primeira Lei: Delta U é igual a Q menos W.
Onde: Delta U representa a variação de energia interna em Joules. Q representa a quantidade de calor transferido em Joules. W representa o trabalho realizado pelo sistema em Joules.`,
    htmlContent: `<h2>Capítulo 1: Fundamentos de Termodinâmica e Primeira Lei</h2>
<h3>1.1 Conceitos Fundamentais</h3>
<p>A Termodinâmica é a ciência que investiga as relações entre calor, trabalho mecânico e outras formas de energia. Em sistemas físicos, a conservação de energia é um princípio basilar do universo.</p>
<p>A energia interna de uma substância compreende a energia cinética microscópica de suas moléculas associada à temperatura absoluta.</p>

<h3>1.2 A Primeira Lei da Termodinâmica</h3>
<p>A variação da energia interna de um sistema fechado é dada pela diferença entre o calor fornecido ao sistema e o trabalho realizado por ele sobre a vizinhança.</p>

<div class="math-formula" role="region" aria-label="Fórmula matemática da Primeira Lei">
  <span class="math-visual">ΔU = Q - W</span>
  <span class="tts-spoken-math">Pronúncia para voz: Delta U é igual a Q menos W.</span>
</div>

<p><strong>Onde:</strong></p>
<ul>
  <li><strong>ΔU:</strong> Variação de energia interna em Joules (J);</li>
  <li><strong>Q:</strong> Quantidade de calor transferido em Joules (J);</li>
  <li><strong>W:</strong> Trabalho realizado pelo sistema em Joules (J).</li>
</ul>`,
    elements: [
      { type: 'heading' as const, content: 'Capítulo 1: Fundamentos de Termodinâmica e Primeira Lei', level: 2 as const },
      { type: 'paragraph' as const, content: 'A Termodinâmica investiga as relações entre calor, trabalho mecânico e outras formas de energia.' },
      { type: 'math' as const, content: 'ΔU = Q - W', speechPronunciation: 'Delta U é igual a Q menos W.' },
    ],
    validationWarnings: [],
    wordCount: 180,
    processedAt: new Date().toISOString(),
  };

  const processedBlock2 = {
    id: 'block_sample_2',
    chapterId: 'chap_1',
    blockIndex: 2,
    pageNumbers: [3],
    cleanTextForTTS: `Seção 1.3: Mecanismos de Transferência e Condutividade Térmica.
A condução térmica através de uma parede plana de espessura L é regida pela Lei de Fourier: q é igual a menos k vezes A vezes derivada da temperatura em relação à posição x.

Tabela 1.1: Condutividade Térmica dos Materiais a 25 graus Celsius.
Material Cobre Puro: condutividade k de 385.0 Watts por metro Kelvin, aplicação em condutores elétricos e trocadores de calor.
Material Alumínio: condutividade k de 205.0 Watts por metro Kelvin, aplicação em dissipadores e ligas estruturais.
Material Vidro Comum: condutividade k de 0.8 Watts por metro Kelvin, aplicação em janelas e isolamento moderado.
Material Madeira de Pinho: condutividade k de 0.13 Watts por metro Kelvin, aplicação em construção civil e isolamento.

Exemplo 1.1: Calcule o fluxo de calor através de uma placa de cobre de área 0.5 metros quadrados e espessura de 2 centímetros quando a diferença de temperatura entre as faces for de 40 graus Celsius.`,
    htmlContent: `<h3>1.3 Mecanismos de Transferência e Condutividade Térmica</h3>
<p>A condução térmica através de uma parede plana de espessura <em>L</em> é regida pela Lei de Fourier:</p>

<div class="math-formula">
  <span class="math-visual">q = -k · A · (dT/dx)</span>
  <span class="tts-spoken-math">Pronúncia para voz: q é igual a menos k vezes A vezes a taxa de variação de temperatura dT sobre dx.</span>
</div>

<div class="accessible-table-wrapper">
  <table class="accessible-table">
    <caption>Tabela 1.1 - Condutividade Térmica dos Materiais (a 25 °C)</caption>
    <thead>
      <tr>
        <th scope="col">Material</th>
        <th scope="col">Condutividade k [W/(m·K)]</th>
        <th scope="col">Aplicação Típica</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cobre Puro</td>
        <td>385.0</td>
        <td>Condutores elétricos e trocadores de calor</td>
      </tr>
      <tr>
        <td>Alumínio</td>
        <td>205.0</td>
        <td>Dissipadores e ligas estruturais</td>
      </tr>
      <tr>
        <td>Vidro Comum</td>
        <td>0.8</td>
        <td>Janelas e isolamento moderado</td>
      </tr>
      <tr>
        <td>Madeira (Pinho)</td>
        <td>0.13</td>
        <td>Construção civil e isolamento</td>
      </tr>
    </tbody>
  </table>
  <div class="tts-table-reading">
    <strong>Resumo para leitura por voz:</strong> O cobre puro lidera a condução com 385 Watts por metro Kelvin, seguido pelo alumínio com 205. Vidro comum e madeira de pinho atuam como isolantes com condutividades de 0.8 e 0.13 respectivamente.
  </div>
</div>

<div class="example-box">
  <span class="example-title">Exemplo Prático 1.1</span>
  <p>Calcule o fluxo de calor através de uma placa de cobre de área 0,5 m² e espessura de 2 cm quando a diferença de temperatura entre as faces for de 40 °C.</p>
</div>`,
    elements: [
      { type: 'heading' as const, content: '1.3 Mecanismos de Transferência e Condutividade Térmica', level: 3 as const },
      { type: 'table' as const, content: 'Tabela 1.1 de condutividade térmica', speechPronunciation: 'Tabela de condutividade térmica com 4 materiais.' },
      { type: 'example' as const, content: 'Exemplo 1.1 cálculo de placa de cobre' },
    ],
    validationWarnings: [],
    wordCount: 165,
    processedAt: new Date().toISOString(),
  };

  const processedBlock3 = {
    id: 'block_sample_3',
    chapterId: 'chap_2',
    blockIndex: 3,
    pageNumbers: [4, 5],
    cleanTextForTTS: `Capítulo 2: Segunda Lei, Ciclos e Entropia.

Seção 2.1: O Ciclo de Carnot e Eficiência Máxima.
Nenhuma máquina térmica operando entre duas temperaturas fixas pode ser mais eficiente do que uma máquina reversível de Carnot.
A eficiência de Carnot eta é calculada por: eta é igual a um menos a razão da temperatura da fonte fria Tc sobre a temperatura da fonte quente Tq em Kelvin.

Simulação Computacional em Python: Bloco de código demonstrando o cálculo da função rendimento de Carnot com validação de temperaturas.

Exercícios de Fixação.
Questão 1: Um gás ideal em cilindro recebe 1500 Joules de calor e realiza 900 Joules de trabalho. Variação da energia interna: Delta U é igual a 1500 menos 900, resultando em 600 Joules positivos. Alternativa correta: B.
Questão 2: Usina termoelétrica operando com vapor a 800 Kelvin e rejeição a 300 Kelvin. Rendimento máximo de Carnot: 1 menos 300 sobre 800, igual a 62.5%.`,
    htmlContent: `<h2>Capítulo 2: Segunda Lei, Ciclos e Entropia</h2>
<h3>2.1 O Ciclo de Carnot e Eficiência Máxima</h3>
<p>Nenhuma máquina térmica operando entre duas temperaturas fixas pode ser mais eficiente do que uma máquina reversível de Carnot.</p>

<div class="math-formula">
  <span class="math-visual">η = 1 - (T_c / T_q)</span>
  <span class="tts-spoken-math">Pronúncia para voz: A eficiência eta é igual a um menos abre parênteses temperatura da fonte fria dividida pela temperatura da fonte quente fecha parênteses em Kelvin.</span>
</div>

<p>Código de simulação em Python:</p>
<pre class="code-block"><code class="language-python">def rendimento_carnot(temp_fria_k, temp_quente_k):
    """Calcula a eficiência teórica máxima de Carnot."""
    if temp_quente_k &lt;= 0 or temp_fria_k &gt;= temp_quente_k:
        raise ValueError("Temperaturas físicas inválidas")
    rendimento = 1.0 - (temp_fria_k / temp_quente_k)
    return rendimento * 100.0

print(f"Rendimento: {rendimento_carnot(300, 600):.1f}%")</code></pre>

<div class="exercise-item">
  <span class="exercise-title">Exercício 1: Primeira Lei em Gás Ideal</span>
  <p>Um gás ideal contido em um cilindro com êmbolo móvel recebe 1500 J de calor de uma chama externa e realiza simultaneamente um trabalho de expansão de 900 J sobre o ambiente. Determine a variação da energia interna do gás.</p>
  <p><strong>Resposta comentada:</strong> Pela Primeira Lei, ΔU = Q - W = 1500 J - 900 J = +600 J. Alternativa correta: B.</p>
</div>

<div class="exercise-item">
  <span class="exercise-title">Exercício 2: Rendimento Térmico de Usina</span>
  <p>Uma usina termoelétrica opera com vapor superaquecido a 800 K (fonte quente) e rejeita calor para um rio a 300 K (fonte fria). Qual é o rendimento teórico máximo de Carnot para esta usina?</p>
  <p><strong>Solução:</strong> η = 1 - (300/800) = 1 - 0,375 = 0,625 ou 62,5%.</p>
</div>`,
    elements: [
      { type: 'heading' as const, content: 'Capítulo 2: Segunda Lei, Ciclos e Entropia', level: 2 as const },
      { type: 'code' as const, content: 'Simulação Python de rendimento de Carnot' },
      { type: 'exercise' as const, content: 'Exercícios 1 e 2 de Termodinâmica' },
    ],
    validationWarnings: [],
    wordCount: 210,
    processedAt: new Date().toISOString(),
  };

  const project: BookProject = {
    metadata: {
      id: 'sample_termodinamica_01',
      title: 'Manual de Física Aplicada e Termodinâmica',
      author: 'Prof. Dr. Ricardo Mendonça & Profa. Dra. Elena Vasconcelos',
      language: 'pt-BR',
      description: 'Livro didático com duas colunas, fórmulas físicas pronunciáveis, tabelas estruturadas e exercícios preparados para TTS.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOriginalPages: 5,
      fileType: 'pdf',
      fileName: 'Fisica_Aplicada_Termodinamica_Amostra.pdf',
      fileSizeFormatted: '1.8 MB',
    },
    pages: samplePages,
    chapters: [
      {
        id: 'chap_1',
        title: 'Capítulo 1: Fundamentos de Termodinâmica e Primeira Lei',
        order: 1,
        startPage: 1,
        endPage: 3,
        blocks: [processedBlock1, processedBlock2],
        cleanTextForTTS: `${processedBlock1.cleanTextForTTS}\n\n${processedBlock2.cleanTextForTTS}`,
        htmlContent: `${processedBlock1.htmlContent}\n${processedBlock2.htmlContent}`,
      },
      {
        id: 'chap_2',
        title: 'Capítulo 2: Segunda Lei, Ciclos e Entropia',
        order: 2,
        startPage: 4,
        endPage: 5,
        blocks: [processedBlock3],
        cleanTextForTTS: processedBlock3.cleanTextForTTS,
        htmlContent: processedBlock3.htmlContent,
      },
    ],
    mode: 'economic',
    status: 'completed',
    currentStep: 4, // Review step
    currentProcessingIndex: 3,
    totalBlocks: 3,
    stats: {
      callsMade: 3,
      callsPending: 0,
      errorsCount: 0,
      wordsCount: 555,
    },
  };

  return project;
}
