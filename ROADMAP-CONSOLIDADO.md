# Roadmap Consolidado de Implementação — Sistema de Lavanderia

> **Fontes:** `ERS.md` **v2.2** (requisitos — 93 RFs: Essencial 26 · Alta 45 · Média 17 · Baixa 5) e `SDD.md` v1.1 (design — 871 linhas).
> **Uso previsto:** cada etapa é autocontida e dimensionada para caber em uma sessão de Claude Code sem estourar a janela de contexto. As referências de leitura apontam **seções e linhas exatas** dos dois arquivos — leia apenas o indicado, não o arquivo inteiro.
> **Linhas do ERS conferidas contra a v2.2 (771 linhas):** tudo até o §3.7 (linha ~310) manteve as linhas da v2.1; do §3.8 em diante as linhas foram **remedidas na v2.2** e atualizadas abaixo. Em caso de dúvida, localizar pelo **ID do requisito** (`grep "RF-REL-01" ERS.md`). As linhas do `SDD.md` valem para a v1.1 — **até que a atualização da RN-19 seja aplicada** (ver prompt de correção do SDD que acompanha este roadmap); após aplicá-la, revalidar os trechos §7.5/§9.5.
> **Restrições transversais (valem para TODAS as etapas):** mobile-first (ERS `RES-09`, linhas 175; SDD §3.1 linha 105 e §10.3 linhas 663–684) e docker-first (ERS `RES-10`, linha 176; SDD §3.1 linha 106). Nenhuma etapa pode introduzir passo que dependa de Node/Postgres no host, e todo CSS parte do mobile (classes sem prefixo = 360px; `desk:` = ≥701px).

---

## Como usar este roadmap com o Claude Code

**Template de prompt por etapa** (copie, preencha e envie):

```
Estamos implementando a Etapa <N> do arquivo roadmap-consolidado.md do projeto Sistema de Lavanderia.

Leia SOMENTE os trechos indicados na seção "Leitura obrigatória" da Etapa <N>
(arquivo + intervalo de linhas). Não leia o restante dos documentos.

Execute as tarefas listadas na etapa, respeitando as restrições transversais
(mobile-first RES-09 e docker-first RES-10).

Ao final, valide os "Critérios de aceite e testes" da etapa, rodando os testes
dentro do container (docker compose).
```

**Regra de ouro:** não iniciar uma etapa sem que as etapas listadas em "Depende de" estejam concluídas, e sem que as decisões listadas em "Bloqueios" estejam fechadas.

---

## Etapa 0 — Decisões fechadas (registro vinculante) ✅ CONCLUÍDA

**Todas as decisões que bloqueavam etapas estão fechadas.** Este registro é vinculante para as etapas seguintes — nenhuma sessão de implementação deve reabri-las.

| # | Decisão | Resolução | Afeta |
|---|---|---|---|
| 1 | Administração do catálogo pela UI | **NÃO entra** — nem no MVP, nem depois. Serviços são fixos, vêm de tabela no banco (`Servico`), cadastrados **diretamente no banco** (seed/SQL). O cliente não quer opção de mexer pela UI, para evitar exclusão acidental. **RF-SRV-03 sai do escopo do produto.** | Etapa 2 (seed é a única via de gestão) |
| 2 | Numeração de OS | **Tabela `Contador` dedicada**, incrementada com `UPDATE ... RETURNING` atômico dentro da mesma transação que cria a OS. Escolhida por menor chance de erro (sem corrida, sem dependência de nível de isolamento) e melhor manutenção (sequência ajustável como dado, não inferida). | Etapa 2 (schema) e Etapa 8 (gerador) |
| 3 | Valor monetário | **`Decimal(10,2)`** — é o padrão recomendado pelos dois documentos (ERS RN-15; SDD §5.3). Nunca `float`. | Etapa 2 (schema), Etapa 8 (cálculos) |
| 5 | Escopo da busca de clientes | **Nome OU CPF** (telefone fora). A busca aceita texto e casa contra nome e contra CPF (com ou sem máscara — normalizar dígitos antes de comparar). | Etapa 7 (RF-CLI-09) |
| 6 | Métricas contextuais do Dashboard | **Escopo = exatamente o protótipo aprovado.** O cliente validou a tela do protótipo e não pediu nada além. RF-DSH-07 não adiciona contadores novos — implementar somente o que o protótipo exibe. | Etapa 12 (RF-DSH-07) |
| 7 | Geração de PDF | **Biblioteca JS: `@react-pdf/renderer`**, com carregamento lazy no acionamento. Motivo: o requisito exige preview fiel ao arquivo enviado — a lib gera o **Blob real do PDF** e o preview exibe **esse mesmo blob** (`URL.createObjectURL` em `<iframe>`), garantindo preview = arquivo enviado e layout determinístico em qualquer dispositivo. Impressão CSS foi descartada por variar entre navegadores e não produzir `File` confiável para a Web Share API. | Etapa 14 |

**Fechadas na v2.2 do ERS (não eram do §9.7 original):**
- **RN-19 (nova)** — base de faturamento **única**: `PAGA + AGENDAMENTO_PAGO` para Dashboard **e** Relatórios, via **função de domínio compartilhada**; divergência entre as telas é defeito.
- **RN-20 (nova) + RF-REL-08 (novo)** — **competência = `Ordem.data`** (data do serviço) para toda agregação temporal. `dataEmissao` e data de pagamento ficam fora; o sistema **não rastreia data de pagamento** (sem campo `dataPagamento`). Consequência documentada: o faturamento de um mês já fechado pode subir depois, se um pagamento de serviço daquele mês for registrado mais tarde — comportamento correto por definição.
- RF-REL-01 e RF-REL-02 rebaixados para **Protótipo (parcial)**: o layout da tela de Relatórios está validado, mas **a lógica de cálculo do protótipo NÃO deve ser copiada** (usava base errada).

---

## Etapa 1 — Bootstrap containerizado (PT-01 / Fase 0 do SDD)

**Objetivo:** primeiro commit já containerizado: Next.js 15 + TypeScript strict + ESLint/Prettier + Dockerfile multi-stage + docker-compose (app + Postgres) + `.env.example`. Critério central: `docker compose up` serve a aplicação.

**Requisitos cobertos:** PT-01, RES-10, RNF-MAN-01, RNF-POR-02, RNF-POR-04 (parcial), RNF-POR-05 (estrutura do `.env.example`).

**Leitura obrigatória:**
- `ERS.md` PT-01 (linha 618) e RES-10 (linha 176).
- `ERS.md` RNF-POR-02/04/05 (linhas 459, 461–462).
- `SDD.md` §3 stack (linhas 83–107) — tabela de tecnologias e princípios.
- `SDD.md` §4.2 estrutura de pastas (linhas 137–198) — criar o esqueleto exatamente assim.
- `SDD.md` §13.1–13.2 (linhas 763–777) — Dockerfile multi-stage e compose base + override de dev.
- `SDD.md` §13.4 (linhas 795–807) — variáveis do `.env.example`.

**Tarefas:**
1. Criar projeto Next.js 15 (App Router) com TypeScript `strict`, ESLint e Prettier.
2. `Dockerfile` 3 estágios (`deps` → `builder` → `runner`), `output: "standalone"`, usuário não-root, `TZ=America/Sao_Paulo`, porta 3000.
3. `docker-compose.yml` (app + `postgres:17-alpine`, volume nomeado `pgdata`, healthcheck `pg_isready`, `depends_on: service_healthy`) e `docker-compose.override.yml` (hot reload por volume, `next dev`, porta do Postgres exposta).
4. `.env.example` versionado com `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NODE_ENV`, `TZ`, `EMPRESA_NOME` (sem valores reais).
5. `.dockerignore` e esqueleto de pastas do SDD §4.2 (pastas vazias com `.gitkeep` onde necessário).

**Critérios de aceite e testes:**
- `docker compose up` sobe app + banco e serve `http://localhost:3000` sem Node/Postgres no host.
- `npm run lint` e `tsc --noEmit` passam dentro do container.
- Hot reload funciona no modo dev (editar um arquivo reflete no navegador).

**Depende de:** nada. **Bloqueios:** nenhum.

---

## Etapa 2 — Modelo de dados e migrations (PT-02)

**Objetivo:** schema Prisma completo, primeira migration aplicada pelo entrypoint, índices e seed mínimo (admin + 4 serviços do catálogo).

**Requisitos cobertos:** PT-02, RF-SRV-01 (tabela), RF-SRV-02 (seed do catálogo), RNF-CON-03, RNF-DES-03, RNF-SEG-04 (cuid), parte de RNF-POR-06 (`migrate deploy` no entrypoint).

**Leitura obrigatória:**
- `SDD.md` §5 completo (linhas 224–374) — **este é o trecho principal**: schema Prisma proposto (linhas 238–350), decisões de modelagem (linhas 352–361) e mapa protótipo→produção (linhas 363–374).
- `SDD.md` §13.3 entrypoint (linhas 779–793) — `prisma migrate deploy` antes de aceitar tráfego.
- `ERS.md` PT-02 (linha 619), RF-SRV-01/02 (linhas 251–252), RN-15 sobre `Decimal` (linha 360).
- `ERS.md` §10.2 enum de formas de pagamento (linhas 733–735).

**Tarefas:**
1. Escrever `prisma/schema.prisma` conforme SDD §5.2 (enums `Perfil`, `StatusOrdem`, `FormaPagamento`; models `Usuario` com `sessaoVersao`, `Cliente`, `Servico`, `Ordem`, `ItemServico`; índices declarados).
2. **Adicionar model `Contador`** (decisão #2): ex. `model Contador { id String @id; valor Int }` com registro `"ordem_numero"` — será incrementado atomicamente na Etapa 8.
3. Valor monetário: **`Decimal(10,2)`** (decisão #3, fechada).
4. Primeira migration versionada; `docker/entrypoint.sh` valida env → aguarda banco → `prisma migrate deploy` → start.
5. `prisma/seed.ts`: usuário admin inicial (senha via hash — pode usar bcrypt já aqui) + 4 serviços: Limpeza e Higienização, Impermeabilização, Lavagem de Tapetes, Lavagem de Cortinas + registro inicial do `Contador`. Executável via comando no container.
6. **Catálogo gerenciado exclusivamente por seed/SQL** (decisão #1): não haverá tela de administração de serviços — RF-SRV-03 está fora do escopo. Documentar no README como incluir/desativar um serviço direto no banco (`UPDATE "Servico" SET ativo = ...`).
7. Singleton `src/lib/prisma.ts`.

**Critérios de aceite e testes:**
- `docker compose up` do zero (volume limpo) aplica migrations e sobe.
- Seed roda por comando no container e é idempotente (rodar 2x não duplica).
- `Usuario.email` e `Cliente.cpf` com unique constraint; `Ordem.numero` unique; `Contador` populado.

**Depende de:** Etapa 1. **Bloqueios:** nenhum (decisões #1, #2 e #3 fechadas).

---

## Etapa 3 — Fundações transversais: Zod, formatação BR e marca (PT-03, PT-06, PT-09)

**Objetivo:** módulos puros e schemas que todo o restante consome. Sem UI ainda.

**Requisitos cobertos:** PT-03, PT-06, PT-09, RF-UX-01, RF-UX-02, RF-UX-08 (config), RN-01, RN-03, RNF-MAN-04, RNF-SEG-03 (base), RNF-USA-01.

**Leitura obrigatória:**
- `SDD.md` §6 completo (linhas 377–451) — schemas Zod de cliente, ordem e usuário (copiar como base).
- `ERS.md` RF-UX-01/02 (linhas 328–329), RF-UX-08 (linha 335).
- `ERS.md` RN-01 (linha 346), RN-03 (linha 348), RN-07 (linha 352), RN-08 (linha 353), RN-13 (linha 358).
- `SDD.md` §4.2 (linhas 174–186) — onde ficam `domain/`, `schemas/`, `lib/format.ts`.

**Tarefas:**
1. `src/domain/cpf.ts`: `validarCPF` (dígitos verificadores) + `fmtCPF` (máscara `###.###.###-##`).
2. `src/lib/format.ts`: `fmtData` (`DD/MM/AAAA`), `fmtMoeda` (`R$ 0.000,00`, vírgula decimal — **função única**), `fmtTelefone` (celular/fixo), `fmtCEP` (`00000-000`), `fmtMes` (`Mmm/AAAA`). Datas tratadas como locais sem deslocamento de dia (ERS RES-06, linha 172).
3. `src/schemas/cliente.ts`, `ordem.ts`, `usuario.ts` conforme SDD §6 (incluindo `hoje()` dinâmico e `emHorarioComercial` 08–18h).
4. Configuração de marca: leitura de `EMPRESA_NOME` centralizada (PT-09), com validação de env por schema Zod no boot (RNF-POR-05).

**Critérios de aceite e testes:**
- Testes unitários (podem rodar com o runner que será oficializado na Etapa 4B/PT-07; se ainda não existir, criar Vitest básico aqui): CPFs válidos/inválidos, formatação de moeda/data, horário comercial nos limites (08:00 ok, 18:00 ok/07:59 não — definir inclusividade e testar), data de hoje aceita.
- Nenhum `any`; schemas exportam tipos via `z.infer`.

**Depende de:** Etapa 2 (tipos do Prisma). **Bloqueios:** nenhum.

---

## Etapa 4 — Autenticação, sessão longa e RBAC (PT-04)

**Objetivo:** Auth.js (NextAuth v5) com Credentials Provider, hash de senha, sessão rolante de 30 dias, revogação por `sessaoVersao` e middleware de proteção de rotas.

**Requisitos cobertos:** RF-AUT-01, 02, 03, 04, 08, 09, 10, 11, 12; RN-11, RN-12 (guarda), RN-18; RNF-SEG-01/02/04/05; RNF-USA-06.

**Leitura obrigatória:**
- `SDD.md` §8 completo (linhas 521–593) — **trecho principal**: config de sessão com `maxAge` 30d + `updateAge` 24h (linhas 534–557), mecânica do `sessaoVersao` (linhas 564–576), RBAC em 3 níveis (linhas 580–587), gestão de senha (linhas 589–593).
- `ERS.md` RF-AUT-01..12 (linhas 195–208) + notas (linhas 210–212).
- `ERS.md` RN-18 (linha 363).
- `SDD.md` §4.3 (linhas 200–221) — rotas, middleware, redirecionamento do funcionário para `/agenda`.

**Tarefas:**
1. `src/server/auth.ts`: NextAuth com Credentials Provider; verificação bcrypt contra `senhaHash`; bloqueio de `ativo === false`; cookie httpOnly + `SameSite=Lax` + `Secure` em produção, **persistente** (`maxAge` no cookie).
2. Sessão JWT: `maxAge: 30d`, `updateAge: 24h`; callbacks `jwt`/`session` injetando `id`, `perfil`, `sessaoVersao`; conferência do `sessaoVersao` contra o banco a cada renovação — divergência rejeita a sessão.
3. `middleware.ts`: protege grupo `(app)`; `/login` pública; renova sessão rolante; funcionário em rota admin → redirect `/agenda`.
4. Página `/login` mínima (formulário e-mail+senha, erros amigáveis) — o layout definitivo vem na Etapa 5.
5. Helpers de guarda para Server Actions (`requireAdmin`, `requireUser`).

**Critérios de aceite e testes:**
- Testes de integração (no container): login válido cria sessão; usuário inativo não loga; incrementar `sessaoVersao` invalida sessão vigente; funcionário não acessa rota admin.
- Fechar/reabrir navegador mantém sessão (cookie persistente).
- Nenhuma resposta retorna `senhaHash`.

**Depende de:** Etapas 2 e 3. **Bloqueios:** nenhum (decisão #4 já fechada).

### Etapa 4B (paralela ou imediatamente após) — Infra de testes e CI (PT-07)

**Requisitos:** PT-07, RNF-MAN-02/03, RNF-POR-04. **Leitura:** `ERS.md` PT-07 (linha 624); `SDD.md` §12.4 (linhas 745–750) e §13.5 CI/CD (linha 811).
**Tarefas:** runner de testes unitários + integração executando **dentro do container** contra o Postgres do compose; pipeline de CI com typecheck, lint, testes e build/publicação da imagem.
**Aceite:** `docker compose run` (ou serviço de teste) roda a suíte; CI verde.

---

## Etapa 5 — Design system e shell de navegação mobile-first (PT-05)

**Objetivo:** Tailwind + shadcn/ui configurados, tokens de cor de status, layout autenticado `(app)` com bottom-nav (mobile) e topbar (`desk:`), toasts e componentes compartilhados.

**Requisitos cobertos:** PT-05, RF-UX-03 (infra de toast), RF-UX-06, RF-UX-09 (componente de confirmação), RF-UX-11 (padrão visual ativo/inativo), RIU-01, RIU-02, RIU-03, RIU-04; RES-09; RNF-USA-05.

**Leitura obrigatória:**
- `SDD.md` §10 completo (linhas 644–691) — **trecho principal**: design system, mapa de cores, regra mobile-first do Tailwind (`desk: "701px"`), Sheet vs Dialog, paginação sobre a bottom-nav, ergonomia de toque.
- `ERS.md` RIU-01..05 (linhas 371–386) e RES-09 (linha 175).
- `ERS.md` RF-UX-03/06/09/11 (linhas 330, 333, 336, 338); RNF-USA-05 (linha 434).
- `SDD.md` §4.3 navegação (linhas 215–221).

**Tarefas:**
1. `tailwind.config.ts` com screen `desk: "701px"` e tokens das 5 cores de status (tabela SDD linhas 653–659).
2. Instalar componentes shadcn/ui base: Button, Dialog, Sheet, Input, Select, Table, Card, Badge, Toast/Sonner, Pagination.
3. Layout `(app)`: bottom-nav fixa + botão "Opções" (mobile) / topbar (`desk:`); abas derivadas do papel da sessão.
4. Componentes compartilhados: `<StatusBadge/>` (cores RIU-04), `<Pagination/>` (fixa acima da bottom-nav no mobile com `safe-area-inset-bottom`), `<ConfirmDialog/>` (ações destrutivas), padrão visual de inativo (opacidade/badge), provider de toast (~3s).
5. Modal responsivo: `Sheet` slide-up no mobile, `Dialog` centralizado no `desk:`.

**Critérios de aceite e testes:**
- Toda tela validada em **360×640** (sem rolagem horizontal) antes do desktop.
- Alvos de toque ≥ 44×44px; nenhuma classe `max-*` para "consertar" mobile.
- Admin vê todas as abas; funcionário vê apenas Agenda + Opções.

**Depende de:** Etapa 4. **Bloqueios:** nenhum.

---

## Etapa 6 — Gestão de usuários (RF-USR)

**Objetivo:** CRUD completo de usuários pelo admin + redefinição da própria senha, com revogação de sessão integrada.

**Requisitos cobertos:** RF-USR-01..07; RF-AUT-05 (confirmação de logout); RN-10 (usuários), RN-13; integração com RF-AUT-12 (incrementar `sessaoVersao`).

**Leitura obrigatória:**
- `ERS.md` RF-USR-01..07 + nota (linhas 216–226).
- `SDD.md` §9.6 (linhas 636–641) — especificação do módulo.
- `SDD.md` §11 tabela de actions (linhas 698–715) — assinaturas `criarUsuario`, `editarUsuario`, `inativar/reativarUsuario`, `resetarSenhaUsuario`, `alterarPropriaSenha` e quais incrementam `sessaoVersao`.
- `SDD.md` §6.3 schemas de usuário (linhas 434–448).

**Tarefas:**
1. Server Actions com padrão de retorno `{ ok: true, data } | { ok: false, erros }` (SDD linha 696), guarda admin, re-validação Zod.
2. Unicidade de e-mail: constraint + erro amigável "E-mail já cadastrado".
3. Página `/usuarios` (admin): lista em cards com badge de papel e estado ativo/inativo; criar; editar nome/e-mail; inativar/reativar (com ConfirmDialog); resetar senha.
4. "Opções" → redefinir a própria senha (qualquer autenticado).
5. `inativarUsuario`, `resetarSenhaUsuario` e `alterarPropriaSenha` incrementam `sessaoVersao`.
6. Confirmação de logout (RF-AUT-05).

**Critérios de aceite e testes:**
- Integração: e-mail duplicado retorna erro amigável; senha < 6 rejeitada; inativar usuário derruba sessão dele; funcionário não acessa `/usuarios`.
- Toast de sucesso/erro em toda escrita.

**Depende de:** Etapas 4 e 5. **Bloqueios:** nenhum.

---

## Etapa 7 — Clientes: CRUD, busca e paginação (RF-CLI núcleo)

**Objetivo:** módulo de clientes completo exceto histórico (que depende de OS).

**Requisitos cobertos:** RF-CLI-01..07, 09, 10, 12; RN-01, RN-02, RN-03, RN-10, RN-11 (seleção); RNF-DES-01.

**Leitura obrigatória:**
- `ERS.md` RF-CLI-01..12 (linhas 232–243).
- `SDD.md` §9.1 (linhas 599–605) — especificação do módulo.
- `SDD.md` §6.1 schema de cliente (linhas 381–406) — inclui a nota sobre unicidade de CPF na action.
- `SDD.md` §11 (linhas 700–702) — actions de cliente.
- `ERS.md` RN-01/02/03 (linhas 346–348).

**Tarefas:**
1. Server Actions: `criarCliente`, `editarCliente`, `inativarCliente`, `reativarCliente` (admin; Zod no servidor; CPF único com mensagem "Este CPF já está registrado").
2. Formulário com máscaras (CPF, telefone, CEP), `inputmode` numérico, campo Complemento, validação inline por campo, asterisco em obrigatórios.
3. Página `/clientes`: cards no mobile / tabela no `desk:`; **busca por nome OU CPF** (decisão #5 — telefone fora; normalizar o termo removendo máscara e comparar contra os dígitos do CPF armazenado); paginação 10/página **no banco** (`skip`/`take`); distinção visual ativo/inativo.
4. Inativar com ConfirmDialog (o aviso de ordens pendentes RF-CLI-08 fica para a Etapa 13).

**Critérios de aceite e testes:**
- Integração: CPF inválido/duplicado bloqueado; cliente inativo não aparece em busca de seleção para OS (preparar a query desde já); paginação correta.
- Busca encontra o cliente tanto por nome parcial quanto por CPF digitado com ou sem máscara.
- Tela ok em 360px.

**Depende de:** Etapas 5 e 6 (funcionários existem). **Bloqueios:** nenhum (decisão #5 fechada).

---

## Etapa 8 — Domínio da OS: máquina de status, cálculos e numeração

**Objetivo:** camada de domínio pura e testada ANTES de qualquer UI de ordens. Etapa pequena e crítica.

**Requisitos cobertos:** RN-04, RN-14, RN-15, RN-16, **RN-19 (base única de faturamento)**, **RN-20 (competência = data do serviço)**; RNF-CON-01; RNF-MAN-02; base para RF-OS-01/09/10, RF-DSH-02, RF-REL-01/02/08.

**Leitura obrigatória:**
- `SDD.md` §7 completo (linhas 454–517) — **trecho principal**: transições dos botões Realizado/Pago, cancelamento/reativação, exigência de forma de pagamento, cálculos.
- `ERS.md` §10.1 diagrama de estados (linhas 727–737) e RN-04/05/14/15/16 (linhas 350–362).
- `ERS.md` **RN-19 (linha 365)** e **RN-20 (linha 366)** — base única de faturamento e competência.
- `SDD.md` §5.3 sobre numeração transacional (linhas 354–355). *(Atenção: o SDD §7.5 linha 515 ainda diz "Relatórios consideram apenas ordens PAGA" — está **superado pela RN-19** do ERS v2.2; o ERS é a fonte de verdade.)*

**Tarefas:**
1. `src/domain/status.ts`: `proximoStatus(atual, botao): StatusOrdem` pura, cobrindo: Realizado `AGENDADA↔REALIZADA` / `AGENDAMENTO_PAGO↔PAGA`; Pago `AGENDADA↔AGENDAMENTO_PAGO` / `REALIZADA↔PAGA`; cancelar só de `AGENDADA`; reativar `CANCELADA→AGENDADA`; transições ilegais lançam/retornam erro.
2. `src/domain/pricing.ts`: `totalOrdem = Σ(qtd × valor)` com `Decimal(10,2)`.
3. **`src/domain/faturamento.ts` (RN-19/RN-20 — função única compartilhada):**
   - `STATUS_FATURAMENTO = [PAGA, AGENDAMENTO_PAGO]` exportado como constante única — Dashboard e Relatórios **importam daqui**; nenhuma tela pode redeclarar a base.
   - `competenciaDe(ordem) = Ordem.data` (data do serviço) — única referência temporal de agregação; `dataEmissao` proibida em qualquer agregação; **não existe** data de pagamento.
4. Gerador transacional de `Ordem.numero` via tabela **`Contador`** (decisão #2 fechada): `UPDATE "Contador" SET valor = valor + 1 WHERE id = 'ordem_numero' RETURNING valor` dentro da mesma transação que insere a OS.
5. Regra `exigeFormaPagamento(transicao)` para os avanços a status pago.

**Critérios de aceite e testes:**
- Unitários cobrindo **cada** transição válida e as inválidas.
- Teste de concorrência da numeração (duas criações simultâneas → números distintos e sequenciais, sem gap por corrida).
- Total com `Decimal` sem erro de ponto flutuante.
- Unitário da base de faturamento: ordem `AGENDAMENTO_PAGO` **entra**; `REALIZADA` e `AGENDADA` **não entram**; competência determinada por `data`, não por `dataEmissao`.

**Depende de:** Etapas 2–4B. **Bloqueios:** nenhum (decisão #2 fechada).

---

## Etapa 9 — OS: criação (formulário, autocomplete, snapshot)

**Objetivo:** criar ordens de serviço fim a fim.

**Requisitos cobertos:** RF-OS-01..06, 13 (snapshot na criação), 17 (aviso de conflito); RN-06, RN-07, RN-08, RN-09; RF-SRV-01 (seleção do catálogo).

**Leitura obrigatória:**
- `ERS.md` RF-OS-01..06, 13, 17 (linhas 261–266, 273, 277).
- `SDD.md` §9.2 bloco "Criação" (linhas 607–613) — detalhes do autocomplete (5 recentes ao focar / máx. 10 ao digitar), itens, Google Maps.
- `SDD.md` §6.2 schema de ordem (linhas 408–431).
- `ERS.md` CU-03 (linhas 489–494) — fluxo e exceções.

**Tarefas:**
1. Action `criarOrdem(input)` (admin): Zod no servidor; número via gerador da Etapa 8; snapshot do endereço do cliente; validação data hoje/futura dinâmica e hora 08–18h; ≥1 item.
2. `<ClienteAutocomplete/>`: foco sem texto → 5 clientes ativos mais recentes; digitação → busca ativos (máx. 10).
3. Formulário de OS (Sheet no mobile): cliente, funcionário, data, hora, itens dinâmicos (tipo do catálogo **ou** nome customizado, descrição do objeto, qtd ≥1, valor unitário manual), observações, forma de pagamento opcional.
4. Aviso (não bloqueante) de conflito: mesmo funcionário, mesmo dia/hora (RF-OS-17).

**Critérios de aceite e testes:**
- Integração: data passada rejeitada; 07:59/18:01 rejeitados; OS sem item rejeitada; snapshot gravado; números sequenciais; conflito gera aviso mas permite salvar.
- Formulário completável em 360px.

**Depende de:** Etapas 7 e 8. **Bloqueios:** nenhum.

---

## Etapa 10 — OS: listagem, detalhe, transições e edição

**Objetivo:** operação diária completa sobre as ordens.

**Requisitos cobertos:** RF-OS-07..11, 12, 13 (regeneração na edição), 14, 15, 16, 19, 20; RN-04, RN-05, RN-14; RF-UX-09.

**Leitura obrigatória:**
- `ERS.md` RF-OS-07..20 (linhas 267–280).
- `SDD.md` §9.2 blocos "Listagem/Detalhe/Google Maps" (linhas 610–613).
- `SDD.md` §11 (linhas 703–707) — `editarOrdem`, `avancarStatus`, `cancelarOrdem`, `reativarOrdem` e suas guardas.
- `ERS.md` CU-04 (linhas 496–500) — registro de pagamento.

**Tarefas:**
1. Página `/ordens`: paginação 10/página no banco; filtros combináveis (nome do cliente, data início/fim, status Todas/Agendadas/Realizadas/Pagas/Canceladas); reset para página 1 ao filtrar; ordenação por coluna (data, valor, status) com ▲/▼ no `desk:`.
2. Detalhe da OS: grid read-only + itens + total; ações contextuais por status (Editar, Cancelar, Reativar, Fechar); botão Google Maps (URL do endereço snapshot + cidade/estado).
3. `avancarStatus(id, botao, formaPagamento?)`: valida transição via domínio (Etapa 8) no servidor; avanço a status pago **exige** forma de pagamento (modal de confirmação com seleção); forma exibida no detalhe.
4. `editarOrdem`: só `AGENDADA`/`AGENDAMENTO_PAGO` (UI esconde + servidor recusa); mesma validação de data da criação; endereço **regenerado** do cadastro atual do cliente na edição.
5. Cancelar (só de `AGENDADA`, com ConfirmDialog) e reativar.

**Critérios de aceite e testes:**
- Integração: transição ilegal recusada pelo servidor; pagamento sem forma recusado; edição em status `PAGA` recusada; filtros combinados corretos.
- Toasts em todas as escritas.

**Depende de:** Etapa 9. **Bloqueios:** nenhum.

---

## Etapa 11 — Agenda (RF-AGD)

**Objetivo:** visão operacional por dia, com isolamento do funcionário aplicado no servidor.

**Requisitos cobertos:** RF-AGD-01..07; RF-OS-18 (destaques hoje/atrasada — listas + agenda); RN-12.

**Leitura obrigatória:**
- `ERS.md` RF-AGD-01..07 (linhas 292–298) e RF-OS-18 (linha 278).
- `SDD.md` §9.3 (linhas 615–621) — especificação do módulo.
- `ERS.md` CU-05 e CU-06 (linhas 502–512).
- `SDD.md` §8.2 (linhas 580–587) — filtro `funcionarioId === session.user.id` no servidor.

**Tarefas:**
1. Página `/agenda` (admin + funcionário): ordens por data+hora, agrupadas por dia ("3 de Junho de 2026"), paginação 10/página fixa acima da bottom-nav.
2. Filtro por status operacional — **mapeamento confirmado pelo cliente (vinculante):**
   - **Agendado** = `AGENDADA` + `AGENDAMENTO_PAGO`
   - **Realizado** = `REALIZADA` (Serviço Realizado)
   - **Pago** = `PAGA` (Pagamento Recebido) + `AGENDAMENTO_PAGO`
   *(Nota: `AGENDAMENTO_PAGO` aparece em dois filtros — é agendado E pago; `PAGA` não entra em Realizado. Implementar exatamente assim, como mapa de conjuntos em `src/domain/status.ts`.)*
3. Admin: filtros extras por funcionário e data específica.
4. Funcionário: query filtra no servidor pelas próprias ordens; botão "Realizado" direto no card (usa `avancarStatus`).
5. Seções/destaques **Atrasadas / Hoje / Próximos dias** + badge hoje/atrasada também na lista de ordens (fecha RF-OS-18).

**Critérios de aceite e testes:**
- Integração: funcionário jamais recebe ordens de terceiros (testar na query e na action de toggle).
- Agrupamento e destaques corretos com datas de ontem/hoje/amanhã.
- Fluxo do funcionário 100% utilizável no mobile (caso de uso de referência do RES-09).

**Depende de:** Etapa 10. **Bloqueios:** nenhum.

---

## Etapa 12 — Dashboard (RF-DSH)

**Objetivo:** visão gerencial por competência com drill-down.

**Requisitos cobertos:** RF-DSH-01..07; RN-15 (KPIs); RNF-DES-02.

**Leitura obrigatória:**
- `ERS.md` RF-DSH-01..07 (linhas 304–310).
- `SDD.md` §9.4 (linhas 623–627) e §7.5 cálculos (linhas 507–517) — fórmulas exatas dos KPIs.
- `ERS.md` CU-07 (linhas 514–517).

**Tarefas:**
1. Página `/dashboard` (admin): seletor de competência (mês/ano) governando tudo — competência definida por **`Ordem.data`** (RN-20), via `competenciaDe()` do domínio.
2. KPIs via `groupBy`/`aggregate` no banco: Agendadas, Pendente de Execução (`AGENDAMENTO_PAGO`), Pendente de Pagamento (`REALIZADA`), Faturamento usando **`STATUS_FATURAMENTO` importado de `src/domain/faturamento.ts`** (RN-19) — nunca redeclarar a lista de status na tela.
3. KPI cards clicáveis → drill-down filtrando a lista abaixo por status.
4. Lista do mês paginada (10/página) com ordenação definida: sem filtro, pendentes primeiro por data/hora, demais por número desc (RF-DSH-04 — Essencial).
5. Atalhos rápidos: Nova Ordem, Novo Cliente, Ver Agenda de Hoje (RF-DSH-06).
6. RF-DSH-07 (decisão #6 fechada): **reproduzir exatamente os contadores do protótipo aprovado — nada além.** Não inventar métricas novas.

**Critérios de aceite e testes:**
- Integração: KPIs batem com dados de teste conhecidos; agregação no banco (sem carregar todas as linhas); drill-down correto.
- Faturamento do Dashboard usa a constante do domínio (verificável por import — sem lista de status hardcoded na tela).

**Depende de:** Etapa 10. **Bloqueios:** nenhum (decisão #6 fechada).

---

## Etapa 13 — Relatórios + complementos de Clientes

**Objetivo:** módulo de relatórios e os itens de Clientes que dependiam de OS.

**Requisitos cobertos:** RF-REL-01..06, **RF-REL-08 (novo, v2.2)** (RF-REL-07 vai para a Etapa 14, junto do PDF); RF-CLI-08, RF-CLI-11, RF-CLI-13; RN-15, **RN-19, RN-20**.

**Leitura obrigatória:**
- `ERS.md` §3.8 RF-REL-01..08 (linhas 312–323 — atenção: RF-REL-08 está na linha 318, entre REL-02 e REL-03) e RF-CLI-08/11/13 (linhas 239, 242, 244).
- `ERS.md` **RN-19 (linha 365)** e **RN-20 (linha 366)**.
- `ERS.md` nota de micro-decisões de UI (linha 757) — três pontos em aberto, ver tarefa 9.
- `SDD.md` §9.5 (linhas 629–634) e §7.5 (linhas 507–517). *(**Atenção:** SDD §7.5/§9.5 dizem "apenas ordens PAGA" — **superado pela RN-19**; a base correta é `PAGA + AGENDAMENTO_PAGO`. Se o prompt de correção do SDD já tiver sido aplicado, esses trechos estarão corrigidos.)*
- `ERS.md` CU-08 e CU-09 (linhas 522–530).

> **⚠️ Não copiar a lógica de cálculo do protótipo.** RF-REL-01/02 foram rebaixados para *Protótipo (parcial)* na v2.2 justamente porque o cálculo do protótipo usava base errada. O **layout** da tela vale como referência; o **cálculo** vem exclusivamente de `src/domain/faturamento.ts`.

**Tarefas:**
1. Página `/relatorios` (admin): base de faturamento **`PAGA + AGENDAMENTO_PAGO`** importando `STATUS_FATURAMENTO` do domínio (RN-19 — mesma constante do Dashboard, nunca redeclarada); filtros combináveis (intervalo de meses, tipo de serviço, funcionário); período inicial **calculado dinamicamente** (últimos 6 meses até o mês atual — nunca hardcoded).
2. **Competência = `Ordem.data`** (RN-20 / RF-REL-08) em toda agregação temporal: intervalo de meses, receita por mês. `dataEmissao` não entra em nenhuma agregação; não existe data de pagamento.
3. Indicadores: faturamento total, quantidade de ordens na base de faturamento, receita por tipo de serviço (ranking desc), receita por mês em gráfico de barras em tela.
4. "Limpar filtros" limpa serviço e funcionário, **preserva o período** (RF-REL-05).
5. Visão de cancelamentos: taxa e comparativo agendadas × realizadas × canceladas (RF-REL-06).
6. `/clientes/[id]/historico`: histórico de ordens read-only (RF-CLI-11).
7. Inativar cliente com ordens agendadas → confirmação informa a quantidade e o impacto (RF-CLI-08).
8. Ordenação por coluna na tabela de clientes (RF-CLI-13).
9. **Micro-decisões de UI (ERS linha 757 — decidir com o usuário no início desta etapa; nenhuma bloqueia REL-01/02/08):** (a) sob filtro de tipo de serviço, o card "Ordens pagas" conta **ordens que contêm** o serviço ou **linhas** do serviço?; (b) o card "Tipos serviço" fica degenerado (sempre 1) sob filtro de serviço — manter ou trocar de métrica?; (c) o gráfico por mês preenche meses sem receita com zero ou os omite (como o protótipo)?

**Critérios de aceite e testes:**
- **Teste de paridade (critério do RF-REL-02):** para a mesma competência e sem filtros extras, o faturamento dos Relatórios **bate exatamente** com o do Dashboard. Divergência = defeito (RN-19). Automatizar como teste de integração.
- Ordem `AGENDAMENTO_PAGO` entra no faturamento; `REALIZADA` não.
- Teste da RN-20: ordem com `data` em junho e pagamento registrado em julho conta na competência de **junho** (o faturamento de mês fechado pode subir depois — comportamento correto e documentado).
- Agregações no banco; período dinâmico verificado com data mockada.

**Depende de:** Etapas 8 (domínio de faturamento) e 10 (e 12 para o teste de paridade). **Bloqueios:** nenhum.

---

## Etapa 14 — PDF da OS + envio por WhatsApp + impressão de relatórios

**Objetivo:** bloco de compartilhamento stateless — todo no cliente, sem persistência.

**Requisitos cobertos:** RF-OS-21, 22, 23, 24 (critério de aceite do bloco); RF-REL-07; RN-17; RES-07; RIS-04, RIS-05; RF-UX-08 (marca no PDF).

**Leitura obrigatória:**
- `ERS.md` RF-OS-21..24 + nota (linhas 281–286) — **trecho principal**.
- `ERS.md` RN-17 (linha 362), RES-07 (linha 173), RIS-04/05 (linhas 393–394).
- `ERS.md` CU-11 (linhas 534–540) — fluxo principal, alternativo (desktop) e exceções.
- `ERS.md` definições de deep link e Web Share API (linhas 87–88).

**Tarefas:**
1. Geração de PDF **no cliente com `@react-pdf/renderer`** (decisão #7 fechada), com **import lazy** (dynamic import no acionamento — não entra no bundle inicial): geração **somente** no clique, em memória (Blob), descartada após o uso — nada em disco/banco, sem histórico de envios.
2. Conteúdo do PDF (RF-OS-22): número da OS, marca parametrizável (`EMPRESA_NOME`), dados do cliente (nome, telefone, endereço), data/hora, funcionário, itens (tipo, descrição, qtd, valor unitário, subtotal), total, forma de pagamento (se houver), status, observações; `R$ 0.000,00` e `DD/MM/AAAA` (reusar `lib/format.ts`).
3. **Preview obrigatório antes do envio:** modal/Sheet exibindo **o próprio Blob gerado** via `URL.createObjectURL` em `<iframe>`/`<embed>` — o arquivo previsualizado é **byte a byte** o mesmo que será compartilhado (requisito do cliente: fidelidade total entre preview e PDF entregue no WhatsApp). Nunca renderizar um "preview HTML" separado do PDF real. Revogar o object URL ao fechar (stateless).
4. Ação "Enviar por WhatsApp" no detalhe da OS: abre o preview → confirmar → Web Share API (`navigator.canShare` com o `File` do blob); fallback desktop: baixar o PDF + abrir `wa.me/<telefone normalizado>` com texto pré-preenchido (resumo da OS).
5. Exceções: cliente sem telefone → sem deep link, mas preview/download/compartilhamento continuam; cancelamento do share ou do preview → nenhum efeito colateral.
6. RF-REL-07: impressão/exportação PDF dos relatórios com CSS de impressão dedicado (aqui a impressão CSS é aceitável — não há requisito de envio nem de fidelidade byte a byte).

**Critérios de aceite e testes (RF-OS-24 é o critério do bloco):**
- O blob mostrado no preview é o mesmo objeto enviado ao `navigator.share`/download (garantia de fidelidade).
- Auditoria: nenhuma escrita de arquivo/registro decorrente do envio; nenhuma rota de servidor envolvida na geração; object URLs revogados.
- Testar em mobile (Web Share) e desktop (fallback), abrindo o PDF recebido no WhatsApp para conferir layout.
- Telefone normalizado corretamente para o formato `wa.me` (DDI 55 + DDD + número, sem máscara).
- Bundle: a lib de PDF não carrega antes do primeiro acionamento (verificar no build/network).

**Depende de:** Etapas 10 e 3 (PT-09). **Bloqueios:** nenhum (decisão #7 fechada).

---

## Etapa 15 — Polimento UX + seed de demonstração (PT-08)

**Objetivo:** fechar os requisitos transversais restantes e o seed completo.

**Requisitos cobertos:** RF-UX-04, 05, 07, 10, 11 (varredura final); RF-AUT-06; PT-08; RNF-USA-03/04; RNF-OBS-02.

**Leitura obrigatória:**
- `ERS.md` RF-UX-04/05/07/10/11 (linhas 331–338) e RF-AUT-06 (linha 202).
- `ERS.md` PT-08 (linha 625).
- `SDD.md` §13.5 item Seed (linha 814).

**Tarefas:**
1. Varredura: asterisco em obrigatórios consistente; mensagens orientadoras em toda lista vazia; distinção visual ativo/inativo em todas as listas; mensagens de erro amigáveis sem detalhes internos.
2. Badges de contagem nas abas (RF-UX-07 — Baixa; opcional, decidir com o cliente).
3. Credenciais de demo na tela de login **apenas** em ambiente demo, nunca em produção (RF-AUT-06).
4. Seed de demonstração completo (PT-08/RF-UX-10): ordens em **todos** os status, ≥1 cliente inativo, ≥1 ordem cancelada, variedade de serviços e datas (passado/hoje/futuro para exercitar destaques).

**Critérios de aceite:** seed roda por comando no container e permite demonstrar todos os fluxos (CU-01..CU-11) sem cadastro manual.

**Depende de:** Etapas 11–14. **Bloqueios:** nenhum.

---

## Etapa 16 — Pacote de entrega à infra (PT-10) e observabilidade

**Objetivo:** repositório pronto para a infra hospedar sem nenhum passo além das variáveis de ambiente.

**Requisitos cobertos:** PT-10; RNF-POR-05/06; RNF-CON-02; RNF-OBS-01/02; RIC-01 (documentado); RNF-SEG-05.

**Leitura obrigatória:**
- `ERS.md` PT-10 (linha 627) e RNF-POR-05/06 (linhas 462–463).
- `SDD.md` §13.3–13.5 completo (linhas 779–814) — **trecho principal**: healthcheck, graceful shutdown, logs, backups, README de deploy.

**Tarefas:**
1. Rota `/api/health` (app + conexão com banco) declarada no `HEALTHCHECK` do Dockerfile e no compose.
2. Graceful shutdown em `SIGTERM` (fecha conexões + Prisma Client).
3. Validação de env por schema no boot com falha clara se faltar variável (revisar/fechar o iniciado na Etapa 3).
4. Log estruturado de erros do servidor em stdout/stderr (sem arquivo no container).
5. Script/rotina de backup do volume `pgdata` com retenção + **restore testado** (não só documentado).
6. `README` de deploy: subir, atualizar versão, aplicar migrations, backup e restore; nota sobre proxy reverso + HTTPS obrigatório.

**Critérios de aceite:** simulação de deploy limpo em máquina "virgem" (só Docker): clone → `.env` → `docker compose up` → sistema no ar, healthcheck verde; kill com `SIGTERM` encerra limpo; backup+restore validados.

**Depende de:** todas as anteriores (é a etapa de fechamento). **Bloqueios:** nenhum.

---

## Etapa 17 (Fase 4 — opcional/posterior) — ViaCEP e publicação

**Requisitos cobertos:** RF-CLI-14; RIS-01; publicação (SDD §14 Fase 4).
**Leitura:** `ERS.md` RF-CLI-14 (linha 245) e RIS-01 (linha 390); `SDD.md` §13.5 (linhas 808–813) e §14 (linhas 818–831).
**Tarefas:** autocompletar endereço por CEP via ViaCEP no formulário de cliente (com fallback manual se o serviço falhar); publicação em produção atrás de proxy com SSL; ativação dos backups automatizados no ambiente real.

---

## Mapa de dependências (resumo)

```
E0 (decisões) ✅ concluída — registro vinculante para todas as etapas
E1 Bootstrap ──> E2 Banco ──> E3 Fundações ──> E4 Auth ──> E4B Testes/CI
                                                  │
                                                  v
                                             E5 Shell UI ──> E6 Usuários ──> E7 Clientes
                                                                                │
                                    E8 Domínio OS <─────────────────────────────┤
                                         │                                      │
                                         v                                      v
                                    E9 Criação OS ──> E10 Lista/Detalhe/Status OS
                                                            │
                              ┌─────────────┬───────────────┼───────────────┐
                              v             v               v               v
                        E11 Agenda    E12 Dashboard   E13 Relatórios   E14 PDF/WhatsApp
                              └─────────────┴───────┬───────┴───────────────┘
                                                    v
                                        E15 Polimento + Seed
                                                    v
                                        E16 Entrega à infra (PT-10)
                                                    v
                                        E17 Fase 4 (ViaCEP + publicação)
```

## Cobertura de requisitos (checagem — base ERS v2.2, 93 RFs)

- **Essenciais (26):** E4 (AUT-01..04, 08..11), E7 (CLI-01/02/03/06), E2 (SRV-01/02), E8–E10 (OS-01/03/04/05/09/10), E11 (AGD-05), E12 (DSH-04), E3+E5 (UX-01/02/06), E14 (OS-24 como critério de aceite). ✔
- **Altas (45):** distribuídas em E4 (AUT-12), E6 (USR-01..07), E7/E13 (CLI), E9–E11 (OS/AGD), E12 (DSH-01..03), E13 (REL-01..04 + **REL-08**, novo na v2.2), E14 (OS-21..23), E3/E5/E15 (UX-03/08/09). ✔
- **Médias (17) e Baixas (5):** E10/E13/E15/E17. **RF-SRV-03 excluído definitivamente do produto** (decisão #1 — catálogo gerido apenas via seed/SQL). RF-AUT-07 ("esqueci minha senha") permanece como evolução futura fora das etapas core (adicionar etapa própria se aprovado).
- **Regras novas da v2.2:** RN-19 (base única de faturamento) implementada em E8 e consumida em E12/E13 com teste de paridade automatizado; RN-20 (competência = `Ordem.data`) implementada em E8 e verificada em E12/E13.
- **Nota sobre o SDD:** o `SDD.md` v1.1 precisa de correção para a v2.2 do ERS — usar o **prompt de correção do SDD** entregue junto deste roadmap antes de chegar à E8. Questões #8 e #9 do ERS §10.3 já constam como **decididas** na v2.2 (linhas 754–755); restam apenas as três micro-decisões de UI da linha 757, tratadas na tarefa 9 da E13.