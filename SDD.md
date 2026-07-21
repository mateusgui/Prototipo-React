# SDD — Software Design Document

## Sistema de Gestão para Lavanderia ("Sistema de Lavanderia")

> **Status:** Especificação para construção do software de produção a partir do protótipo funcional.
> **Versão do documento:** 1.1
> **Data:** Julho de 2026
> **Autor:** Equipe de desenvolvimento

> **Alterações da v1.1 —** alinhamento ao `ERS.md` v2.1: **mobile-first** (RES-09), **docker-first** (RES-10) e **sessão de longa duração** (RF-AUT-10..12 / RN-18). Ver §17.

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
| `ERS.md` | **Especificação de Requisitos** — fonte de verdade do *o quê* (RFs, RNs, RNFs, restrições). Este SDD descreve o *como*. |
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
| Autenticação | **Auth.js (NextAuth v5)** — Credentials Provider | Sessão JWT/cookie **persistente de 30 dias com renovação rolante** (RN-18); RBAC. |
| Hash de senha | **bcrypt** (ou `argon2`) | Nunca armazenar senha em texto puro. |
| Infra | **Docker + Docker Compose** (app + PostgreSQL) | **Docker-first** (RES-10): ambiente único de dev, teste e produção, desde o primeiro commit. |

### 3.1 Princípios de arquitetura

- **Tipagem ponta-a-ponta:** o mesmo tipo derivado de um `schema` Zod flui do formulário → validação → Server Action → Prisma. Sem `any`.
- **Fonte única de verdade de validação:** todas as regras de campo residem em schemas Zod reutilizados no cliente (react-hook-form resolver) **e** no servidor (Server Actions). Nunca confiar apenas na validação do cliente.
- **Server-first:** por padrão, componentes são Server Components; interatividade é isolada em Client Components (`"use client"`) o menor possível.
- **Mutations via Server Actions:** operações de escrita usam Server Actions tipadas; leituras de página usam data fetching no servidor.
- **Camada de serviço fina:** lógica de negócio (transições de status, cálculos) isolada em módulos puros e testáveis, independentes de React e do Prisma quando possível.
- **Mobile-first (RES-09):** todo layout é escrito partindo do menor viewport (**360px**). Em Tailwind isso significa que as classes **sem prefixo** descrevem o mobile e os prefixos `md:`/`lg:` aplicam o *upgrade* para desktop — nunca o contrário. Não se usa `max-*` para "consertar" o mobile. A tela do funcionário em campo (Agenda) é o caso de uso de referência, não o desktop do admin.
- **Docker-first (RES-10):** o sistema roda em container desde o primeiro commit. `docker compose up` é o **único** comando necessário para levantar aplicação + banco, em qualquer máquina, sem Node ou Postgres instalados no host. Dev, CI e produção compartilham o mesmo `Dockerfile`, variando apenas por *target* e variáveis de ambiente. Nenhuma etapa de "dockerizar depois" existe no plano.
- **Sessão longa por decisão de produto (RN-18):** a operadora principal tem baixa familiaridade com tecnologia; relogin frequente inviabiliza o uso. A janela de sessão é alongada deliberadamente, com o risco aceito e compensado por invalidação server-side (§8.1).

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
├── docker/
│   ├── entrypoint.sh           # prisma migrate deploy → start (ver §13)
│   └── healthcheck.sh
├── .dockerignore
├── .env.example                # contrato de configuração versionado (sem segredos)
├── docker-compose.yml          # app + postgres (base, produção-like)
├── docker-compose.override.yml # dev: hot reload por volume, porta exposta
├── Dockerfile                  # multi-stage: deps → builder → runner
└── tailwind.config.ts
```

> **Docker-first (RES-10):** os arquivos de container **não** são um apêndice do final do projeto — `Dockerfile`, `docker-compose.yml` e `.env.example` entram no **primeiro commit**, antes de qualquer módulo funcional. O critério de aceite do bootstrap é `docker compose up` servir a aplicação em `http://localhost:3000` com o banco conectado.

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

Navegação **mobile-first** (RES-09):

- **Base (mobile, a partir de 360px):** bottom-nav fixa + botão "Opções" (acesso a Usuários, reset da própria senha, sair). É o layout padrão, sem media query.
- **Upgrade (`min-width: 701px`):** topbar horizontal com as abas do papel; a bottom-nav é ocultada.
- Guarda de rota via `middleware.ts` + verificação de papel no layout `(app)`. Funcionário que acessar rota de admin é redirecionado para `/agenda`.
- O `middleware.ts` também **renova a sessão rolante** (§8.1) — usuário com cookie válido nunca é enviado a `/login`.

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
  sessaoVersao Int   @default(0)   // incrementar invalida todas as sessões do usuário (§8.1.1 / RF-AUT-12)
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
- **`Usuario.sessaoVersao`:** contador de invalidação de sessão. Como a sessão é JWT de longa duração (30 dias rolantes, §8.1.1), não há tabela de sessões para deletar — incrementar este campo é o mecanismo de revogação imediata ao inativar o usuário ou trocar sua senha (RF-AUT-12).

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
- Sessão via **cookie httpOnly + `Secure` + `SameSite=Lax`** contendo JWT assinado com `AUTH_SECRET`.
- `middleware.ts` protege todas as rotas do grupo `(app)`; rota `/login` é pública.

#### 8.1.1 Política de sessão de longa duração (RF-AUT-10..12 / RN-18)

Requisito de produto: a operadora principal **não pode ser deslogada durante o uso rotineiro**. A implementação é **sessão rolante de 30 dias**:

```ts
// src/server/auth.ts
export const { auth, handlers, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge:    60 * 60 * 24 * 30,  // 30 dias de validade
    updateAge: 60 * 60 * 24,       // renova o token no máx. 1x por dia
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // cookie PERSISTENTE — sobrevive ao fechar o navegador
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) { /* injeta id, perfil e sessaoVersao */ },
    async session({ session, token }) { /* expõe id + perfil */ },
  },
});
```

**Efeito pretendido:** cada acesso reemite a validade por mais 30 dias. Quem abre o sistema ao menos uma vez por mês **nunca vê a tela de login** novamente.

**Por que não um JWT de expiração muito longa (anos):** um token com `exp` quase perpétuo é, na prática, uma credencial **irrevogável** — se vazar (aparelho perdido, backup do navegador, dispositivo compartilhado), não há como cortar o acesso sem trocar o `AUTH_SECRET` e derrubar **todos** os usuários. A sessão rolante entrega o mesmo efeito percebido pelo cliente e preserva a revogação.

**Invalidação (RF-AUT-12).** Como a estratégia é `jwt` (sem tabela de sessões), a revogação usa um **contador de versão de sessão**:

```prisma
model Usuario {
  // …
  sessaoVersao Int @default(0)  // incrementar invalida todas as sessões do usuário
}
```

- O `sessaoVersao` é gravado no token no login e **conferido no callback `jwt`** a cada renovação; divergência → sessão rejeitada.
- Incrementam `sessaoVersao`: **inativação do usuário** (RN-11), **reset de senha pelo admin** e **troca da própria senha**.
- Logout manual limpa o cookie.
- Nenhum outro evento encerra a sessão — não há timeout de inatividade, nem expiração ao fechar o navegador.

**Riscos aceitos e mitigações.** O alongamento da janela é risco de segurança **formalmente aceito pelo cliente** (registrado em RN-18). Mitigações obrigatórias: HTTPS/TLS em produção (§13), cookie `httpOnly` (imune a leitura por XSS), `SameSite=Lax` (CSRF), `AUTH_SECRET` forte fora do repositório, e **autorização sempre re-verificada no servidor** (§8.2) — um cookie antigo nunca concede mais permissão do que o papel atual do usuário no banco.

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

### 10.3 Responsividade — mobile-first (RES-09)

**Regra de escrita:** classe **sem prefixo = mobile**; prefixo = *upgrade*. O breakpoint de 700px é declarado como um screen customizado do Tailwind e usado sempre em `min-width`:

```ts
// tailwind.config.ts
theme: { extend: { screens: { desk: "701px" } } }
```

```tsx
// certo — base mobile, upgrade no desk:
<nav className="fixed bottom-0 flex desk:static desk:top-0" />
// errado — parte do desktop e corrige para baixo:
<nav className="static max-desk:fixed max-desk:bottom-0" />
```

- **Base (mobile, ≥ 360px):** bottom-nav fixa + listas em card + formulários em coluna única. Sem rolagem horizontal em nenhuma tela.
- **`desk:` (≥ 701px):** topbar + tabelas + formulários em duas colunas.
- **Modais:** `Sheet` (slide-up do rodapé) como padrão mobile; `Dialog` centralizado a partir de `desk:`.
- **Paginação** fixa acima da bottom-nav no mobile (`bottom: calc(60px + env(safe-area-inset-bottom))`), com padding compensatório no container.
- **Ergonomia de toque:** alvos ≥ 44 × 44px; nenhuma ação essencial dependente de `hover`; `inputmode` numérico em CPF, telefone, CEP, quantidade e valor.
- **Verificação obrigatória:** toda tela é validada em **360 × 640** antes de ser considerada pronta — o desktop é a checagem secundária, não a primária.

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
| `resetarSenhaUsuario(id, nova)` | **incrementa `sessaoVersao`** (§8.1.1) | admin |
| `alterarPropriaSenha(nova)` | **incrementa `sessaoVersao`** (§8.1.1) | qualquer autenticado |

> `inativarUsuario` também incrementa `sessaoVersao`, derrubando as sessões vigentes daquele usuário (RF-AUT-12 / RN-11).

Leituras (páginas) fazem data fetching no servidor com queries tipadas em `src/server/queries`, aplicando filtros de papel.

---

## 12. Requisitos não-funcionais

### 12.1 Segurança

- Senhas com hash (bcrypt/argon2); nunca em texto puro nem retornadas ao cliente.
- Autorização re-verificada no servidor em toda mutation e query sensível.
- Validação Zod obrigatória no servidor (defesa contra bypass do cliente).
- Proteção contra enumeração (IDs `cuid()`), CSRF (proteções do Auth.js/Server Actions), e injeção (Prisma parametrizado).
- Variáveis sensíveis (`DATABASE_URL`, `AUTH_SECRET`) via ambiente/secret manager, nunca no repositório. `.env.example` versionado contém apenas **nomes** e formato, jamais valores reais.
- **Sessão de longa duração — risco aceito (RN-18):** a janela de 30 dias rolantes é uma decisão de produto do cliente, não um descuido. Compensações obrigatórias: cookie `httpOnly`+`Secure`+`SameSite=Lax`, HTTPS obrigatório, `AUTH_SECRET` de alta entropia fora do repositório, e revogação imediata via `sessaoVersao` (§8.1.1). A autorização é sempre reconsultada no servidor — um cookie de 29 dias atrás não carrega permissões antigas.
- Imagem Docker executa como **usuário não-root**; segredos entram por variável de ambiente em runtime, nunca por `ARG`/`COPY` na imagem (evita vazamento em camadas).

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
- Testes de integração das Server Actions críticas (criação de OS, transições, autorização) — incluindo **revogação de sessão** (`sessaoVersao`) ao inativar usuário e trocar senha.
- Testes executados **dentro do container** (RES-10), contra o Postgres do compose: mesma imagem em dev, CI e produção.

### 12.5 Observabilidade

- Log estruturado de erros do servidor.
- Tratamento de erro amigável na UI (Toast) sem vazar detalhes internos.

---

## 13. Infraestrutura e deploy — Docker-first (RES-10)

O sistema é containerizado **desde o primeiro commit**. O objetivo é que, ao final do desenvolvimento, o repositório seja entregue à infra de hospedagem **pronto para subir**, sem etapa de adaptação.

### 13.1 Dockerfile (multi-stage)

Três estágios, imagem final mínima:

| Estágio | Conteúdo |
|---|---|
| `deps` | `node:22-alpine`; instala dependências a partir de `package-lock.json` (`npm ci`) — camada cacheável. |
| `builder` | `prisma generate` + `next build` com `output: "standalone"` no `next.config.ts`. |
| `runner` | Copia apenas `.next/standalone`, `.next/static`, `public` e o Prisma Client. Roda como usuário **não-root** (`node`). `ENV TZ=America/Sao_Paulo`. Expõe `3000`. |

### 13.2 Compose

- **`docker-compose.yml` (base, produção-like):** serviço `app` + serviço `db` (`postgres:17-alpine`) com **volume nomeado** (`pgdata`) e `healthcheck` (`pg_isready`). O `app` declara `depends_on: db: condition: service_healthy`.
- **`docker-compose.override.yml` (dev, aplicado automaticamente):** monta o código como volume para **hot reload**, expõe a porta do Postgres para inspeção e roda `next dev`.
- Um único comando para desenvolver: `docker compose up`. Nenhum Node, npm ou Postgres instalado no host.

### 13.3 Entrypoint e ciclo de vida

`docker/entrypoint.sh`, executado antes de aceitar tráfego:

1. Valida as variáveis de ambiente obrigatórias — **falha o boot** com mensagem clara se faltar alguma.
2. Aguarda o banco ficar saudável.
3. Executa `prisma migrate deploy` (idempotente; nunca `migrate dev` em produção).
4. Sobe o servidor Next.js.

Complementos exigidos pela hospedagem:

- **Healthcheck HTTP:** rota `/api/health` (verifica app + conexão com o banco), declarada no `HEALTHCHECK` do Dockerfile e no compose.
- **Graceful shutdown:** `SIGTERM` encerra conexões e o Prisma Client antes de sair.
- **Logs** estruturados em `stdout`/`stderr` (sem arquivo de log dentro do container).
- **Persistência** exclusivamente no volume `pgdata` — o container da app é descartável.

### 13.4 Contrato de configuração (`.env.example`)

Versionado no repositório, **sem valores reais**, e validado por schema Zod no boot:

| Variável | Papel |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL. |
| `AUTH_SECRET` | Assinatura do JWT de sessão (alta entropia; rotacioná-la desloga todos). |
| `AUTH_URL` / `NEXTAUTH_URL` | URL pública da aplicação. |
| `NODE_ENV` | `production` em produção (ativa cookie `Secure`). |
| `TZ` | `America/Sao_Paulo`. |
| `EMPRESA_NOME` | Marca parametrizável (RF-UX-08). |

### 13.5 Produção e entrega à infra

- **Produção:** VPS/cloud rodando o mesmo compose, atrás de proxy reverso (Nginx/Traefik/Caddy) com **SSL/HTTPS** e renovação automática de certificado. PostgreSQL containerizado (volume) ou gerenciado — a troca é apenas o `DATABASE_URL`.
- **CI/CD:** pipeline com typecheck, lint e testes **executados dentro da imagem**, seguido de build e publicação do container; deploy é `pull` + `up -d`.
- **Backups:** dump automatizado do volume `pgdata` com retenção definida, e procedimento de **restore testado** (não apenas documentado).
- **`README` de deploy** entregue junto: subir, atualizar versão, aplicar migrations, backup e restore.
- **Seed:** cria o usuário admin inicial e os serviços do catálogo (Limpeza e Higienização, Impermeabilização, Lavagem de Tapetes, Lavagem de Cortinas), executável via comando no container.

---

## 14. Fases de entrega

Alinhado à `proposta_completa.md`:

| Fase | Entrega | Conteúdo |
|---|---|---|
| **0 — Bootstrap containerizado** | Ambiente | `Dockerfile` + compose (app + Postgres) + `.env.example` + entrypoint com migrations, no primeiro commit. Critério de aceite: `docker compose up` serve a aplicação. |
| **1 — Fundação** | Acesso e cadastros | Auth + RBAC, **sessão longa rolante de 30 dias** (§8.1.1), gestão de usuários, cadastro de clientes, schema Prisma/migrations, **shell mobile-first**. |
| **2 — Núcleo operacional** | Operação diária | Catálogo de serviços, ordens de serviço com máquina de status, Agenda. |
| **3 — Gestão e inteligência** | Visão gerencial | Dashboard de KPIs e Relatórios de faturamento. |
| **4 — Integração e publicação** | Produção | Consulta de CEP (ViaCEP), publicação em produção (proxy + SSL), backups/restore testados, `README` de deploy, ajustes finais. |

> **Mudança na v1.1:** Docker deixou de ser item da Fase 4 e virou a **Fase 0** (RES-10). A Fase 4 agora trata de *publicar* o que já está containerizado, não de containerizar.

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
| **Mobile-first** | Método de construção em que o layout base atende o menor viewport e telas maiores recebem *upgrades* progressivos (`min-width`), nunca o inverso. |
| **Docker-first** | Prática de containerizar o projeto desde o primeiro commit, com dev, CI e produção rodando os mesmos artefatos — em oposição a "empacotar em Docker no final". |
| **Sessão rolante** | Sessão cuja validade é reemitida a cada acesso, de modo que o uso regular a mantém indefinidamente ativa, sem torná-la irrevogável. |
| **`sessaoVersao`** | Contador em `Usuario` que, ao ser incrementado, invalida todos os JWTs de sessão emitidos anteriormente para aquele usuário. |

---

## 16. Questões em aberto / decisões a confirmar

1. **Tabela `Contador` dedicada vs. `max(numero)+1`** para o número sequencial de OS — definir na implementação da Fase 2.
2. **Escopo do catálogo de serviços administrável** — o protótipo usa lista fixa; a modelagem já suporta gestão futura via tabela `Servico`. Confirmar se a administração do catálogo entra no MVP.
3. **Valor monetário: `Decimal` vs. centavos em inteiro** — recomendação: `Decimal(10,2)`; confirmar padrão do time.
4. ~~**Política de expiração de sessão** e "lembrar-me".~~ **RESOLVIDA (v1.1):** sessão persistente de **30 dias com renovação rolante a cada 24h**, revogável por `sessaoVersao`. Sem checkbox "lembrar-me" — o comportamento é sempre lembrar, por decisão do cliente. Ver §8.1.1, `ERS.md` RF-AUT-10..12 / RN-18.
5. **Fuso horário** — datas de serviço são locais (Brasil). Padronizar armazenamento/exibição para evitar deslocamentos de dia (o protótipo formata datas por string split justamente para evitar dependência de timezone). Container fixa `TZ=America/Sao_Paulo` (§13.4).

---

## 17. Histórico de revisões

| Versão | Data | Descrição |
|---|---|---|
| 1.0 | Jul/2026 | Especificação inicial de design para a construção do sistema de produção. |
| 1.1 | Jul/2026 | Alinhamento ao `ERS.md` v2.1. **Mobile-first (RES-09):** §3.1, §4.3, §10.3 reescritos partindo do viewport de 360px, com `desk:` (`min-width:701px`) como upgrade. **Docker-first (RES-10):** §13 reescrita (Dockerfile multi-stage, compose app+Postgres, entrypoint com `migrate deploy`, healthcheck, graceful shutdown, `.env.example` validado no boot, backup/restore, README de deploy); Docker movido da Fase 4 para a nova **Fase 0**; estrutura de pastas (§4.2) e stack (§3) atualizadas. **Sessão de longa duração (RN-18):** nova §8.1.1 com `maxAge` 30d + `updateAge` 24h, cookie persistente e revogação via novo campo `Usuario.sessaoVersao` (§5.2, §5.3, §11); risco de segurança registrado como aceito (§12.1). Fechada a questão em aberto #4. |

---

*Documento de especificação de design — base para a construção do sistema de produção a partir do protótipo funcional.*
