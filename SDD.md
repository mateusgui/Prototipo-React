# SDD — Software Design Document

## Sistema de Gestão para Lavanderia ("Sistema de Lavanderia")

> **Status:** Especificação para construção do software de produção a partir do protótipo funcional.
> **Versão do documento:** 1.0
> **Data:** Julho de 2026
> **Autor:** Equipe de desenvolvimento

---

## 1. Introdução

### 1.1 Propósito

Este documento (SDD) especifica o design técnico do **Sistema de Gestão para Lavanderia**, uma aplicação web de gestão operacional para lavanderias/higienizadoras de estofados. O sistema centraliza o cadastro de clientes, o controle de ordens de serviço (OS), o acompanhamento da agenda de execução e a geração de relatórios de faturamento.

Atualmente existe um **protótipo funcional** de single-page (React + Vite), com todos os dados em memória (`src/App.jsx`, ~2000 linhas). Este SDD descreve **como reconstruir o sistema de forma robusta e escalável** sobre a stack definida na Seção 3, preservando todos os fluxos de negócio validados no protótipo e adicionando persistência real, segurança, tipagem ponta-a-ponta e uma arquitetura de camadas bem definida.

### 1.2 Público-alvo do documento

- Desenvolvedores que implementarão o software de produção.
- Revisores técnicos e responsáveis por QA.
- Stakeholders que precisam validar escopo funcional versus proposta comercial.

### 1.3 Documentos relacionados

| Documento | Conteúdo |
|---|---|
| `proposta.md` | Proposta técnica (escopo funcional resumido). |
| `proposta_completa.md` | Proposta técnica e comercial completa (escopo, fases, exclusões). |
| `relatorio.md` / `relatorio_final.md` | Relatórios de desenvolvimento do protótipo. |
| `CLAUDE.md` | Documentação de arquitetura do protótipo atual (referência de comportamento). |
| `src/App.jsx` | Fonte de verdade do comportamento atual (protótipo). |

---

## 2. Visão geral do produto

### 2.1 Problema de negócio

Lavanderias controlam atendimentos por cadernos, planilhas e grupos de WhatsApp. Isso gera perda de informação, dificuldade de acompanhamento da agenda de execução em campo e ausência de visão gerencial (faturamento, pendências). O sistema digitaliza esse fluxo com um produto simples, responsivo e acessível por navegador, sem instalação.

### 2.2 Perfis de usuário

| Perfil | Acesso |
|---|---|
| **Administrador** | Todos os módulos: Dashboard, Clientes, Ordens, Agenda, Relatórios e gestão de Usuários. |
| **Funcionário** | Apenas a Agenda, restrita às ordens atribuídas a ele; pode marcar/desmarcar "Serviço Realizado". |

### 2.3 Módulos funcionais

1. **Autenticação e controle de acesso** — login, sessões, RBAC (dois papéis).
2. **Gestão de usuários** — CRUD de usuários, ativação/inativação, reset de senha (admin).
3. **Clientes** — cadastro completo com endereço, validação de CPF, soft delete, histórico de OS.
4. **Catálogo de serviços** — lista de tipos de serviço para seleção rápida na OS.
5. **Ordens de serviço** — criação, edição, cancelamento/reativação, fluxo de status, itens de serviço, pagamento.
6. **Agenda** — visão operacional por dia, filtros por status/funcionário/data.
7. **Dashboard** — KPIs por competência (mês/ano) com drill-down.
8. **Relatórios** — faturamento por período, por tipo de serviço e por mês.

### 2.4 Escopo excluído (não faz parte do produto)

Conforme `proposta_completa.md`:

1. Integração fiscal (NFS-e) — a OS é documento interno, sem validade fiscal.
2. Gateway de pagamento integrado — o sistema **registra** a forma de pagamento, não processa cobrança.
3. Aplicativo nativo (iOS/Android) — apenas web responsivo.
4. Envio automático de mensagens (WhatsApp/SMS/e-mail).
5. Anexo de fotos (antes/depois).
6. Multi-empresa / multi-filial — uma única unidade.
7. Controle de estoque de insumos.
8. Relatórios avançados / exportação (PDF/Excel/BI) — relatórios são exibidos em tela.
9. Precificação automática — o valor é sempre informado manualmente por item de serviço.

> A **consulta automática de CEP** (ViaCEP) está prevista para a Fase 4 do produto de produção (ver `proposta_completa.md`, Seção 2.2) — no protótipo o endereço é manual.

---

## 3. Stack tecnológica

| Camada | Tecnologia | Papel |
|---|---|---|
| Linguagem | **TypeScript** (modo `strict`) | Linguagem única do banco ao botão. |
| Framework full-stack | **Next.js 15** (App Router) | Front-end React + back-end no mesmo repositório. |
| ORM / Modelo de dados | **Prisma + PostgreSQL** | Schema declarativo e queries tipadas. |
| Validação | **Zod** | Fonte única de verdade das regras de dados (compartilhada client/server). |
| Formulários | **react-hook-form** + `@hookform/resolvers` | Forms tipados integrados ao Zod. |
| Estilo | **Tailwind CSS** | CSS utilitário no próprio JSX. |
| Componentes UI | **shadcn/ui** | Componentes copiados como código-fonte no repositório. |
| Autenticação | **Auth.js (NextAuth v5)** — Credentials Provider | Sessão baseada em JWT/cookie; RBAC. |
| Hash de senha | **bcrypt** (ou `argon2`) | Nunca armazenar senha em texto puro. |
| Infra | **Docker** + Postgres gerenciado / VPS | Empacotamento padronizado, pronto para escalar. |

### 3.1 Princípios de arquitetura

- **Tipagem ponta-a-ponta:** o mesmo tipo derivado de um `schema` Zod flui do formulário → validação → Server Action → Prisma. Sem `any`.
- **Fonte única de verdade de validação:** todas as regras de campo residem em schemas Zod reutilizados no cliente (react-hook-form resolver) **e** no servidor (Server Actions). Nunca confiar apenas na validação do cliente.
- **Server-first:** por padrão, componentes são Server Components; interatividade é isolada em Client Components (`"use client"`) o menor possível.
- **Mutations via Server Actions:** operações de escrita usam Server Actions tipadas; leituras de página usam data fetching no servidor.
- **Camada de serviço fina:** lógica de negócio (transições de status, cálculos) isolada em módulos puros e testáveis, independentes de React e do Prisma quando possível.

---

## 4. Arquitetura da aplicação

### 4.1 Camadas

```
┌─────────────────────────────────────────────────────────┐
│  Apresentação (React Server + Client Components)          │
│  - Páginas App Router, componentes shadcn/ui, Tailwind    │
│  - Formulários com react-hook-form + zodResolver          │
├─────────────────────────────────────────────────────────┤
│  Aplicação (Server Actions + Route Handlers)              │
│  - Autenticação/autorização (guardas de sessão + papel)   │
│  - Validação Zod (re-validação no servidor)               │
│  - Orquestração de casos de uso                           │
├─────────────────────────────────────────────────────────┤
│  Domínio (lógica de negócio pura)                         │
│  - Máquina de status da OS                                │
│  - Cálculos (total da OS, KPIs, agregações de relatório)  │
│  - Regras de validação de domínio (CPF, horário comercial)│
├─────────────────────────────────────────────────────────┤
│  Dados (Prisma Client + PostgreSQL)                       │
│  - Repositórios/queries tipadas                           │
│  - Migrations versionadas                                 │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Estrutura de pastas proposta

```
/
├── prisma/
│   ├── schema.prisma          # modelo de dados (ver Seção 5)
│   ├── migrations/            # migrations versionadas
│   └── seed.ts                # dados de seed (admin inicial, serviços)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (app)/             # layout autenticado (topbar + bottom-nav)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/historico/page.tsx
│   │   │   ├── ordens/page.tsx
│   │   │   ├── agenda/page.tsx
│   │   │   ├── relatorios/page.tsx
│   │   │   └── usuarios/page.tsx      # admin only
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   └── layout.tsx         # root layout, providers
│   ├── components/
│   │   ├── ui/                # shadcn/ui (Button, Dialog, Input, Select…)
│   │   ├── forms/             # ClienteForm, OrdemForm, UsuarioForm…
│   │   ├── nav/               # Topbar, BottomNav, NavIcon
│   │   └── shared/            # Badge de status, Pagination, ClienteAutocomplete…
│   ├── server/
│   │   ├── actions/           # Server Actions (mutations)
│   │   │   ├── clientes.ts
│   │   │   ├── ordens.ts
│   │   │   └── usuarios.ts
│   │   ├── queries/           # funções de leitura tipadas
│   │   └── auth.ts            # config Auth.js, guardas
│   ├── domain/
│   │   ├── status.ts          # máquina de status da OS
│   │   ├── pricing.ts         # totalOrdem, agregações
│   │   └── cpf.ts             # validarCPF, fmtCPF
│   ├── schemas/               # schemas Zod (fonte única de validação)
│   │   ├── cliente.ts
│   │   ├── ordem.ts
│   │   └── usuario.ts
│   ├── lib/
│   │   ├── prisma.ts          # singleton do Prisma Client
│   │   ├── format.ts          # fmtData, fmtTelefone, fmtMes…
│   │   └── utils.ts           # cn() (Tailwind merge) etc.
│   └── types/
├── docker-compose.yml
├── Dockerfile
└── tailwind.config.ts
```

### 4.3 Rotas e navegação

O protótipo usa uma única string `aba` para renderizar abas. Na produção isso vira **rotas reais** do App Router (URLs compartilháveis, back/forward do navegador, deep-linking):

| Rota | Módulo | Acesso |
|---|---|---|
| `/login` | Autenticação | Público |
| `/dashboard` | Dashboard | admin |
| `/clientes` | Clientes | admin |
| `/clientes/[id]/historico` | Histórico de OS do cliente | admin |
| `/ordens` | Ordens de serviço | admin |
| `/agenda` | Agenda | admin, funcionário |
| `/relatorios` | Relatórios | admin |
| `/usuarios` | Gestão de usuários | admin |

- **Desktop (`> 700px`):** topbar horizontal com as abas do papel.
- **Mobile (`≤ 700px`):** bottom-nav fixa + botão "Opções" (acesso a Usuários, reset da própria senha, sair).
- Guarda de rota via `middleware.ts` + verificação de papel no layout `(app)`. Funcionário que acessar rota de admin é redirecionado para `/agenda`.

---

## 5. Modelo de dados

### 5.1 Diagrama de entidades

```
Usuario 1───* Ordem *───1 Cliente
                 │
                 *
              ItemServico
Servico (catálogo) ·······> ItemServico.nome (snapshot)
```

### 5.2 Schema Prisma (proposto)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Perfil {
  ADMIN
  FUNCIONARIO
}

enum StatusOrdem {
  AGENDADA
  REALIZADA
  AGENDAMENTO_PAGO
  PAGA
  CANCELADA
}

enum FormaPagamento {
  PIX
  DEBITO
  CREDITO_A_VISTA
  CREDITO_1X
  CREDITO_2X
  CREDITO_3X
  CREDITO_4X
  CREDITO_5X
  CREDITO_6X
}

model Usuario {
  id        String   @id @default(cuid())
  nome      String
  email     String   @unique
  senhaHash String
  perfil    Perfil   @default(FUNCIONARIO)
  ativo     Boolean  @default(true)
  ordens    Ordem[]  @relation("FuncionarioResponsavel")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Cliente {
  id          String   @id @default(cuid())
  nome        String
  sobrenome   String?
  cpf         String   @unique
  telefone    String
  email       String?
  // endereço
  rua         String
  numero      String
  complemento String?
  bairro      String
  cidade      String
  estado      String   // UF, 2 letras
  cep         String?
  ativo       Boolean  @default(true)   // soft delete
  ordens      Ordem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([nome])
  @@index([ativo])
}

model Servico {
  id     String  @id @default(cuid())
  nome   String  @unique
  ativo  Boolean @default(true)
}

model Ordem {
  id             String         @id @default(cuid())
  numero         Int            @unique          // sequencial de OS
  cliente        Cliente        @relation(fields: [clienteId], references: [id])
  clienteId      String
  funcionario    Usuario        @relation("FuncionarioResponsavel", fields: [funcionarioId], references: [id])
  funcionarioId  String
  dataEmissao    DateTime       @default(now())
  data           DateTime       // data do serviço (agendamento)
  hora           String         // "HH:mm" (horário comercial 08–18)
  status         StatusOrdem    @default(AGENDADA)
  endereco       String         // snapshot do endereço no momento da OS
  obs            String?
  formaPagamento FormaPagamento?                 // preenchida ao registrar pagamento
  itens          ItemServico[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status])
  @@index([data])
  @@index([clienteId])
  @@index([funcionarioId])
}

model ItemServico {
  id        String  @id @default(cuid())
  ordem     Ordem   @relation(fields: [ordemId], references: [id], onDelete: Cascade)
  ordemId   String
  nome      String  // snapshot do tipo de serviço (permite nome customizado)
  descricao String? // "Descrição do Objeto" (ex.: "sofá cinza, 3 lugares")
  qtd       Int     @default(1)
  valor     Decimal @db.Decimal(10, 2)  // valor unitário, informado manualmente
}
```

### 5.3 Decisões de modelagem

- **IDs `cuid()`** em vez de auto-increment inteiro para evitar enumeração e facilitar geração no cliente/distribuição. Exceção: `Ordem.numero` é um inteiro sequencial **de negócio** (número de OS visível ao usuário), gerado de forma transacional.
- **`Ordem.numero` sequencial:** no protótipo começa em 132 (`proximoNumeroOS`). Na produção, gerado em transação (`SELECT max(numero) ... FOR UPDATE` ou tabela de contador) para evitar corridas. Considerar tabela `Contador` dedicada.
- **Snapshot de dados na OS:** `endereco` e `ItemServico.nome`/`valor` são gravados na OS no momento da criação. Alterar o cadastro do cliente ou o catálogo **não** deve reescrever histórico de ordens já emitidas (integridade do histórico e do relatório de faturamento).
- **`Decimal` para valores monetários** — nunca `float`. Cálculos com `Decimal` ou inteiro em centavos.
- **Soft delete** em `Cliente.ativo` e `Usuario.ativo` (preserva histórico). Nunca `DELETE` físico de clientes/usuários com ordens vinculadas.
- **`Servico` como tabela** (não const): permite ativar/desativar itens do catálogo pela administração no futuro, mantendo a seleção rápida. O `ItemServico.nome` guarda o snapshot para suportar nome customizado e imutabilidade histórica.
- **Índices** nos campos usados por filtros/ordenações frequentes (status, data, nome do cliente).

### 5.4 Mapa protótipo → produção

| Protótipo (`App.jsx`) | Produção |
|---|---|
| `USERS_INICIAL` (const + state) | Tabela `Usuario` + seed |
| `clientes` (useState) | Tabela `Cliente` |
| `servicos` (const) | Tabela `Servico` (seed com os 4 tipos) |
| `ordens` (useState) | Tabela `Ordem` + `ItemServico` |
| `proximoNumeroOS = 132` | Contador transacional de `Ordem.numero` |
| Senha em texto (`"admin123"`) | `senhaHash` com bcrypt |
| Reset em refresh (in-memory) | Persistência PostgreSQL |

---

## 6. Schemas de validação (Zod)

Os schemas Zod são a **fonte única de verdade** das regras de dados. Cada schema é usado no `zodResolver` do formulário (cliente) e re-executado na Server Action (servidor).

### 6.1 Cliente

```ts
// src/schemas/cliente.ts
import { z } from "zod";
import { validarCPF } from "@/domain/cpf";

export const clienteSchema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  sobrenome: z.string().optional(),
  cpf: z.string().refine(validarCPF, "CPF inválido. Verifique os dígitos."),
  telefone: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  rua: z.string().min(1, "Obrigatório"),
  numero: z.string().min(1, "Obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Obrigatório"),
  cidade: z.string().min(1, "Obrigatório"),
  estado: z.string().length(2, "UF inválida"),
  cep: z.string().optional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
```

Regra adicional de unicidade de CPF (não expressável só no schema): verificada na Server Action contra o banco (`@@unique(cpf)` + checagem amigável antes de gravar → "Este CPF já está registrado.").

### 6.2 Ordem de serviço

```ts
// src/schemas/ordem.ts
import { z } from "zod";

export const itemServicoSchema = z.object({
  nome: z.string().min(1, "Selecione ou informe o serviço"),
  descricao: z.string().optional(),
  qtd: z.coerce.number().int().min(1),
  valor: z.coerce.number().nonnegative("Valor inválido"),
});

export const ordemSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente"),
  funcionarioId: z.string().min(1, "Selecione um funcionário"),
  data: z.string().refine((d) => new Date(d) >= hoje(), "Data deve ser futura"),
  hora: z.string().refine(emHorarioComercial, "Horário comercial: 08h–18h"),
  obs: z.string().optional(),
  formaPagamento: z.string().optional(),
  itens: z.array(itemServicoSchema).min(1, "Adicione ao menos um serviço"),
});

export type OrdemInput = z.infer<typeof ordemSchema>;
```

### 6.3 Usuário

```ts
// src/schemas/usuario.ts
export const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório."),
  email: z.string().trim().email("E-mail inválido."),
  senha: z.string().trim().min(6, "Mínimo de 6 caracteres."),
  perfil: z.enum(["ADMIN", "FUNCIONARIO"]),
});

export const resetSenhaSchema = z.object({
  nova: z.string().trim().min(6, "Mínimo de 6 caracteres."),
});
```

Unicidade de e-mail verificada contra o banco na Server Action ("E-mail já cadastrado.").

---

## 7. Regras de negócio

### 7.1 Máquina de status da OS (bidirecional)

Transições são toggles bidirecionais acionados por dois botões — **Realizado** e **Pago** — conforme `calcularNovoStatus(currentStatus, botao)` do protótipo:

**Botão "Realizado":**
- `AGENDADA` ↔ `REALIZADA`
- `AGENDAMENTO_PAGO` ↔ `PAGA`

**Botão "Pago":**
- `AGENDADA` ↔ `AGENDAMENTO_PAGO`
- `REALIZADA` ↔ `PAGA`

**Cancelamento/reativação:**
- `AGENDADA` → `CANCELADA` (cancelamento só a partir de Agendada)
- `CANCELADA` → `AGENDADA` (reativação)

Diagrama:

```
        ┌───────────── Pago ─────────────┐
        ▼                                 ▲
   AGENDAMENTO_PAGO                    AGENDADA ──cancelar──> CANCELADA
        ▲                                 ▲                      │
     Realizado                         Realizado             reativar
        ▼                                 ▼                      │
      PAGA <────── Pago ──────────── REALIZADA <────────────────┘ (para AGENDADA)
```

> Implementação: função pura `proximoStatus(atual, botao): StatusOrdem` em `src/domain/status.ts`, com testes unitários cobrindo cada transição. A Server Action valida que a transição solicitada é legal antes de gravar (nunca confiar no cliente).

### 7.2 Registro de pagamento

Ao mover para um status pago (`AGENDADA → AGENDAMENTO_PAGO` ou `REALIZADA → PAGA`), o sistema **exige a seleção da forma de pagamento** antes de confirmar (modal `confirmarAvanco` no protótipo). A Server Action rejeita a transição de pagamento sem `formaPagamento` definida.

### 7.3 Edição de OS

Edição de OS permitida **apenas** nos status `AGENDADA` e `AGENDAMENTO_PAGO`. Nos demais status a OS é somente leitura (exceto toggles de status e cancelamento conforme regras acima). Regra aplicada tanto na UI (esconder ação) quanto na Server Action (guarda).

### 7.4 Validações de domínio

| Regra | Descrição |
|---|---|
| **CPF** | Validação de dígitos verificadores (`validarCPF`) + máscara `###.###.###-##`. Único por cliente. |
| **CPF duplicado** | Bloqueado no cadastro/edição ("Este CPF já está registrado."). |
| **Telefone** | Máscara `(00) 00000-0000` (celular) ou `(00) 0000-0000` (fixo). |
| **Horário comercial** | Agendamentos restritos a 08h–18h. |
| **Data futura** | Data do serviço deve ser hoje ou futura na criação. |
| **Item de serviço** | Ao menos 1 item por OS; `qtd ≥ 1`; `valor` manual por item. |
| **E-mail de usuário** | Único; senha mínimo 6 caracteres. |
| **Cliente/usuário inativo** | Soft delete; não pode logar (usuário) nem ser selecionado em nova OS (cliente). |

### 7.5 Cálculos

- **Total da OS:** `Σ (qtd × valor)` sobre os itens (`totalOrdem`).
- **KPIs do Dashboard** (por mês selecionado `dashMes`):
  - `agendadas` = ordens com status `AGENDADA`.
  - `pendenteExecucao` = `AGENDAMENTO_PAGO`.
  - `pendentePagamento` = `REALIZADA`.
  - `faturamento` = total de ordens `PAGA` + `AGENDAMENTO_PAGO`.
- **Relatórios:** consideram apenas ordens `PAGA` no intervalo de meses, filtráveis por serviço e funcionário. Receita por tipo de serviço (ranking desc) e por mês (gráfico de barras).

> Todos os cálculos devem preferencialmente ser **agregados no banco** (Prisma `groupBy`/`aggregate`) em vez de carregar todas as linhas na memória, para escalar com o volume.

---

## 8. Autenticação e autorização

### 8.1 Autenticação

- **Auth.js (NextAuth v5)** com **Credentials Provider** (e-mail + senha).
- Senha verificada contra `senhaHash` (bcrypt). Bloqueio de login para `ativo === false`.
- Sessão via cookie httpOnly + JWT; expiração e refresh configuráveis.
- `middleware.ts` protege todas as rotas do grupo `(app)`; rota `/login` é pública.

### 8.2 Autorização (RBAC)

- Papel (`perfil`) embutido na sessão.
- Guardas em três níveis:
  1. **Middleware/layout:** redireciona funcionário para `/agenda` ao tentar rota de admin.
  2. **Server Actions:** cada action verifica sessão + papel antes de executar (defesa no servidor — obrigatória, não confiar na UI).
  3. **UI:** esconde abas/ações fora do papel (topbar/bottom-nav derivadas do papel).
- **Funcionário na Agenda:** queries filtram `funcionarioId === session.user.id` no servidor. Nunca retornar ordens de outros funcionários ao perfil funcionário.

### 8.3 Gestão de senha

- Admin: cria usuário, edita nome/e-mail, ativa/inativa, reseta senha de outro usuário.
- Qualquer usuário autenticado: redefine a própria senha.
- Toda gravação de senha passa por hash. Nunca retornar `senhaHash` ao cliente.

---

## 9. Especificação dos módulos

### 9.1 Clientes

- **Listagem** paginada (10/página) com busca por nome; exibe cards no mobile / tabela no desktop.
- **Cadastro/edição** com todos os campos de endereço; máscaras de CPF e telefone; validação Zod.
- **Soft delete** (inativar) e reativar; cliente inativo não aparece na seleção de nova OS.
- **Histórico** de ordens do cliente (read-only) — rota `/clientes/[id]/historico`.
- **Futuro (Fase 4):** autocompletar endereço por CEP (ViaCEP) ao digitar o CEP.

### 9.2 Ordens de serviço

- **Criação:** número sequencial automático; seleção de cliente por **autocomplete** (ao focar sem texto mostra os 5 últimos por id desc; ao digitar busca clientes ativos, máx. 10); seleção de funcionário; data/hora com validações; múltiplos itens de serviço; observações; forma de pagamento.
- **Listagem** paginada com filtros combináveis: nome do cliente, data início, data fim.
- **Detalhe:** grid read-only + itens + botão Google Maps + ações (Editar, Cancelar, Fechar). Modo de edição inline para status `AGENDADA`/`AGENDAMENTO_PAGO`.
- **Google Maps:** botão que abre URL de mapa construída a partir do endereço da OS + cidade/estado do cliente (`mapsUrl`).
- **Itens de serviço:** cada um com tipo (catálogo ou nome customizado), descrição do objeto, quantidade e valor unitário manual.

### 9.3 Agenda

- Ordens ordenadas por data+hora, agrupadas por dia com separadores ("3 de Junho de 2026").
- Filtro por status operacional: **Agendado** / **Realizado** / **Pago** (cada um mapeia para conjunto de status).
- Admin: filtros extras por funcionário e por data específica.
- Funcionário: vê apenas as próprias ordens; botão "Realizado" no card para toggle direto.
- Paginação 10/página; no mobile, navegação fixa acima da bottom-nav.

### 9.4 Dashboard (admin)

- Seletor de competência (mês/ano) `dashMes` governa todos os dados.
- KPIs clicáveis com drill-down (filtram a lista abaixo por status).
- Lista de ordens do mês paginada (10/página); sem filtro, pendentes (agendada + agendamento_pago) primeiro por data/hora, demais por número desc.

### 9.5 Relatórios (admin)

- Filtros: intervalo de meses, tipo de serviço, funcionário.
- Indicadores: faturamento total, quantidade de ordens pagas, variedade de tipos de serviço.
- Receita por tipo de serviço (ranking desc) e por mês (gráfico de barras em tela).
- Sem exportação (fora de escopo).

### 9.6 Usuários (admin)

- Listagem de usuários como cards com badge de papel.
- Detalhe → inativar/reativar, editar nome/e-mail, resetar senha.
- Criação de novo usuário (nome, e-mail, senha ≥ 6, papel).

---

## 10. Interface e experiência

### 10.1 Design system

- **shadcn/ui** como base de componentes (Button, Dialog, Input, Select, Table, Card, Badge, Toast, Pagination…). Componentes copiados como código-fonte, customizáveis via Tailwind.
- **Tailwind CSS** substitui a string de CSS injetada do protótipo. Tokens de tema (cores de status) centralizados no `tailwind.config.ts`.

### 10.2 Mapa de cores de status (do protótipo)

| Status | Label | Cor | Fundo |
|---|---|---|---|
| `AGENDADA` | Agendada | `#1a6fbb` | `#e8f3fc` |
| `REALIZADA` | Serviço Realizado | `#1f7a3e` | `#e6f4ec` |
| `AGENDAMENTO_PAGO` | Agendamento Pago | `#b85e1a` | `#fdf0e6` |
| `PAGA` | Pagamento Recebido | `#5b3fa6` | `#eeebfb` |
| `CANCELADA` | Cancelada | `#b83232` | `#fdeaea` |

Componente `<StatusBadge status={...} />` (equivalente ao `Badge` do protótipo).

### 10.3 Responsividade

- Breakpoint **700px**: desktop (`> 700px`) mostra topbar + tabelas; mobile (`≤ 700px`) mostra bottom-nav fixa + listas em card.
- Modais: centralizados no desktop; slide-up a partir do rodapé no mobile (padrão `Dialog`/`Sheet` do shadcn).
- Paginação fixa acima da bottom-nav no mobile (`bottom: calc(60px + safe-area-inset)`), com padding no container para não obstruir conteúdo.

### 10.4 Formulários

- **react-hook-form** + `zodResolver(schema)` para todos os formulários (cliente, ordem, usuário, reset de senha).
- Erros exibidos por campo (equivalente ao `FormGroup`/`erros` do protótipo).
- Máscaras de entrada (CPF, telefone) via input controlado.

---

## 11. Design de API (Server Actions / Route Handlers)

Mutations expostas como **Server Actions** tipadas; retornam resultado discriminado (`{ ok: true, data } | { ok: false, erros }`). Todas re-validam com Zod e verificam sessão/papel.

| Ação | Assinatura (conceitual) | Guarda |
|---|---|---|
| `criarCliente(input)` | `ClienteInput → Cliente` | admin |
| `editarCliente(id, input)` | | admin |
| `inativarCliente(id)` / `reativarCliente(id)` | | admin |
| `criarOrdem(input)` | `OrdemInput → Ordem` (gera `numero`) | admin |
| `editarOrdem(id, input)` | só `AGENDADA`/`AGENDAMENTO_PAGO` | admin |
| `avancarStatus(id, botao, formaPagamento?)` | valida transição + pagamento | admin, funcionário (própria) |
| `cancelarOrdem(id)` | só de `AGENDADA` | admin |
| `reativarOrdem(id)` | de `CANCELADA` | admin |
| `criarUsuario(input)` | hash de senha | admin |
| `editarUsuario(id, {nome,email})` | | admin |
| `inativarUsuario(id)` / `reativarUsuario(id)` | | admin |
| `resetarSenhaUsuario(id, nova)` | | admin |
| `alterarPropriaSenha(nova)` | | qualquer autenticado |

Leituras (páginas) fazem data fetching no servidor com queries tipadas em `src/server/queries`, aplicando filtros de papel.

---

## 12. Requisitos não-funcionais

### 12.1 Segurança

- Senhas com hash (bcrypt/argon2); nunca em texto puro nem retornadas ao cliente.
- Autorização re-verificada no servidor em toda mutation e query sensível.
- Validação Zod obrigatória no servidor (defesa contra bypass do cliente).
- Proteção contra enumeração (IDs `cuid()`), CSRF (proteções do Auth.js/Server Actions), e injeção (Prisma parametrizado).
- Variáveis sensíveis (`DATABASE_URL`, `AUTH_SECRET`) via ambiente/secret manager, nunca no repositório.

### 12.2 Performance e escala

- Paginação no banco (`skip`/`take`), não em memória.
- Agregações de dashboard/relatório via `groupBy`/`aggregate`.
- Índices em campos de filtro (Seção 5.2).
- Server Components + streaming para reduzir JS no cliente.

### 12.3 Confiabilidade

- Geração de `Ordem.numero` transacional (sem duplicatas/corridas).
- Backups automatizados do PostgreSQL (Fase de sustentação).
- Migrations versionadas (`prisma migrate`); nunca alterar schema em produção fora de migration.

### 12.4 Qualidade de código

- TypeScript `strict`, sem `any`; ESLint + Prettier.
- Testes unitários da camada de domínio (máquina de status, CPF, cálculos).
- Testes de integração das Server Actions críticas (criação de OS, transições, autorização).

### 12.5 Observabilidade

- Log estruturado de erros do servidor.
- Tratamento de erro amigável na UI (Toast) sem vazar detalhes internos.

---

## 13. Infraestrutura e deploy

- **Docker:** `Dockerfile` para a app Next.js (build standalone) e `docker-compose.yml` para app + PostgreSQL em desenvolvimento.
- **Produção:** VPS/cloud com PostgreSQL gerenciado ou containerizado; SSL/HTTPS; backups automatizados; renovação de certificados.
- **CI/CD (recomendado):** pipeline com typecheck, lint, testes, `prisma migrate deploy` e build/deploy do container.
- **Seed:** cria o usuário admin inicial e os serviços do catálogo (Limpeza e Higienização, Impermeabilização, Lavagem de Tapetes, Lavagem de Cortinas).

---

## 14. Fases de entrega

Alinhado à `proposta_completa.md`:

| Fase | Entrega | Conteúdo |
|---|---|---|
| **1 — Fundação** | Acesso e cadastros | Auth + RBAC, gestão de usuários, cadastro de clientes, base do schema Prisma/migrations, layout responsivo. |
| **2 — Núcleo operacional** | Operação diária | Catálogo de serviços, ordens de serviço com máquina de status, Agenda. |
| **3 — Gestão e inteligência** | Visão gerencial | Dashboard de KPIs e Relatórios de faturamento. |
| **4 — Integração, infra e entrega** | Produção | Consulta de CEP (ViaCEP), Docker, publicação em produção, ajustes finais, backups/SSL. |

---

## 15. Glossário

| Termo | Definição |
|---|---|
| **OS** | Ordem de Serviço — atendimento registrado com cliente, funcionário, itens, data e status. |
| **Item de serviço** | Linha de uma OS: tipo de serviço, descrição do objeto, quantidade e valor unitário. |
| **Competência** | Mês/ano de referência usado no Dashboard. |
| **Soft delete** | Inativação lógica (`ativo = false`) preservando o histórico. |
| **Snapshot** | Cópia de dados (endereço, nome/valor do serviço) gravada na OS no momento da emissão. |
| **RBAC** | Role-Based Access Control — controle de acesso por papel (admin/funcionário). |

---

## 16. Questões em aberto / decisões a confirmar

1. **Tabela `Contador` dedicada vs. `max(numero)+1`** para o número sequencial de OS — definir na implementação da Fase 2.
2. **Escopo do catálogo de serviços administrável** — o protótipo usa lista fixa; a modelagem já suporta gestão futura via tabela `Servico`. Confirmar se a administração do catálogo entra no MVP.
3. **Valor monetário: `Decimal` vs. centavos em inteiro** — recomendação: `Decimal(10,2)`; confirmar padrão do time.
4. **Política de expiração de sessão** e "lembrar-me" — definir na Fase 1.
5. **Fuso horário** — datas de serviço são locais (Brasil). Padronizar armazenamento/exibição para evitar deslocamentos de dia (o protótipo formata datas por string split justamente para evitar dependência de timezone).

---

*Documento de especificação de design — base para a construção do sistema de produção a partir do protótipo funcional.*
