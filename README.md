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

Todo este motor vive em `webapp/src/pages/main/submission/create.jsx`. O fluxo visível ao utilizador é um wizard de 5 passos:

```
Ficheiro → Contexto Técnico → Parsing → Processado → Revisão
```

1. **Ficheiro**: o utilizador arrasta/seleciona um `.pdf`, `.xlsx` ou `.xls`.
2. **Contexto Técnico**: escolhe o **Modelo Tumoral** (Mama, Estômago, Gânglio, Cólon e recto, Endométrio, Ovário) — é o contexto usado depois para ir buscar o template técnico certo.
3. **Parsing**: aqui acontece a extração e deteção automática (detalhado abaixo). Há uma barra de progresso real (não simulada) com percentagem e contagem "X / Y diagnósticos processados".
4. **Processado / Revisão**: mostra estatísticas (nº de registos, taxa de sucesso, resultados por biomarcador) e uma tabela editável, filtrável para "só os que têm problemas", antes de confirmar a submissão final.

### 4.1. Caminho do PDF

1. **Extração de texto** (`extractPdfPages`, com `pdfjs-dist`): o PDF é lido **inteiramente no browser**, página a página. Os fragmentos de texto de cada página são agrupados em linhas pela posição Y (`itemsToLines`) — isto é importante porque uma extração "ingénua" de PDF costuma misturar colunas/blocos de texto fora de ordem.
2. **Separação em "casos"** (`splitCasesByDiagnosis`): muitos exports hospitalares são uma "listagem de consulta" com **vários doentes/diagnósticos concatenados num único PDF**. O texto completo é cortado em blocos usando uma regex que reconhece números de diagnóstico do tipo `H2026/1234`, `B2026/1234`, `2026001234`, `1234/H2026`, etc. Cada bloco entre duas ocorrências consecutivas é um "caso".
3. **Deduplicação de linhas repetidas** (`dedupeRepeatedLines`): alguns exports reconstroem a nota clínica incrementalmente, reimprimindo o texto todo a cada linha nova adicionada — o mesmo conteúdo aparece dezenas de vezes. Como cada revisão é sempre um prefixo da seguinte, mantém-se só a primeira ocorrência de cada linha, o que reconstitui a nota final sem repetição.
4. **Para cada caso**, processado sequencialmente (com um pequeno "yield" entre iterações para a barra de progresso atualizar em tempo real):
   - **Deteção de biomarcador(es)** (`detectBiomarkers`): compara o texto (normalizado — sem acentos, minúsculas) contra as **keywords de cada biomarcador definido na tabela `biomarkers`** (ex.: HER2 deteta "her2", "her-2", "erbb2", "c-erbb2", …). Um caso pode conter mais do que um biomarcador.
   - **Extração do "Produto"** (tipo de amostra — Biópsia / Peça cirúrgica): usa uma lista fixa de parâmetros (`params.jsx`) com keywords + valores possíveis, com correspondência exata e, em fallback, *fuzzy matching* (via `string-similarity`) para tolerar erros de OCR/formatação.
   - **Extração do "Resultado" — por biomarcador**: esta é a parte mais importante do motor e foi desenhada especificamente para não misturar escalas diferentes. Cada biomarcador detetado é avaliado **individualmente** contra os seus próprios `biomarker_results` (tabela `biomarker_results`: `value` + `keywords`) — por exemplo, HER2 é comparado contra "Negativo", "1+", "2+", "3+", …, enquanto PD-L1 é comparado contra "TPS < 1%", "CPS ≥ 10", etc. Isto significa que um mesmo caso com HER2 *e* PD-L1 mencionados obtém um resultado correto e independente para cada um, em vez de aplicar a mesma lista genérica aos dois (era um bug do desenho anterior, corrigido).
   - **Template técnico**: com o biomarcador + modelo tumoral já conhecidos, procura-se em `hospital_technical` a Plataforma/Anticorpo configurados para essa combinação nesse hospital.
   - Se faltar Produto ou Resultado, o registo fica marcado como "com problemas" (`hasIssues`) para revisão manual; se o biomarcador não tiver template configurado (ou tiver um pendente de aprovação), a aplicação bloqueia e pede para criar o template ou aguardar aprovação antes de continuar.
5. **Verificação de duplicados**: antes de mostrar a revisão final, os pares (diagnóstico, biomarcador) são enviados ao servidor (`/submissionHer/checkExisting`) que compara com o que já existe — o servidor é que consegue comparar porque só ele tem a chave/hash; o browser não pode reidentificar diagnósticos já gravados sozinho.

### 4.2. Caminho do Excel

O Excel **não tem um motor de leitura próprio** — reutiliza exatamente a mesma lógica de deteção de biomarcador/resultado do PDF, aplicada linha a linha:

1. O ficheiro é enviado ao servidor (`POST /submissionHer/readExcel`), que só faz o parsing estrutural (linhas/colunas) com a biblioteca `xlsx` e devolve as linhas em bruto como JSON — nenhuma inteligência aqui.
2. No browser, cada linha é convertida em "texto livre" (concatenação de todos os valores das células, ignorando os nomes das colunas — porque o layout varia de ficheiro para ficheiro) e passa **pelo mesmo pipeline do PDF**: deteção de biomarcadores por keywords, extração de Resultado por biomarcador a partir de `biomarker_results`, extração de Produto, lookup de template técnico.
3. A barra de progresso tem duas fases: primeiro a **percentagem real de upload** do ficheiro (`onUploadProgress` do axios), depois a **percentagem de linhas analisadas**.

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

---

## 6. Correr o projeto localmente

```bash
# Base de dados: importar server/sql/schema.sql para uma BD MySQL/MariaDB vazia

# Backend
cd server
npm install
# criar server/.env com EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS
# e configurar a ligação à BD em server/utils/database.js
node index.js

# Frontend
cd webapp
npm install
npm run dev
# ajustar server_ip em webapp/src/utils/config.jsx se o backend não estiver em 127.0.0.1:4001
```
