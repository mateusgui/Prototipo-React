# ERS — Especificação de Requisitos de Software

## Sistema de Gestão para Lavanderia ("Sistema de Lavanderia")

> **Norma de referência:** ISO/IEC/IEEE 29148:2018 (adaptação do modelo IEEE 830).
> **Versão do documento:** 1.0
> **Data:** Julho de 2026
> **Situação:** Baseline de requisitos derivada do protótipo funcional (`src/App.jsx`), do relatório de pendências e do Documento de Design (`SDD.md`).
> **Autor:** Equipe de desenvolvimento

---

## Sumário

1. [Introdução](#1-introdução)
2. [Descrição geral](#2-descrição-geral)
3. [Requisitos funcionais](#3-requisitos-funcionais)
4. [Regras de negócio](#4-regras-de-negócio)
5. [Requisitos de interface externa](#5-requisitos-de-interface-externa)
6. [Requisitos não-funcionais](#6-requisitos-não-funcionais)
7. [Casos de uso](#7-casos-de-uso)
8. [Matriz de rastreabilidade](#8-matriz-de-rastreabilidade)
9. [Backlog de pendências priorizado](#9-backlog-de-pendências-priorizado)
10. [Apêndices](#10-apêndices)

---

## 1. Introdução

### 1.1 Propósito

Este documento (ERS — Especificação de Requisitos de Software) define **o que** o Sistema de Gestão para Lavanderia deve fazer: seus requisitos funcionais, regras de negócio, requisitos de interface e requisitos não-funcionais. Enquanto o `SDD.md` descreve **como** construir o sistema (arquitetura, stack, modelo de dados), esta ERS é a **fonte de verdade dos requisitos** — o contrato do que precisa existir para o produto ser considerado completo.

A especificação consolida três fontes:

1. O **comportamento validado** no protótipo funcional (`src/App.jsx`, ~2.006 linhas, React + Vite, dados em memória).
2. O **relatório de pendências** (itens `F01`–`F18` e `MVP01`–`MVP16`), com o status real de implementação verificado no código.
3. As **decisões de design** do `SDD.md` (stack de produção, modelo de dados, segurança).

Cada requisito recebe um identificador estável, uma prioridade e um **status de implementação** (Implementado / Parcial / Pendente), permitindo rastrear o que já existe no protótipo versus o que ainda precisa ser construído para o MVP e para o produto de produção.

### 1.2 Escopo do produto

O **Sistema de Lavanderia** é uma aplicação web responsiva de gestão operacional para lavanderias/higienizadoras de estofados. Objetivos:

- **Centralizar** o cadastro de clientes e o histórico de atendimentos.
- **Controlar** ordens de serviço (OS) da criação ao pagamento, com máquina de status bem definida.
- **Organizar** a agenda de execução em campo, por dia e por funcionário.
- **Fornecer** visão gerencial (KPIs e faturamento) ao administrador.

O produto **não** contempla (fora de escopo, conforme `proposta_completa.md`): emissão fiscal (NFS-e), gateway de pagamento, app nativo, mensageria automática (WhatsApp/SMS/e-mail), anexo de fotos, multi-empresa/filial, controle de estoque, exportação avançada (BI) e precificação automática. A **consulta automática de CEP (ViaCEP)** está prevista apenas para a Fase 4 de produção.

### 1.3 Definições, acrônimos e abreviações

| Termo | Definição |
|---|---|
| **ERS** | Especificação de Requisitos de Software (SRS). |
| **OS** | Ordem de Serviço — atendimento com cliente, funcionário, itens, data e status. |
| **Item de serviço** | Linha de uma OS: tipo de serviço, descrição do objeto, quantidade e valor unitário. |
| **RF** | Requisito Funcional. |
| **RNF** | Requisito Não-Funcional. |
| **RN** | Regra de Negócio. |
| **CU** | Caso de Uso. |
| **RBAC** | Role-Based Access Control (controle de acesso por papel). |
| **Competência** | Mês/ano de referência usado no Dashboard. |
| **Soft delete** | Inativação lógica (`ativo = false`) preservando o histórico. |
| **Snapshot** | Cópia de dados (endereço, nome/valor do serviço) gravada na OS na emissão. |
| **KPI** | Key Performance Indicator (indicador-chave). |
| **MVP** | Minimum Viable Product (produto mínimo viável). |

### 1.4 Convenções de identificação

| Prefixo | Categoria |
|---|---|
| `RF-<MÓD>-nn` | Requisito funcional, agrupado por módulo (AUT, USR, CLI, SRV, OS, AGD, DSH, REL, UX). |
| `RN-nn` | Regra de negócio. |
| `RNF-nn` | Requisito não-funcional. |
| `CU-nn` | Caso de uso. |

**Prioridade** (MoSCoW adaptado à demonstração ao cliente):

- **Essencial** — obrigatório para a demonstração/MVP; furo visível se ausente.
- **Alta** — recomendado para um MVP robusto.
- **Média** — agrega valor, pode ficar para iteração seguinte.
- **Baixa** — desejável / evolução futura.

**Status** (verificado no protótipo em Julho/2026):

- ✅ **Implementado** — presente e funcional no protótipo.
- ⚠️ **Parcial** — parcialmente atendido; requer complemento.
- ❌ **Pendente** — não implementado.
- ➖ **N/A** — não se aplica (obsoleto ou fora do protótipo).

### 1.5 Documentos relacionados

| Documento | Conteúdo |
|---|---|
| `SDD.md` | Documento de Design (arquitetura, stack, modelo de dados, API). |
| `proposta.md` / `proposta_completa.md` | Proposta técnica e comercial (escopo, fases, exclusões). |
| `relatorio_final.md` | Relatório de furos e sugestões de MVP (origem dos itens `F`/`MVP`). |
| `CLAUDE.md` | Documentação de arquitetura do protótipo (referência de comportamento). |
| `src/App.jsx` | Fonte de verdade do comportamento atual (protótipo). |

---

## 2. Descrição geral

### 2.1 Perspectiva do produto

O produto substitui controles informais (cadernos, planilhas, grupos de WhatsApp) por um sistema web único, acessível por navegador, sem instalação. É um sistema **standalone** de unidade única (não multi-filial), com dois perfis de acesso e um fluxo central em torno da Ordem de Serviço.

Estado atual: **protótipo funcional** com todos os dados em memória (reset a cada refresh). Estado-alvo: **produto de produção** com persistência (PostgreSQL), autenticação real e tipagem ponta-a-ponta, conforme `SDD.md`. Esta ERS especifica os requisitos válidos para **ambos** — os já demonstráveis no protótipo e os que a produção deve garantir.

### 2.2 Perfis de usuário (atores)

| Ator | Descrição | Acesso |
|---|---|---|
| **Administrador** | Dono/gestor da lavanderia. Opera todos os módulos. | Dashboard, Clientes, Ordens, Agenda, Relatórios e gestão de Usuários. |
| **Funcionário** | Executor do serviço em campo. | Apenas a Agenda, restrita às ordens atribuídas a ele; pode marcar/desmarcar "Serviço Realizado". |
| **Sistema** | Ator não-humano para rotinas automáticas (numeração de OS, validações, snapshots). | — |

### 2.3 Módulos funcionais

1. **Autenticação e controle de acesso** (RF-AUT)
2. **Gestão de usuários** (RF-USR)
3. **Clientes** (RF-CLI)
4. **Catálogo de serviços** (RF-SRV)
5. **Ordens de serviço** (RF-OS)
6. **Agenda** (RF-AGD)
7. **Dashboard** (RF-DSH)
8. **Relatórios** (RF-REL)
9. **Transversais / UX** (RF-UX): formatação, máscaras, feedback, navegação.

### 2.4 Características dos usuários

- Baixa maturidade digital esperada; a interface deve ser **autoexplicativa**, com feedback claro e mínima curva de aprendizado.
- Uso **misto desktop/mobile**: administrador majoritariamente desktop; funcionário majoritariamente mobile em campo.
- Idioma: **Português do Brasil**; formatos brasileiros de data, moeda, telefone e CEP são requisito, não opção.

### 2.5 Restrições

- **RES-01** — Web responsivo apenas; sem app nativo. Breakpoint de referência: **700px**.
- **RES-02** — Unidade única (sem multi-tenant/multi-filial).
- **RES-03** — Sem integração fiscal, gateway de pagamento ou mensageria.
- **RES-04** — Valor monetário sempre informado manualmente por item (sem precificação automática).
- **RES-05** — Stack de produção definida no `SDD.md` (Next.js 15, TypeScript strict, Prisma + PostgreSQL, Zod, Auth.js, Tailwind + shadcn/ui).
- **RES-06** — Datas de serviço são locais (Brasil); armazenamento/exibição devem evitar deslocamento de dia por timezone.

### 2.6 Suposições e dependências

- **SUP-01** — Cada OS tem exatamente **um** funcionário responsável.
- **SUP-02** — O catálogo de serviços é pequeno e estável (seed inicial de 4 tipos); administração do catálogo pela UI é evolução futura (a confirmar — ver §10.3).
- **SUP-03** — A consulta de CEP (ViaCEP) depende de serviço externo e só entra na Fase 4.
- **SUP-04** — O número de OS é sequencial de negócio, único e visível ao usuário.

---

## 3. Requisitos funcionais

> Legenda de status: ✅ Implementado · ⚠️ Parcial · ❌ Pendente · ➖ N/A.
> A coluna **Origem** referencia o item do `relatorio_final.md` (`F`/`MVP`) ou o `SDD.md` quando aplicável.

### 3.1 Autenticação e controle de acesso (RF-AUT)

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-AUT-01** | O sistema deve autenticar o usuário por **e-mail + senha**, validando contra a base de usuários. | Essencial | ✅ | SDD §8 |
| **RF-AUT-02** | O sistema deve **bloquear o login** de usuário inativo (`ativo === false`). | Essencial | ✅ | RN-11 |
| **RF-AUT-03** | O sistema deve aplicar **RBAC** com dois papéis (admin/funcionário), controlando abas, rotas e ações visíveis. | Essencial | ✅ | SDD §8.2 |
| **RF-AUT-04** | O funcionário deve ser **redirecionado/limitado** à Agenda, sem acesso a módulos de admin. | Essencial | ✅ | RN-12 |
| **RF-AUT-05** | O sistema deve exibir **confirmação de logout** antes de encerrar a sessão. | Média | ✅ | Protótipo |
| **RF-AUT-06** | A tela de login deve exibir **credenciais de demonstração** (apenas em ambiente de demo). | Baixa | ✅ | Protótipo |
| **RF-AUT-07** | A tela de login deve oferecer o link **"Esqueci minha senha"** que abre modal informativo (na versão final, envio de e-mail de recuperação). | Baixa | ❌ | MVP13 |
| **RF-AUT-08** | *(Produção)* Senhas devem ser armazenadas com **hash** (bcrypt/argon2); nunca em texto puro nem retornadas ao cliente. | Essencial | ❌ | SDD §8.3 |
| **RF-AUT-09** | *(Produção)* A sessão deve usar **cookie httpOnly + JWT** com expiração configurável; rotas autenticadas protegidas por middleware. | Alta | ❌ | SDD §8.1 |

### 3.2 Gestão de usuários (RF-USR) — admin

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-USR-01** | O admin deve **listar** usuários como cards, com badge de papel. | Alta | ✅ | Protótipo |
| **RF-USR-02** | O admin deve **criar** usuário (nome, e-mail, senha ≥ 6, papel). | Alta | ✅ | SDD §9.6 |
| **RF-USR-03** | O sistema deve garantir **e-mail único** de usuário, com mensagem amigável ("E-mail já cadastrado"). | Alta | ⚠️ | RN-13 |
| **RF-USR-04** | O admin deve **editar** nome e e-mail de um usuário. | Alta | ✅ | Protótipo |
| **RF-USR-05** | O admin deve **inativar/reativar** usuário (soft delete). | Alta | ✅ | RN-10 |
| **RF-USR-06** | O admin deve **resetar a senha** de outro usuário (mínimo 6 caracteres). | Alta | ✅ | Protótipo |
| **RF-USR-07** | Qualquer usuário autenticado deve **redefinir a própria senha**. | Alta | ✅ | Protótipo |

> **Nota sobre RF-USR-03:** no protótipo há verificação de e-mail; a garantia de unicidade forte depende do banco (`@@unique`) em produção — daí o status ⚠️ Parcial.

### 3.3 Clientes (RF-CLI) — admin

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-CLI-01** | O admin deve **cadastrar** cliente com nome, sobrenome, CPF, telefone, e-mail e endereço completo. | Essencial | ✅ | Protótipo |
| **RF-CLI-02** | O CPF deve ter **validação de dígitos verificadores** e **máscara** `###.###.###-##`. | Essencial | ✅ | RN-01, F(base) |
| **RF-CLI-03** | O telefone deve ter **máscara** `(00) 00000-0000` (celular) ou `(00) 0000-0000` (fixo). | Essencial | ✅ | F02, RN-03 |
| **RF-CLI-04** | O CEP deve ter **máscara** `00000-000`. | Alta | ❌ | F07 |
| **RF-CLI-05** | O endereço deve incluir o campo **Complemento** (Apto, Bloco, Fundos). | Alta | ✅ | MVP06 |
| **RF-CLI-06** | O admin deve **editar** o cadastro de um cliente. | Essencial | ✅ | Protótipo |
| **RF-CLI-07** | O admin deve **inativar/reativar** cliente (soft delete); cliente inativo não é selecionável em nova OS. | Alta | ✅ | RN-10, RN-11 |
| **RF-CLI-08** | Ao inativar cliente com ordens **agendadas**, a confirmação deve informar a **quantidade** de ordens pendentes e o impacto. | Média | ❌ | F16 |
| **RF-CLI-09** | A lista de clientes deve ter **busca em tempo real** por nome (idealmente também CPF/telefone). | Alta | ✅ | MVP01 |
| **RF-CLI-10** | A lista de clientes deve ser **paginada** (10/página). | Alta | ✅ | SDD §9.1 |
| **RF-CLI-11** | O admin deve acessar o **histórico de ordens** de um cliente (read-only). | Alta | ✅ | MVP04 |
| **RF-CLI-12** | O CPF deve ser **único** por cliente, com bloqueio amigável em cadastro/edição ("Este CPF já está registrado"). | Alta | ⚠️ | RN-02 |
| **RF-CLI-13** | As tabelas de clientes devem permitir **ordenação por coluna** (nome, etc.) com indicador visual ▲/▼. | Média | ❌ | MVP09 |
| **RF-CLI-14** | *(Fase 4)* Ao digitar o CEP, o sistema deve **autocompletar o endereço** via ViaCEP. | Baixa | ❌ | SDD §9.1 |

### 3.4 Catálogo de serviços (RF-SRV)

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-SRV-01** | O sistema deve manter um **catálogo de tipos de serviço** para seleção rápida na OS. | Essencial | ✅ | Protótipo |
| **RF-SRV-02** | O catálogo inicial (seed) deve conter os tipos: Limpeza e Higienização, Impermeabilização, Lavagem de Tapetes, Lavagem de Cortinas. | Essencial | ✅ | SDD §13 |
| **RF-SRV-03** | *(Evolução)* O admin deve **gerenciar** o catálogo (criar/ativar/desativar tipos) pela UI. | Baixa | ➖ | SDD §16.2 |

> **RF-SRV-03** está fora do protótipo (catálogo é `const`); a decisão de incluí-lo no MVP está em aberto (§10.3). Não há mais "tab Serviços", portanto o item `F14` do relatório (asterisco no modal de serviço) é **➖ N/A**.

### 3.5 Ordens de serviço (RF-OS)

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-OS-01** | O sistema deve **criar OS** com número sequencial automático, cliente, funcionário, data, hora, itens, observações e forma de pagamento. | Essencial | ✅ | Protótipo |
| **RF-OS-02** | A seleção de cliente deve usar **autocomplete**: ao focar sem texto, exibir os 5 últimos (id desc); ao digitar, buscar clientes ativos (máx. 10). | Alta | ✅ | F17 |
| **RF-OS-03** | Cada OS deve conter **≥ 1 item de serviço**, cada um com tipo (catálogo ou nome customizado), descrição do objeto, quantidade (≥ 1) e valor unitário manual. | Essencial | ✅ | RN-08 |
| **RF-OS-04** | A data da OS deve ser validada como **hoje ou futura** na **criação**, comparando com a data atual dinâmica (`new Date()`), sem valor hardcoded. | Essencial | ✅ | F03, RN-07 |
| **RF-OS-05** | A **edição** de OS deve aplicar a **mesma validação de data futura** da criação. | Essencial | ✅ | F04 |
| **RF-OS-06** | A hora da OS deve respeitar o **horário comercial 08h–18h**. | Alta | ✅ | RN-06 |
| **RF-OS-07** | A edição de OS deve ser permitida **apenas** nos status `AGENDADA` e `AGENDAMENTO_PAGO`. | Alta | ✅ | RN-05 |
| **RF-OS-08** | O sistema deve **cancelar** OS (somente a partir de `AGENDADA`) e **reativar** OS cancelada para `AGENDADA`. | Alta | ✅ | RN-04 |
| **RF-OS-09** | O sistema deve permitir **avançar/retroceder status** via toggles bidirecionais ("Realizado" e "Pago"), conforme a máquina de status (RN-04). | Essencial | ✅ | RN-04 |
| **RF-OS-10** | Ao registrar pagamento (`AGENDADA→AGENDAMENTO_PAGO` ou `REALIZADA→PAGA`), o sistema deve **exigir a forma de pagamento** antes de confirmar. | Essencial | ✅ | MVP03, RN-14 |
| **RF-OS-11** | O **detalhe da OS** deve oferecer ações contextuais por status (Editar, Cancelar, Fechar) e **edição inline** para `AGENDADA`/`AGENDAMENTO_PAGO`. | Alta | ✅ | F12 |
| **RF-OS-12** | O detalhe da OS deve exibir botão **Google Maps** que abre URL construída do endereço da OS + cidade/estado do cliente. | Média | ✅ | Protótipo |
| **RF-OS-13** | O **endereço** da OS deve ser **snapshot** no momento da criação; ao **editar** a OS, o endereço deve ser **regenerado** a partir do cadastro atual do cliente. | Média | ✅ | F18, RN-09 |
| **RF-OS-14** | A lista de ordens deve ter **filtros combináveis**: nome do cliente, data início, data fim. | Alta | ✅ | MVP02 |
| **RF-OS-15** | A lista de ordens deve permitir **filtro por status** (Todas/Agendadas/Realizadas/Pagas/Canceladas). | Alta | ⚠️ | MVP02 |
| **RF-OS-16** | A lista de ordens deve ser **paginada** (10/página) e resetar a página ao mudar filtros. | Alta | ✅ | SDD §9.2 |
| **RF-OS-17** | O sistema deve **avisar** (sem bloquear) sobre **conflito de horário** do mesmo funcionário no mesmo dia/hora. | Alta | ❌ | MVP07 |
| **RF-OS-18** | Ordens de **hoje** e **atrasadas** devem receber **destaque visual** (badge/ícone) nas listas e na Agenda. | Alta | ❌ | MVP10 |
| **RF-OS-19** | A forma de pagamento registrada deve ser **exibida** no detalhe da OS e considerada nos relatórios. | Alta | ✅ | MVP03 |
| **RF-OS-20** | As tabelas de ordens devem permitir **ordenação por coluna** (data, valor, status) com indicador ▲/▼. | Média | ❌ | MVP09 |

### 3.6 Agenda (RF-AGD)

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-AGD-01** | A Agenda deve listar ordens **ordenadas por data + hora**. | Alta | ✅ | Protótipo |
| **RF-AGD-02** | A Agenda deve **agrupar por dia** com separadores legíveis ("3 de Junho de 2026"). | Alta | ✅ | F09 |
| **RF-AGD-03** | A Agenda deve filtrar por status operacional **Agendado / Realizado / Pago**, cada um mapeando um conjunto de status (exibindo ordens `REALIZADA`, não só `AGENDADA`). | Alta | ✅ | F08 |
| **RF-AGD-04** | O admin deve dispor de filtros extras por **funcionário** e por **data específica**. | Alta | ✅ | Protótipo |
| **RF-AGD-05** | O funcionário deve ver **apenas as próprias ordens** e dispor do botão "Realizado" no card para toggle direto. | Essencial | ✅ | RN-12 |
| **RF-AGD-06** | A Agenda deve ser **paginada** (10/página); no mobile, a navegação fica fixa acima da bottom-nav. | Média | ✅ | SDD §9.3 |
| **RF-AGD-07** | A Agenda deve destacar/seccionar ordens **Atrasadas / Hoje / Próximos dias**. | Alta | ❌ | MVP10 |

### 3.7 Dashboard (RF-DSH) — admin

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-DSH-01** | O Dashboard deve ter um **seletor de competência** (mês/ano) que governa todos os dados. | Alta | ✅ | Protótipo |
| **RF-DSH-02** | O Dashboard deve exibir os KPIs do mês: **Agendadas**, **Pendente de Execução** (`AGENDAMENTO_PAGO`), **Pendente de Pagamento** (`REALIZADA`) e **Faturamento** (`PAGA` + `AGENDAMENTO_PAGO`). | Alta | ✅ | MVP05, RN-15 |
| **RF-DSH-03** | Os **KPI cards** devem ser clicáveis, filtrando a lista de ordens abaixo por status (drill-down). | Alta | ✅ | Protótipo |
| **RF-DSH-04** | A lista do Dashboard deve ser **ordenada com lógica**: sem filtro, pendentes primeiro (por data/hora), demais por número desc — nunca por ordem de inserção. | Essencial | ✅ | F05 |
| **RF-DSH-05** | A lista do Dashboard deve ser **paginada** (10/página). | Média | ✅ | SDD §9.4 |
| **RF-DSH-06** | O Dashboard deve oferecer **atalhos rápidos** (Nova Ordem, Novo Cliente, Ver Agenda de Hoje). | Média | ❌ | MVP15 |
| **RF-DSH-07** | O Dashboard deve exibir contadores contextuais adicionais (clientes ativos, total pendente a receber, ordens de hoje/semana). | Média | ⚠️ | MVP05 |

### 3.8 Relatórios (RF-REL) — admin

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-REL-01** | Os relatórios devem considerar ordens `PAGA` filtráveis por **intervalo de meses, tipo de serviço e funcionário** (filtros combináveis). | Alta | ✅ | Protótipo |
| **RF-REL-02** | Os relatórios devem exibir **faturamento total**, **quantidade de ordens pagas** e **receita por tipo de serviço** (ranking desc). | Alta | ✅ | RN-15 |
| **RF-REL-03** | Os relatórios devem exibir **receita por mês** como gráfico de barras em tela. | Alta | ✅ | Protótipo |
| **RF-REL-04** | O **período inicial** dos relatórios deve ser **calculado dinamicamente** (ex.: últimos 6 meses até o mês atual), não hardcoded. | Alta | ❌ | F11 |
| **RF-REL-05** | O botão **"Limpar filtros"** deve limpar apenas serviço e funcionário, **preservando o período** selecionado. | Média | ❌ | F15 |
| **RF-REL-06** | Os relatórios devem oferecer visão de **cancelamentos** (taxa de cancelamento / comparativo agendadas × realizadas × canceladas). | Média | ❌ | F13 |
| **RF-REL-07** | Os relatórios devem permitir **impressão/exportação em PDF** via `window.print()` com CSS de impressão dedicado. | Média | ❌ | MVP08 |

### 3.9 Transversais / UX (RF-UX)

| ID | Requisito | Prioridade | Status | Origem |
|---|---|---|---|---|
| **RF-UX-01** | Todas as **datas** devem ser exibidas no formato brasileiro `DD/MM/AAAA`; meses de relatório como `Mmm/AAAA`. | Essencial | ✅ | F01 |
| **RF-UX-02** | Todos os **valores monetários** devem ser exibidos no padrão brasileiro `R$ 0.000,00` (vírgula decimal), de forma **consistente em todas as telas**. | Essencial | ⚠️ | F06 |
| **RF-UX-03** | O sistema deve exibir **feedback de sucesso** (toast/snackbar ~3s) após salvar registros. | Alta | ❌ | F10 |
| **RF-UX-04** | Campos **obrigatórios** devem ser sinalizados com asterisco (`*`) de forma consistente em todos os formulários. | Média | ✅ | F14 (n/a serviço) |
| **RF-UX-05** | Listas vazias devem exibir mensagem **orientadora** (ex.: "Nenhuma ordem agendada. Clique em '+ Nova ordem' para criar a primeira."). | Média | ❌ | MVP16 |
| **RF-UX-06** | A navegação deve ser **responsiva**: topbar no desktop (> 700px) e bottom-nav fixa + botão "Opções" no mobile (≤ 700px). | Essencial | ✅ | SDD §10.3 |
| **RF-UX-07** | As abas de navegação devem exibir **badge de contagem** (ex.: "Agenda (7)"). | Baixa | ❌ | MVP12 |
| **RF-UX-08** | O nome/marca da empresa deve ser **parametrizável** (variável de configuração), para personalizar a demonstração ao cliente. | Essencial | ⚠️ | MVP11 |
| **RF-UX-09** | Ações destrutivas (cancelar OS, inativar cliente, logout) devem exigir **modal de confirmação**. | Alta | ✅ | Protótipo |
| **RF-UX-10** | Os **dados de demonstração** (seed) devem ser realistas e cobrir o fluxo completo: ordens em todos os status, ao menos **um cliente inativo** e **uma ordem cancelada**, e variedade de serviços. | Média | ⚠️ | MVP14 |
| **RF-UX-11** | Registros ativos/inativos devem ter **distinção visual** (opacidade/badge). | Média | ✅ | Protótipo |

---

## 4. Regras de negócio

| ID | Regra | Requisitos afetados |
|---|---|---|
| **RN-01** | **Validação de CPF** por dígitos verificadores + máscara `###.###.###-##`. | RF-CLI-02 |
| **RN-02** | **CPF único** por cliente; cadastro/edição bloqueiam duplicata com mensagem amigável. | RF-CLI-12 |
| **RN-03** | **Telefone** com máscara `(00) 00000-0000` (celular) ou `(00) 0000-0000` (fixo). | RF-CLI-03 |
| **RN-04** | **Máquina de status da OS** (toggles bidirecionais): botão *Realizado* alterna `AGENDADA↔REALIZADA` e `AGENDAMENTO_PAGO↔PAGA`; botão *Pago* alterna `AGENDADA↔AGENDAMENTO_PAGO` e `REALIZADA↔PAGA`; *Cancelar* `AGENDADA→CANCELADA`; *Reativar* `CANCELADA→AGENDADA`. Transição validada no servidor. | RF-OS-08, RF-OS-09 |
| **RN-05** | **Edição de OS** permitida apenas em `AGENDADA` e `AGENDAMENTO_PAGO`; demais status são read-only (salvo toggles/cancelamento). | RF-OS-07 |
| **RN-06** | **Horário comercial**: agendamentos restritos a 08h–18h. | RF-OS-06 |
| **RN-07** | **Data futura**: data do serviço deve ser hoje ou futura na criação e na edição; comparação com data atual dinâmica. | RF-OS-04, RF-OS-05 |
| **RN-08** | **Itens da OS**: ≥ 1 item; `qtd ≥ 1`; `valor` unitário informado manualmente. | RF-OS-03 |
| **RN-09** | **Snapshot**: `endereco` e `nome`/`valor` dos itens são gravados na OS na emissão; alterar cliente/catálogo não reescreve OS já emitidas. Exceção: ao editar OS, o endereço é regenerado do cadastro atual. | RF-OS-13 |
| **RN-10** | **Soft delete** de clientes e usuários (`ativo = false`); nunca exclusão física com vínculos. | RF-CLI-07, RF-USR-05 |
| **RN-11** | **Inativo não opera**: usuário inativo não loga; cliente inativo não é selecionável em nova OS. | RF-AUT-02, RF-CLI-07 |
| **RN-12** | **Isolamento do funcionário**: funcionário só vê/edita ordens onde é o responsável; nunca ordens de terceiros. | RF-AUT-04, RF-AGD-05 |
| **RN-13** | **E-mail único** de usuário; senha mínima de 6 caracteres. | RF-USR-02, RF-USR-03 |
| **RN-14** | **Pagamento exige forma**: transições para status pago requerem `formaPagamento` selecionada. | RF-OS-10 |
| **RN-15** | **Cálculos**: Total da OS = Σ(qtd × valor); KPIs e faturamento conforme RF-DSH-02; relatórios sobre ordens `PAGA`. Valores monetários em `Decimal` (nunca `float`). | RF-DSH-02, RF-REL-02 |
| **RN-16** | **Número de OS** sequencial, único e transacional (produção); no protótipo inicia em 132. | RF-OS-01 |

---

## 5. Requisitos de interface externa

### 5.1 Interfaces de usuário

- **RIU-01** — Interface web responsiva, breakpoint **700px**: desktop mostra topbar + tabelas; mobile mostra bottom-nav fixa + listas em card.
- **RIU-02** — Modais centralizados no desktop; slide-up a partir do rodapé no mobile.
- **RIU-03** — Paginação fixa acima da bottom-nav no mobile (`bottom: calc(60px + safe-area-inset)`), com padding no container.
- **RIU-04** — Mapa de cores de status padronizado:

  | Status | Label | Cor | Fundo |
  |---|---|---|---|
  | `AGENDADA` | Agendada | `#1a6fbb` | `#e8f3fc` |
  | `REALIZADA` | Serviço Realizado | `#1f7a3e` | `#e6f4ec` |
  | `AGENDAMENTO_PAGO` | Agendamento Pago | `#b85e1a` | `#fdf0e6` |
  | `PAGA` | Pagamento Recebido | `#5b3fa6` | `#eeebfb` |
  | `CANCELADA` | Cancelada | `#b83232` | `#fdeaea` |

- **RIU-05** — Formulários com validação por campo e mensagens de erro inline (equivalente a `FormGroup`/`erros`).

### 5.2 Interfaces de software

- **RIS-01** *(Fase 4)* — Integração com **ViaCEP** (HTTP) para autocompletar endereço por CEP.
- **RIS-02** *(Produção)* — **Google Maps** via URL (deep-link para navegação), sem SDK embarcado.
- **RIS-03** *(Produção)* — **PostgreSQL** via Prisma Client; **Auth.js** para sessão.

### 5.3 Interfaces de comunicação

- **RIC-01** *(Produção)* — HTTPS/TLS obrigatório em produção.
- **RIC-02** *(Produção)* — Mutations via Server Actions tipadas; leituras via data fetching no servidor.

---

## 6. Requisitos não-funcionais

### 6.1 Segurança (RNF-SEG)

| ID | Requisito |
|---|---|
| **RNF-SEG-01** | Senhas armazenadas com hash (bcrypt/argon2); nunca em texto puro nem retornadas ao cliente. |
| **RNF-SEG-02** | Autorização re-verificada no **servidor** em toda mutation e query sensível (nunca confiar na UI). |
| **RNF-SEG-03** | Validação Zod re-executada no servidor (defesa contra bypass do cliente). |
| **RNF-SEG-04** | IDs `cuid()` para evitar enumeração; proteção CSRF (Auth.js/Server Actions); queries parametrizadas (Prisma). |
| **RNF-SEG-05** | Segredos (`DATABASE_URL`, `AUTH_SECRET`) via ambiente/secret manager, nunca no repositório. |

### 6.2 Desempenho e escala (RNF-DES)

| ID | Requisito |
|---|---|
| **RNF-DES-01** | Paginação no banco (`skip`/`take`), não em memória. |
| **RNF-DES-02** | Agregações de dashboard/relatório via `groupBy`/`aggregate` no banco. |
| **RNF-DES-03** | Índices em campos de filtro/ordenação (status, data, clienteId, funcionarioId, nome). |
| **RNF-DES-04** | Server Components + streaming para reduzir JS no cliente. |

### 6.3 Usabilidade (RNF-USA)

| ID | Requisito |
|---|---|
| **RNF-USA-01** | Formatos brasileiros (data, moeda, telefone, CEP) consistentes em todo o sistema. |
| **RNF-USA-02** | Feedback imediato de sucesso/erro (toast) em toda operação de escrita. |
| **RNF-USA-03** | Interface autoexplicativa; mínimo de cliques para tarefas frequentes (atalhos no Dashboard). |
| **RNF-USA-04** | Mensagens de erro amigáveis, sem vazar detalhes internos. |

### 6.4 Confiabilidade (RNF-CON)

| ID | Requisito |
|---|---|
| **RNF-CON-01** | Geração de `Ordem.numero` transacional (sem duplicatas/corridas). |
| **RNF-CON-02** | Backups automatizados do PostgreSQL (sustentação). |
| **RNF-CON-03** | Migrations versionadas (`prisma migrate`); sem alterações de schema fora de migration. |

### 6.5 Manutenibilidade (RNF-MAN)

| ID | Requisito |
|---|---|
| **RNF-MAN-01** | TypeScript `strict`, sem `any`; ESLint + Prettier. |
| **RNF-MAN-02** | Testes unitários da camada de domínio (máquina de status, CPF, cálculos). |
| **RNF-MAN-03** | Testes de integração das Server Actions críticas (criação de OS, transições, autorização). |
| **RNF-MAN-04** | Fonte única de validação (schemas Zod) reutilizada cliente/servidor. |

### 6.6 Portabilidade e compatibilidade (RNF-POR)

| ID | Requisito |
|---|---|
| **RNF-POR-01** | Compatível com navegadores modernos (últimas 2 versões de Chrome, Firefox, Safari, Edge). |
| **RNF-POR-02** | Empacotamento em Docker (build standalone) para deploy padronizado. |
| **RNF-POR-03** | Fuso horário: datas de serviço tratadas como locais (Brasil), sem deslocamento de dia. |

### 6.7 Observabilidade (RNF-OBS)

| ID | Requisito |
|---|---|
| **RNF-OBS-01** | Log estruturado de erros do servidor. |
| **RNF-OBS-02** | Tratamento de erro amigável na UI sem expor stack/detalhes internos. |

---

## 7. Casos de uso

### CU-01 — Autenticar no sistema
- **Ator:** Administrador / Funcionário
- **Pré-condições:** Usuário cadastrado e ativo.
- **Fluxo principal:** 1) informa e-mail e senha; 2) sistema valida credenciais e status ativo; 3) sistema cria sessão e redireciona conforme papel (admin → Dashboard; funcionário → Agenda).
- **Exceções:** credenciais inválidas → mensagem de erro; usuário inativo → login bloqueado.
- **Requisitos:** RF-AUT-01..04.

### CU-02 — Cadastrar cliente
- **Ator:** Administrador
- **Fluxo principal:** 1) abre novo cliente; 2) preenche dados com máscaras (CPF, telefone, CEP) e complemento; 3) sistema valida CPF (dígitos + unicidade); 4) salva; 5) exibe toast de sucesso.
- **Exceções:** CPF inválido ou duplicado → erro no campo.
- **Requisitos:** RF-CLI-01..05, RF-CLI-12, RF-UX-03.

### CU-03 — Criar ordem de serviço
- **Ator:** Administrador
- **Pré-condições:** Existe ao menos um cliente ativo e um funcionário.
- **Fluxo principal:** 1) abre nova OS; 2) seleciona cliente por autocomplete; 3) seleciona funcionário; 4) informa data (futura) e hora (08–18h); 5) adiciona ≥ 1 item (tipo, descrição, qtd, valor); 6) opcionalmente observações/forma de pagamento; 7) sistema gera número sequencial, grava snapshot de endereço e salva.
- **Exceções:** data no passado / hora fora do comercial → erro; nenhum item → erro; conflito de horário do funcionário → aviso (não bloqueia).
- **Requisitos:** RF-OS-01..06, RF-OS-13, RF-OS-17.

### CU-04 — Registrar pagamento da OS
- **Ator:** Administrador
- **Fluxo principal:** 1) aciona botão *Pago*; 2) sistema exibe resumo e exige forma de pagamento; 3) confirma; 4) status avança (`AGENDADA→AGENDAMENTO_PAGO` ou `REALIZADA→PAGA`).
- **Exceções:** forma de pagamento não selecionada → confirmação desabilitada.
- **Requisitos:** RF-OS-09, RF-OS-10, RN-14.

### CU-05 — Marcar serviço como realizado (funcionário)
- **Ator:** Funcionário
- **Pré-condições:** OS atribuída ao funcionário.
- **Fluxo principal:** 1) na Agenda, localiza a OS do dia; 2) aciona "Realizado"; 3) status alterna `AGENDADA↔REALIZADA` (ou `AGENDAMENTO_PAGO↔PAGA`).
- **Requisitos:** RF-AGD-05, RF-OS-09, RN-04, RN-12.

### CU-06 — Consultar agenda do dia
- **Ator:** Administrador / Funcionário
- **Fluxo principal:** 1) abre Agenda; 2) filtra por status/funcionário/data; 3) sistema exibe ordens agrupadas por dia, com seções Atrasadas/Hoje/Próximos.
- **Requisitos:** RF-AGD-01..07.

### CU-07 — Acompanhar KPIs no Dashboard
- **Ator:** Administrador
- **Fluxo principal:** 1) seleciona competência; 2) visualiza KPIs; 3) clica em um KPI para drill-down; 4) usa atalhos rápidos.
- **Requisitos:** RF-DSH-01..07.

### CU-08 — Gerar relatório de faturamento
- **Ator:** Administrador
- **Fluxo principal:** 1) abre Relatórios (período padrão dinâmico); 2) ajusta período/serviço/funcionário; 3) visualiza faturamento total, ranking por serviço e barras por mês; 4) imprime/exporta PDF.
- **Requisitos:** RF-REL-01..07.

### CU-09 — Inativar cliente com pendências
- **Ator:** Administrador
- **Fluxo principal:** 1) aciona inativar; 2) sistema informa quantidade de ordens agendadas e impacto; 3) confirma; 4) cliente marcado `ativo=false`, ordens preservadas.
- **Requisitos:** RF-CLI-07, RF-CLI-08, RN-10, RN-11.

### CU-10 — Gerenciar usuários
- **Ator:** Administrador
- **Fluxo principal:** criar/editar/inativar/reativar usuário e resetar senha; qualquer usuário redefine a própria senha.
- **Requisitos:** RF-USR-01..07.

---

## 8. Matriz de rastreabilidade

Vínculo entre os itens do relatório de pendências (`relatorio_final.md`), os requisitos desta ERS e o status verificado.

| Item do relatório | Requisito(s) ERS | Prioridade | Status |
|---|---|---|---|
| F01 — Data BR | RF-UX-01 | Essencial | ✅ |
| F02 — Máscara telefone | RF-CLI-03 | Essencial | ✅ |
| F03 — Data hardcoded | RF-OS-04 | Essencial | ✅ |
| F04 — Validação data na edição | RF-OS-05 | Essencial | ✅ |
| F05 — Ordenação Dashboard | RF-DSH-04 | Essencial | ✅ |
| F06 — Moeda BR | RF-UX-02 | Essencial | ⚠️ |
| F07 — Máscara CEP | RF-CLI-04 | Alta | ❌ |
| F08 — Agenda mostra realizadas | RF-AGD-03 | Alta | ✅ |
| F09 — Agenda agrupada por dia | RF-AGD-02 | Alta | ✅ |
| F10 — Toast de sucesso | RF-UX-03 | Alta | ❌ |
| F11 — Período dinâmico dos relatórios | RF-REL-04 | Alta | ❌ |
| F12 — Ações no detalhe da OS | RF-OS-11 | Alta | ✅ |
| F13 — Relatório de cancelamentos | RF-REL-06 | Média | ❌ |
| F14 — Asterisco no modal de serviço | RF-UX-04 (obsoleto) | — | ➖ |
| F15 — Limpar filtros sem resetar período | RF-REL-05 | Média | ❌ |
| F16 — Aviso ao inativar cliente | RF-CLI-08 | Média | ❌ |
| F17 — Autocomplete de cliente | RF-OS-02 | Alta | ✅ |
| F18 — Endereço dinâmico na edição | RF-OS-13 | Média | ✅ |
| MVP01 — Busca de clientes | RF-CLI-09 | Alta | ✅ |
| MVP02 — Filtro de ordens | RF-OS-14 / RF-OS-15 | Alta | ✅ / ⚠️ |
| MVP03 — Forma de pagamento | RF-OS-10, RF-OS-19 | Essencial | ✅ |
| MVP04 — Histórico por cliente | RF-CLI-11 | Alta | ✅ |
| MVP05 — Contadores no Dashboard | RF-DSH-02 / RF-DSH-07 | Alta | ✅ / ⚠️ |
| MVP06 — Complemento no endereço | RF-CLI-05 | Alta | ✅ |
| MVP07 — Aviso de conflito de horário | RF-OS-17 | Alta | ❌ |
| MVP08 — Impressão/PDF de relatórios | RF-REL-07 | Média | ❌ |
| MVP09 — Ordenação por coluna | RF-CLI-13 / RF-OS-20 | Média | ❌ |
| MVP10 — Indicador hoje/atrasada | RF-OS-18 / RF-AGD-07 | Alta | ❌ |
| MVP11 — Nome/marca parametrizável | RF-UX-08 | Essencial | ⚠️ |
| MVP12 — Badge de contagem nas abas | RF-UX-07 | Baixa | ❌ |
| MVP13 — "Esqueci minha senha" | RF-AUT-07 | Baixa | ❌ |
| MVP14 — Dados de exemplo realistas | RF-UX-10 | Média | ⚠️ |
| MVP15 — Atalhos rápidos no Dashboard | RF-DSH-06 | Média | ❌ |
| MVP16 — Mensagens de lista vazia | RF-UX-05 | Média | ❌ |

**Resumo quantitativo:** 34 itens do relatório → **16 ✅ Implementados**, **4 ⚠️ Parciais** (F06, MVP11, MVP14 e o par MVP02/MVP05), **13 ❌ Pendentes**, **1 ➖ N/A** (F14).

---

## 9. Backlog de pendências priorizado

Requisitos ainda **não** plenamente atendidos, ordenados por prioridade para orientar a próxima iteração.

### 9.1 Essencial (antes da demonstração)

| Requisito | Item | Descrição | Esforço est. |
|---|---|---|---|
| RF-UX-02 | F06 | Padronizar **toda** exibição monetária em `R$ 0.000,00` (função `fmtMoeda`) — hoje só 2 de ~14 pontos usam vírgula. | 15 min |
| RF-UX-08 | MVP11 | Extrair o nome da empresa para **variável de configuração** parametrizável. | 5 min |

### 9.2 Alta (MVP robusto)

| Requisito | Item | Descrição | Esforço est. |
|---|---|---|---|
| RF-CLI-04 | F07 | Máscara de CEP `00000-000` (`fmtCEP`). | 10 min |
| RF-UX-03 | F10 | Toast de feedback ao salvar. | 30 min |
| RF-REL-04 | F11 | Período de relatórios calculado dinamicamente. | 10 min |
| RF-OS-17 | MVP07 | Aviso (não bloqueio) de conflito de horário do funcionário. | 30 min |
| RF-OS-18 / RF-AGD-07 | MVP10 | Destaque de ordens de hoje/atrasadas e seções na Agenda. | 25 min |
| RF-OS-15 | MVP02 | Completar filtro por status na lista de ordens. | 15 min |

### 9.3 Média (próxima iteração)

| Requisito | Item | Descrição | Esforço est. |
|---|---|---|---|
| RF-REL-06 | F13 | Relatório/visão de cancelamentos. | 40 min |
| RF-REL-05 | F15 | "Limpar filtros" preservando o período. | 10 min |
| RF-CLI-08 | F16 | Aviso de ordens agendadas ao inativar cliente. | 15 min |
| RF-REL-07 | MVP08 | Impressão/exportação PDF (`window.print`). | 45 min |
| RF-CLI-13 / RF-OS-20 | MVP09 | Ordenação por coluna nas tabelas. | 40 min |
| RF-DSH-06 | MVP15 | Atalhos rápidos no Dashboard. | 20 min |
| RF-UX-05 | MVP16 | Mensagens orientadoras em listas vazias. | 10 min |
| RF-UX-10 | MVP14 | Dados de seed com cliente inativo e ordem cancelada. | 20 min |
| RF-DSH-07 | MVP05 | Contadores contextuais extras no Dashboard. | 20 min |

### 9.4 Baixa (evolução)

| Requisito | Item | Descrição | Esforço est. |
|---|---|---|---|
| RF-UX-07 | MVP12 | Badge de contagem nas abas. | 15 min |
| RF-AUT-07 | MVP13 | Link "Esqueci minha senha" (modal informativo). | 10 min |
| RF-CLI-14 | — | Autocompletar endereço por CEP (ViaCEP, Fase 4). | Fase 4 |
| RF-SRV-03 | — | Administração do catálogo de serviços pela UI. | A definir |

> Requisitos **exclusivos de produção** (RF-AUT-08/09, RNF-SEG-*, RNF-DES-*, RNF-CON-*, etc.) não constam do backlog do protótipo por dependerem da stack de produção definida no `SDD.md`; são pré-condições da Fase 1 de implementação.

---

## 10. Apêndices

### 10.1 Estados da OS (referência)

```
        ┌───────────── Pago ─────────────┐
        ▼                                 ▲
   AGENDAMENTO_PAGO                    AGENDADA ──cancelar──> CANCELADA
        ▲                                 ▲                      │
     Realizado                         Realizado             reativar
        ▼                                 ▼                      │
      PAGA <────── Pago ──────────── REALIZADA <────────────────┘ (para AGENDADA)
```

### 10.2 Formas de pagamento (enum)

`PIX`, `DÉBITO`, `CRÉDITO À VISTA`, `CRÉDITO 1x`, `CRÉDITO 2x`, `CRÉDITO 3x`, `CRÉDITO 4x`, `CRÉDITO 5x`, `CRÉDITO 6x`.

### 10.3 Questões em aberto

1. **Administração do catálogo de serviços no MVP** (RF-SRV-03) — modelagem já suporta tabela `Servico`; confirmar se entra no MVP.
2. **Numeração de OS** — tabela `Contador` dedicada vs. `max(numero)+1` transacional (Fase 2).
3. **Valor monetário** — `Decimal(10,2)` (recomendado) vs. centavos em inteiro.
4. **Política de sessão** — expiração e "lembrar-me" (Fase 1).
5. **Escopo de busca de clientes** — RF-CLI-09 exige nome; incluir CPF/telefone na busca? (recomendado).
6. **Contadores extras do Dashboard** (RF-DSH-07) — definir métricas finais (clientes ativos, total a receber, ordens de hoje/semana).

### 10.4 Histórico de revisões

| Versão | Data | Descrição |
|---|---|---|
| 1.0 | Jul/2026 | Baseline inicial consolidando protótipo, relatório de pendências e SDD. |

---

*Especificação de Requisitos de Software (ERS) — fonte de verdade dos requisitos do Sistema de Gestão para Lavanderia. Complementa o `SDD.md` (design) e o `relatorio_final.md` (pendências).*
