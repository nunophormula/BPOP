# Plataforma de Registo PD-L1 & HER-2

Aplicação para hospitais registarem os resultados de biomarcadores (HER2, PD-L1, e outros — Ki67, MLH1, MSH2, MSH6, PMS2, p53, RE, RP, Claudina 18.2, EBER, FOLR1) a partir dos relatórios de anatomia patológica, com dashboards estatísticos para acompanhamento nacional/por instituição.

O ponto central da aplicação é: em vez de um utilizador transcrever manualmente cada resultado de um exame para um formulário, ele carrega o **PDF ou Excel** exportado do sistema do hospital e a aplicação **lê o texto, deteta automaticamente que biomarcador(es) e que resultado estão a ser reportados, e pré-preenche tudo** — o utilizador só revê e confirma.

Este documento explica o que a plataforma faz e, com mais detalhe, como funciona a leitura automática de PDF/Excel.

---

## 1. Arquitetura

```
bpop/
├── webapp/     React 19 + Vite + Ant Design (SPA)
├── server/     Node.js + Express + MySQL/MariaDB
└── server/sql/schema.sql   dump completo da estrutura da BD
```

- **Frontend**: React (Vite), Ant Design para UI, axios para chamadas à API, `pdfjs-dist` para ler PDFs **no browser** (não há upload do PDF para o servidor — o texto é extraído localmente), `xlsx` para ler/gerar Excel.
- **Backend**: Express, MySQL (`mysql` package com queries promisificadas, sem ORM), JWT para autenticação, `multer` para upload de ficheiros, `nodemailer` para emails.
- **Base de dados**: MariaDB. Tabelas principais: `hospitals`, `login` (utilizadores), `platforms`, `antibodies`, `biomarkers`, `biomarker_results`, `hospital_technical` (templates técnicos por hospital), `submissions`, `submission_items`, `logs`.

---

## 2. Perfis de utilizador

| Role | O que vê/faz |
|---|---|
| **admin** | Acesso global: todas as instituições, gestão de administradores, gestão de dados (plataformas/anticorpos/biomarcadores), logs de auditoria, dashboard nacional. |
| **adminHospital** | Gere um hospital específico: utilizadores desse hospital, templates técnicos, faz submissões. |
| **repHospitalar** | Representante do hospital — normalmente quem efetivamente carrega os PDFs/Excel e faz as submissões do dia a dia. |

Cada hospital tem uma página de **Utilizadores** (antiga "Representantes") onde admin/adminHospital criam contas e escolhem a role (**Admin** = adminHospital, **Representante** = repHospitalar) através de um select no formulário.

---

## 3. Principais áreas da aplicação

- **Instituições** (admin): CRUD de hospitais.
- **Utilizadores**: CRUD de contas por hospital, com geração de password e envio por email.
- **Templates técnicos** (`hospital_technical`): por hospital, define-se para cada combinação **Biomarcador + Modelo Tumoral** qual a **Plataforma** e **Anticorpo/Clone** usados. É este template que a aplicação usa depois para preencher automaticamente Plataforma/Anticorpo numa submissão.
- **Gestão de dados** (admin): três separadores —
  - **Plataforma** / **Anticorpo**: catálogo global. adminHospital/repHospitalar podem *sugerir* novas entradas, que ficam "pendentes" até um admin aprovar ou rejeitar (há notificação por email nos dois sentidos). Uma plataforma/anticorpo pendente não pode ser usado numa submissão real.
  - **Biomarcador**: define-se cada biomarcador com as suas **keywords** (para deteção em texto livre) e os seus **resultados possíveis** (cada um com o seu próprio valor + keywords) — ver secção 4, é a peça central de todo o motor de leitura.
  - **Pendentes**: fila de aprovação das sugestões de plataforma/anticorpo.
- **Submissões** (`/app/hospital/:id/submission/create` ou `/app/meu-hospital/submission/create`): o wizard de carregamento de PDF/Excel — ver secção 4.
- **Últimas submissões** (admin): listagem global de tudo o que foi submetido, com filtro "apenas as minhas" e edição inline das próprias submissões (produto, resultado, modelo tumoral, plataforma, anticorpo).
- **Registo público** (`/registos`, sem login): estatísticas agregadas e tabela de exames para consulta pública, com exportação para Excel.
- **Logs**: auditoria de ações sensíveis (login, criação/aprovação/rejeição de sugestões, edição de submissões, etc.).

**Privacidade**: nome do doente e número de diagnóstico nunca são guardados em claro — são "hashados" no servidor (mesma lógica das passwords) assim que chegam; o browser envia o valor em claro só para o pseudonimizar, nunca fica persistido.

---

## 4. Como funciona a leitura de PDF/Excel

O motor de leitura vive isolado em [`webapp/src/pages/main/submission/parsing/`](webapp/src/pages/main/submission/parsing/) — o componente [`create.jsx`](webapp/src/pages/main/submission/create.jsx) trata só da interface (formulário, barra de progresso, tabela de revisão) e chama uma função de topo por tipo de ficheiro:

| Ficheiro | Para quê |
|---|---|
| [`readPdf.js`](webapp/src/pages/main/submission/parsing/readPdf.js) | `readPdfFile()` — orquestra a leitura completa de um PDF |
| [`readExcel.js`](webapp/src/pages/main/submission/parsing/readExcel.js) | `readExcelFile()` — o mesmo para Excel |
| [`pdfReader.js`](webapp/src/pages/main/submission/parsing/pdfReader.js) | Extração de texto do PDF e separação por diagnóstico |
| [`paramMatching.js`](webapp/src/pages/main/submission/parsing/paramMatching.js) | Motor genérico de deteção por keywords + fuzzy matching |
| [`clinicalRules.js`](webapp/src/pages/main/submission/parsing/clinicalRules.js) | Match direto contra a BD de parâmetros + regras clínicas fixas |
| [`biomarkerDetection.js`](webapp/src/pages/main/submission/parsing/biomarkerDetection.js) | Deteção de biomarcadores e do respetivo resultado (via BD) |
| [`textUtils.js`](webapp/src/pages/main/submission/parsing/textUtils.js) | Normalização de texto e outros utilitários partilhados |
| [`submissionRow.js`](webapp/src/pages/main/submission/parsing/submissionRow.js) / [`patientNames.js`](webapp/src/pages/main/submission/parsing/patientNames.js) | Validação da linha e nome fictício do doente |

O wizard visível ao utilizador continua a ser o mesmo de sempre, 5 passos:

```
Ficheiro → Contexto Técnico → Parsing → Processado → Revisão
```

1. **Ficheiro**: o utilizador arrasta/seleciona um `.pdf`, `.xlsx` ou `.xls`.
2. **Contexto Técnico**: escolhe o **Modelo Tumoral** (Mama, Estômago, Gânglio, Cólon e recto, Endométrio, Ovário) — é o contexto usado depois para ir buscar o template técnico certo.
3. **Parsing**: aqui acontece a extração e deteção automática (detalhado abaixo). Há uma barra de progresso real (não simulada) com percentagem e contagem "X / Y diagnósticos processados".
4. **Processado / Revisão**: mostra estatísticas (nº de registos, taxa de sucesso, resultados por biomarcador) e uma tabela editável, filtrável para "só os que têm problemas", antes de confirmar a submissão final.

### 4.1. Passo a passo dentro de `readPdfFile`

1. **Extrair o texto do PDF** — `extractPdfPages()` (em `pdfReader.js`) lê o PDF inteiramente no browser, página a página, com `pdfjs-dist`. Por dentro agrupa os fragmentos de texto de cada página em linhas pela posição Y (função privada `itemsToLines`) — sem isto, uma extração "ingénua" de PDF costuma misturar colunas/blocos fora de ordem. `readPdfFile` junta o texto de todas as páginas numa só string.

2. **Cortar por doente** — `splitCasesByDiagnosis()` (também em `pdfReader.js`) usa uma regex (`DIAGNOSIS_REGEX`, reconhece números de diagnóstico do tipo `H2026/1234`, `B2026/1234`, `2026001234`, `1234/H2026`) para cortar o texto completo em blocos, um por doente. Para cada bloco, chama `dedupeRepeatedLines()` (em `textUtils.js`), que remove a duplicação típica destes exports: alguns hospitais reimprimem a nota clínica inteira de cada vez que acrescentam uma linha nova, por isso o mesmo texto aparece repetido dezenas de vezes — como cada versão é sempre um prefixo da seguinte, guarda-se só a primeira ocorrência de cada linha.

3. **Para cada caso, três perguntas** (dentro do ciclo `for` de `readPdfFile`):
   - *Que biomarcador(es)?* — `detectBiomarkers()` (em `biomarkerDetection.js`) compara o texto normalizado (`normalizeText`, de `textUtils.js`) contra as keywords de cada biomarcador guardado na tabela `biomarkers`. Um caso pode conter mais do que um biomarcador.
   - *Que tipo de amostra (Produto)?* — `extractParamFromCase()` (em `paramMatching.js`) isola primeiro o texto à volta das keywords do parâmetro (`getKeywordContexts`) e só depois testa correspondência com `matchValue()` (já com fuzzy matching embutido).
   - *Que resultado, por biomarcador?* — para cada biomarcador encontrado, `extractResultadoForBiomarker()` (em `biomarkerDetection.js`) chama outra vez `extractParamFromCase()`, mas com as keywords/resultados **desse biomarcador específico** (tabela `biomarker_results`) em vez de uma lista genérica. É assim que HER2 e PD-L1 mencionados no mesmo doente ficam cada um com o resultado certo, em vez de partilharem a mesma escala.

4. **Duas redes de segurança extra**, a correr sobre o mesmo texto e combinadas com o resultado acima:
   - `parsePdfWithSimilarity()` (em `paramMatching.js`) — corta o texto em janelas de ~12 palavras (`getChunks`, de `textUtils.js`) e aceita a correspondência mais parecida, para tolerar erros de OCR/digitalização.
   - `parseWithContext()` (em `paramMatching.js`) — outra passagem por contexto, mas que sabe onde parar de ler (até à etiqueta do próximo parâmetro, via a função privada `findNextParamIndex`).
   - `parseClinicalText()` (em `clinicalRules.js`) — combina `extractFromDatabase()` (match direto por regex contra os valores da BD) com `applyClinicalRules()` (regras fixas, ex.: intensidade da expressão).

5. **Validar e nomear** — `getMissingFields()` (em `submissionRow.js`) marca a linha como "com problemas" se faltar Produto ou Resultado; `getPatientName()` (em `patientNames.js`) atribui um nome fictício só para mostrar na tabela de revisão (o nome real do doente nunca entra no sistema).

6. **No fim**, `readPdfFile` devolve `{ parsedPages, totalCases }` a `create.jsx`, que só aí decide o que fazer a nível de interface: avisar se falta um template técnico para algum biomarcador, avançar o wizard, mostrar mensagens.

### 4.2. Caminho do Excel

`readExcelFile()` (em `readExcel.js`) não tem motor próprio — reutiliza exatamente as mesmas funções do ponto 3 em diante. A diferença está só no início: em vez de `extractPdfPages`/`splitCasesByDiagnosis`, o ficheiro é enviado ao servidor (`POST /submissionHer/readExcel`), que faz só o parsing estrutural (linhas/colunas) com a biblioteca `xlsx` e devolve as linhas em bruto como JSON — nenhuma inteligência aí. Cada linha é depois convertida em "texto livre" (junção de todos os valores das células, ignorando os nomes das colunas, porque o layout varia de ficheiro para ficheiro) e segue o mesmo caminho do PDF a partir da deteção de biomarcadores. A barra de progresso tem duas fases: primeiro a percentagem real de upload do ficheiro, depois a percentagem de linhas analisadas.

### 4.3. Porque é que os biomarcadores/resultados vêm da base de dados

Isto não era sempre assim — inicialmente HER2/PD-L1 e os seus resultados estavam *hardcoded* no código do frontend. Agora tudo isto é gerido pelo separador **Biomarcador** em Gestão de Dados: um admin pode criar um novo biomarcador (ex.: adicionar "ALK") só preenchendo o nome, as keywords de deteção e a lista de resultados possíveis (cada um com as suas próprias keywords) — **sem tocar em código**. A aplicação de submissões passa a detetá-lo automaticamente na próxima vez que alguém carregar um PDF/Excel que o mencione.

---

## 5. Modelo de dados (resumo)

| Tabela | Para quê |
|---|---|
| `hospitals` | Instituições. |
| `login` | Utilizadores (admin/adminHospital/repHospitalar), password com bcrypt. |
| `platforms` / `antibodies` | Catálogo global de plataformas IHQ e anticorpos/clones, com workflow de aprovação (`status`: approved/pending/rejected). |
| `biomarkers` | Biomarcadores e as suas keywords de deteção (JSON). |
| `biomarker_results` | Resultados possíveis de cada biomarcador (`value` + keywords, JSON), FK para `biomarkers`. |
| `hospital_technical` | Templates por hospital: Biomarcador + Modelo Tumoral → Plataforma + Anticorpo. |
| `submissions` | Cada exame submetido (doente/diagnóstico pseudonimizados). |
| `submission_items` | Dados estruturados adicionais por submissão (quando aplicável). |
| `logs` | Auditoria (login, sugestões, aprovações, edições, etc.). |

Estrutura completa (todas as colunas/índices/FKs): [`server/sql/schema.sql`](server/sql/schema.sql). Alterações incrementais documentadas em `server/migrations/`.

Dados de referência (não vêm na estrutura, têm de ser populados à parte):
- [`server/sql/seed-biomarkers.sql`](server/sql/seed-biomarkers.sql) — os 13 biomarcadores reais em uso (HER2, PD-L1, Ki67, MLH1, MSH2, MSH6, PMS2, p53, RE, RP, Claudina 18.2, EBER, FOLR1) com as respetivas keywords e resultados possíveis. Idempotente (`INSERT IGNORE`).
- `server/scripts/seed-reference-data.js` — plataformas e anticorpos de referência (`node scripts/seed-reference-data.js`, requer que já exista um `login` com role `admin`).

---

## 6. Correr o projeto localmente

```bash
# Base de dados: importar, por esta ordem, para uma BD MySQL/MariaDB vazia:
#   1. server/sql/schema.sql          (estrutura)
#   2. server/sql/seed-biomarkers.sql (biomarcadores + resultados)

# Backend
cd server
npm install
# criar server/.env com EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS
# e configurar a ligação à BD em server/utils/database.js
node index.js
# depois de ter pelo menos um admin criado, popular plataformas/anticorpos:
node scripts/seed-reference-data.js

# Frontend
cd webapp
npm install
npm run dev
# ajustar server_ip em webapp/src/utils/config.jsx se o backend não estiver em 127.0.0.1:4001
```
