# ERS — Especificação de Requisitos de Software

## Sistema de Gestão para Lavanderia ("Sistema de Lavanderia")

> **Norma de referência:** ISO/IEC/IEEE 29148:2018 (adaptação do modelo IEEE 830).
> **Versão do documento:** 2.0
> **Data:** Julho de 2026
> **Situação:** Baseline de requisitos para **implementação do zero** (greenfield). Nenhum requisito é considerado entregue.
> **Autor:** Equipe de desenvolvimento

---

## ⚠️ Premissa fundamental desta versão

O que existe hoje é **apenas um protótipo descartável** (`src/App.jsx`, React + Vite, dados em memória), construído para **validar fluxo e interface** junto ao cliente. Ele **não é a base do produto**: o sistema será **construído do zero** sobre a stack definida no `SDD.md`.

Portanto, nesta versão do documento:

- **Nenhum requisito está marcado como "implementado"**. Todos os requisitos desta ERS estão **a construir**.
- O protótipo passa a ter um único papel: **referência de comportamento e de UI** para requisitos que ele já demonstrou visualmente. Isso é registrado na coluna **Referência**, que indica **maturidade da especificação** — não progresso de implementação.
- O antigo "backlog de pendências" (§9) foi substituído por um **catálogo priorizado completo**, que serve de insumo direto para a construção do roadmap de implementação.

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
9. [Catálogo priorizado de requisitos (insumo do roadmap)](#9-catálogo-priorizado-de-requisitos-insumo-do-roadmap)
10. [Apêndices](#10-apêndices)

---

## 1. Introdução

### 1.1 Propósito

Este documento (ERS — Especificação de Requisitos de Software) define **o que** o Sistema de Gestão para Lavanderia deve fazer: seus requisitos funcionais, regras de negócio, requisitos de interface e requisitos não-funcionais. Enquanto o `SDD.md` descreve **como** construir o sistema (arquitetura, stack, modelo de dados), esta ERS é a **fonte de verdade dos requisitos** — o contrato do que precisa existir para o produto ser considerado completo.

A especificação consolida três fontes:

1. O **comportamento validado com o cliente** no protótipo descartável (`src/App.jsx`, ~2.006 linhas, React + Vite, dados em memória) — usado como **referência de fluxo e UI**, não como código de partida.
2. O **relatório de avaliação do protótipo** (itens `F01`–`F18` e `MVP01`–`MVP16`), que originou boa parte dos requisitos aqui formalizados.
3. As **decisões de design** do `SDD.md` (stack de produção, modelo de dados, segurança).

Cada requisito recebe um identificador estável, uma **prioridade** e uma marcação de **referência** (se há ou não comportamento já desenhado no protótipo). Todos os requisitos são **a construir** — o documento não rastreia progresso de implementação; esse rastreamento pertence ao roadmap e ao controle de tarefas, que serão derivados desta baseline.

### 1.2 Escopo do produto

O **Sistema de Lavanderia** é uma aplicação web responsiva de gestão operacional para lavanderias/higienizadoras de estofados. Objetivos:

- **Centralizar** o cadastro de clientes e o histórico de atendimentos.
- **Controlar** ordens de serviço (OS) da criação ao pagamento, com máquina de status bem definida.
- **Organizar** a agenda de execução em campo, por dia e por funcionário.
- **Fornecer** visão gerencial (KPIs e faturamento) ao administrador.

O produto **não** contempla (fora de escopo, conforme `proposta_completa.md`): emissão fiscal (NFS-e), gateway de pagamento, app nativo, mensageria automática (WhatsApp/SMS/e-mail), anexo de fotos, multi-empresa/filial, controle de estoque, exportação avançada (BI) e precificação automática. A **consulta automática de CEP (ViaCEP)** está prevista apenas para a Fase 4 de produção.

> **Exceção — Envio manual da OS por WhatsApp (em escopo):** o compartilhamento **sob demanda** do PDF de uma Ordem de Serviço pelo WhatsApp — acionado **manualmente** pelo usuário, gerado **no cliente (navegador)**, **sem servidor de mensageria** e **sem armazenamento do arquivo** — **está em escopo** (ver RF-OS-21..24 e RN-17). Permanece **fora de escopo** a **mensageria automática** (envio disparado por eventos/agendamento, campanhas, confirmações automáticas, SMS/e-mail). A distinção é: o sistema apenas **gera e abre** o compartilhamento; **quem envia é o usuário**, pelo próprio WhatsApp.

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
| **Protótipo** | Aplicação descartável de validação (`src/App.jsx`), sem persistência. **Não** é base de código do produto. |
| **PDF da OS** | Documento PDF da Ordem de Serviço gerado **sob demanda** no navegador, sem persistência, exclusivamente para envio ao cliente. |
| **Stateless** | Operação **sem estado persistente**: o PDF é montado em memória no cliente e descartado após o envio; nada é gravado em disco/banco. |
| **WhatsApp deep link** | URL `https://wa.me/<telefone>?text=…` (ou `api.whatsapp.com`) que abre uma conversa com número e **texto** pré-preenchidos. Carrega apenas texto — **não** anexa arquivos. |
| **Web Share API** | API do navegador (`navigator.share` / `navigator.canShare`) que abre a folha de compartilhamento nativa; em nível 2 permite **compartilhar arquivos** (ex.: o PDF) diretamente para o WhatsApp. |

### 1.4 Convenções de identificação

| Prefixo | Categoria |
|---|---|
| `RF-<MÓD>-nn` | Requisito funcional, agrupado por módulo (AUT, USR, CLI, SRV, OS, AGD, DSH, REL, UX). |
| `RN-nn` | Regra de negócio. |
| `RNF-nn` | Requisito não-funcional. |
| `CU-nn` | Caso de uso. |
| `RES-nn` | Restrição de projeto. |
| `SUP-nn` | Suposição / dependência. |
| `PT-nn` | Pré-requisito técnico (§9.1). |

**Prioridade** (MoSCoW adaptado ao produto de produção):

- **Essencial** — obrigatório para a primeira versão utilizável em produção; sem ele o sistema não opera.
- **Alta** — necessário para um MVP robusto; entra logo após o núcleo essencial.
- **Média** — agrega valor operacional; pode ficar para iteração seguinte.
- **Baixa** — desejável / evolução futura.

**Referência** (maturidade da especificação — **não** é status de implementação):

- **Protótipo** — o comportamento foi desenhado e validado no protótipo; há referência visual/funcional a seguir na construção.
- **Protótipo (parcial)** — o protótipo demonstra parte do comportamento; o requisito exige definição complementar antes de implementar.
- **Novo** — sem referência no protótipo; exige especificação de UI/regra antes de implementar.

> **Todos os requisitos deste documento estão a construir.** A coluna Referência indica apenas quanto trabalho de definição resta antes de codificar.

### 1.5 Documentos relacionados

| Documento | Conteúdo |
|---|---|
| `SDD.md` | Documento de Design (arquitetura, stack, modelo de dados, API). |
| `proposta.md` / `proposta_completa.md` | Proposta técnica e comercial (escopo, fases, exclusões). |
| `relatorio_final.md` | Relatório de avaliação do protótipo (origem dos itens `F`/`MVP`). |
| `CLAUDE.md` | Documentação de arquitetura do **protótipo** (referência de comportamento, não do produto). |
| `src/App.jsx` | Protótipo descartável — **referência de fluxo e UI**, não base de código. |

---

## 2. Descrição geral

### 2.1 Perspectiva do produto

O produto substitui controles informais (cadernos, planilhas, grupos de WhatsApp) por um sistema web único, acessível por navegador, sem instalação. É um sistema **standalone** de unidade única (não multi-filial), com dois perfis de acesso e um fluxo central em torno da Ordem de Serviço.

**Estado atual:** apenas um **protótipo de validação** com dados em memória (reset a cada refresh), sem persistência, sem autenticação real e sem servidor. Ele será **descartado**.

**Estado-alvo:** produto construído **do zero** conforme o `SDD.md` — persistência em PostgreSQL, autenticação real, autorização no servidor e tipagem ponta-a-ponta. Esta ERS especifica **integralmente** esse produto-alvo: toda funcionalidade descrita aqui precisa ser construída, inclusive as que o protótipo já exibia.

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
- **RES-03** — Sem integração fiscal, gateway de pagamento ou mensageria automática.
- **RES-04** — Valor monetário sempre informado manualmente por item (sem precificação automática).
- **RES-05** — Stack de produção definida no `SDD.md` (Next.js 15, TypeScript strict, Prisma + PostgreSQL, Zod, Auth.js, Tailwind + shadcn/ui).
- **RES-06** — Datas de serviço são locais (Brasil); armazenamento/exibição devem evitar deslocamento de dia por timezone.
- **RES-07** — A geração do **PDF da OS** é **stateless**: ocorre **sob demanda no cliente**, apenas no momento do envio, **sem armazenamento** do arquivo (nem local, nem em servidor/banco) e sem servidor de mensageria.
- **RES-08** — **Construção do zero**: o código do protótipo (`src/App.jsx`) **não** é reaproveitado. Ele serve exclusivamente como referência de comportamento e de layout; nenhuma decisão técnica do protótipo (estado em memória, CSS em template literal, arquivo único) é vinculante.

### 2.6 Suposições e dependências

- **SUP-01** — Cada OS tem exatamente **um** funcionário responsável.
- **SUP-02** — O catálogo de serviços é pequeno e estável (seed inicial de 4 tipos); administração do catálogo pela UI está em aberto (§10.3).
- **SUP-03** — A consulta de CEP (ViaCEP) depende de serviço externo e só entra na Fase 4.
- **SUP-04** — O número de OS é sequencial de negócio, único e visível ao usuário.
- **SUP-05** — As decisões em aberto do §10.3 devem ser fechadas antes de iniciar os requisitos que elas bloqueiam (§9.7), pois afetam modelagem de dados e escopo.

---

## 3. Requisitos funcionais

> **Todos os requisitos abaixo estão a construir.** A coluna **Referência** indica a maturidade da especificação: *Protótipo* (comportamento já desenhado e validado), *Protótipo (parcial)* (exige definição complementar) ou *Novo* (exige especificação antes de codificar).
> A coluna **Origem** referencia o item do `relatorio_final.md` (`F`/`MVP`), o `SDD.md` ou o protótipo, quando aplicável.

### 3.1 Autenticação e controle de acesso (RF-AUT)

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-AUT-01** | O sistema deve autenticar o usuário por **e-mail + senha**, validando contra a base de usuários. | Essencial | Protótipo | SDD §8 |
| **RF-AUT-02** | O sistema deve **bloquear o login** de usuário inativo (`ativo === false`). | Essencial | Protótipo | RN-11 |
| **RF-AUT-03** | O sistema deve aplicar **RBAC** com dois papéis (admin/funcionário), controlando abas, rotas e ações visíveis. | Essencial | Protótipo | SDD §8.2 |
| **RF-AUT-04** | O funcionário deve ser **redirecionado/limitado** à Agenda, sem acesso a módulos de admin. | Essencial | Protótipo | RN-12 |
| **RF-AUT-05** | O sistema deve exibir **confirmação de logout** antes de encerrar a sessão. | Média | Protótipo | Protótipo |
| **RF-AUT-06** | A tela de login deve exibir **credenciais de demonstração** apenas em ambiente de demo (nunca em produção). | Baixa | Protótipo | Protótipo |
| **RF-AUT-07** | A tela de login deve oferecer o link **"Esqueci minha senha"** (no produto final, com envio de e-mail de recuperação). | Baixa | Novo | MVP13 |
| **RF-AUT-08** | Senhas devem ser armazenadas com **hash** (bcrypt/argon2); nunca em texto puro nem retornadas ao cliente. | Essencial | Novo | SDD §8.3 |
| **RF-AUT-09** | A sessão deve usar **cookie httpOnly + JWT** com expiração configurável; rotas autenticadas protegidas por middleware. | Essencial | Novo | SDD §8.1 |

> **Nota:** RF-AUT-08 e RF-AUT-09 eram tratados como "exclusivos de produção" na versão 1.x. Como o sistema agora é construído do zero diretamente sobre a stack de produção, ambos são **Essenciais** e integram o núcleo de autenticação.

### 3.2 Gestão de usuários (RF-USR) — admin

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-USR-01** | O admin deve **listar** usuários, com indicação visual de papel e de situação (ativo/inativo). | Alta | Protótipo | Protótipo |
| **RF-USR-02** | O admin deve **criar** usuário (nome, e-mail, senha ≥ 6, papel). | Alta | Protótipo | SDD §9.6 |
| **RF-USR-03** | O sistema deve garantir **e-mail único** de usuário — unicidade forte no banco (`@@unique`) + mensagem amigável ("E-mail já cadastrado"). | Alta | Protótipo (parcial) | RN-13 |
| **RF-USR-04** | O admin deve **editar** nome e e-mail de um usuário. | Alta | Protótipo | Protótipo |
| **RF-USR-05** | O admin deve **inativar/reativar** usuário (soft delete). | Alta | Protótipo | RN-10 |
| **RF-USR-06** | O admin deve **resetar a senha** de outro usuário (mínimo 6 caracteres). | Alta | Protótipo | Protótipo |
| **RF-USR-07** | Qualquer usuário autenticado deve **redefinir a própria senha**. | Alta | Protótipo | Protótipo |

> **Nota sobre RF-USR-03:** o protótipo apenas verificava duplicidade em memória. No produto, a unicidade deve ser garantida por constraint de banco, com o erro traduzido em mensagem amigável na UI.

### 3.3 Clientes (RF-CLI) — admin

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-CLI-01** | O admin deve **cadastrar** cliente com nome, sobrenome, CPF, telefone, e-mail e endereço completo. | Essencial | Protótipo | Protótipo |
| **RF-CLI-02** | O CPF deve ter **validação de dígitos verificadores** e **máscara** `###.###.###-##`. | Essencial | Protótipo | RN-01 |
| **RF-CLI-03** | O telefone deve ter **máscara** `(00) 00000-0000` (celular) ou `(00) 0000-0000` (fixo). | Essencial | Protótipo | F02, RN-03 |
| **RF-CLI-04** | O CEP deve ter **máscara** `00000-000`. | Alta | Novo | F07 |
| **RF-CLI-05** | O endereço deve incluir o campo **Complemento** (Apto, Bloco, Fundos). | Alta | Protótipo | MVP06 |
| **RF-CLI-06** | O admin deve **editar** o cadastro de um cliente. | Essencial | Protótipo | Protótipo |
| **RF-CLI-07** | O admin deve **inativar/reativar** cliente (soft delete); cliente inativo não é selecionável em nova OS. | Alta | Protótipo | RN-10, RN-11 |
| **RF-CLI-08** | Ao inativar cliente com ordens **agendadas**, a confirmação deve informar a **quantidade** de ordens pendentes e o impacto. | Média | Novo | F16 |
| **RF-CLI-09** | A lista de clientes deve ter **busca** por nome (definir se inclui CPF/telefone — §10.3). | Alta | Protótipo | MVP01 |
| **RF-CLI-10** | A lista de clientes deve ser **paginada** (10/página), com paginação executada no banco. | Alta | Protótipo | SDD §9.1, RNF-DES-01 |
| **RF-CLI-11** | O admin deve acessar o **histórico de ordens** de um cliente (read-only). | Alta | Protótipo | MVP04 |
| **RF-CLI-12** | O CPF deve ser **único** por cliente — unicidade no banco + bloqueio amigável em cadastro/edição ("Este CPF já está registrado"). | Alta | Protótipo (parcial) | RN-02 |
| **RF-CLI-13** | As tabelas de clientes devem permitir **ordenação por coluna** (nome, etc.) com indicador visual ▲/▼. | Média | Novo | MVP09 |
| **RF-CLI-14** | *(Fase 4)* Ao digitar o CEP, o sistema deve **autocompletar o endereço** via ViaCEP. | Baixa | Novo | SDD §9.1 |

### 3.4 Catálogo de serviços (RF-SRV)

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-SRV-01** | O sistema deve manter um **catálogo de tipos de serviço** persistido em banco, para seleção rápida na OS. | Essencial | Protótipo (parcial) | Protótipo |
| **RF-SRV-02** | O catálogo inicial (seed) deve conter os tipos: Limpeza e Higienização, Impermeabilização, Lavagem de Tapetes, Lavagem de Cortinas. | Essencial | Protótipo | SDD §13 |
| **RF-SRV-03** | O admin deve **gerenciar** o catálogo (criar/ativar/desativar tipos) pela UI. | Baixa | Novo | SDD §16.2 |

> **Nota:** no protótipo o catálogo era uma constante em código e não havia tela de Serviços. No produto ele é **tabela do banco** desde o início — daí RF-SRV-01 ser *parcial*: o comportamento de seleção é conhecido, mas a fonte de dados muda. A inclusão da **tela de administração** do catálogo (RF-SRV-03) no MVP permanece em aberto (§10.3). O item `F14` do relatório (asterisco no modal de serviço) fica absorvido pela regra geral RF-UX-04.

### 3.5 Ordens de serviço (RF-OS)

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-OS-01** | O sistema deve **criar OS** com número sequencial automático, cliente, funcionário, data, hora, itens, observações e forma de pagamento. | Essencial | Protótipo | Protótipo, RN-16 |
| **RF-OS-02** | A seleção de cliente deve usar **autocomplete**: ao focar sem texto, exibir os 5 clientes mais recentes; ao digitar, buscar clientes ativos (máx. 10). | Alta | Protótipo | F17 |
| **RF-OS-03** | Cada OS deve conter **≥ 1 item de serviço**, cada um com tipo (catálogo ou nome customizado), descrição do objeto, quantidade (≥ 1) e valor unitário manual. | Essencial | Protótipo | RN-08 |
| **RF-OS-04** | A data da OS deve ser validada como **hoje ou futura** na **criação**, comparando com a data atual dinâmica (nunca valor hardcoded). | Essencial | Protótipo | F03, RN-07 |
| **RF-OS-05** | A **edição** de OS deve aplicar a **mesma validação de data** da criação. | Essencial | Protótipo | F04 |
| **RF-OS-06** | A hora da OS deve respeitar o **horário comercial 08h–18h**. | Alta | Protótipo | RN-06 |
| **RF-OS-07** | A edição de OS deve ser permitida **apenas** nos status `AGENDADA` e `AGENDAMENTO_PAGO`, com a regra revalidada no servidor. | Alta | Protótipo | RN-05 |
| **RF-OS-08** | O sistema deve **cancelar** OS (somente a partir de `AGENDADA`) e **reativar** OS cancelada para `AGENDADA`. | Alta | Protótipo | RN-04 |
| **RF-OS-09** | O sistema deve permitir **avançar/retroceder status** via toggles bidirecionais ("Realizado" e "Pago"), conforme a máquina de status (RN-04), com a transição validada no servidor. | Essencial | Protótipo | RN-04 |
| **RF-OS-10** | Ao registrar pagamento (`AGENDADA→AGENDAMENTO_PAGO` ou `REALIZADA→PAGA`), o sistema deve **exigir a forma de pagamento** antes de confirmar. | Essencial | Protótipo | MVP03, RN-14 |
| **RF-OS-11** | O **detalhe da OS** deve oferecer ações contextuais por status (Editar, Cancelar, Fechar) e **edição** para `AGENDADA`/`AGENDAMENTO_PAGO`. | Alta | Protótipo | F12 |
| **RF-OS-12** | O detalhe da OS deve exibir botão **Google Maps** que abre URL construída do endereço da OS + cidade/estado do cliente. | Média | Protótipo | Protótipo |
| **RF-OS-13** | O **endereço** da OS deve ser **snapshot** no momento da criação; ao **editar** a OS, o endereço deve ser **regenerado** a partir do cadastro atual do cliente. | Média | Protótipo | F18, RN-09 |
| **RF-OS-14** | A lista de ordens deve ter **filtros combináveis**: nome do cliente, data início, data fim. | Alta | Protótipo | MVP02 |
| **RF-OS-15** | A lista de ordens deve permitir **filtro por status** (Todas/Agendadas/Realizadas/Pagas/Canceladas), combinável com os demais filtros. | Alta | Protótipo (parcial) | MVP02 |
| **RF-OS-16** | A lista de ordens deve ser **paginada** (10/página) e voltar à primeira página ao mudar filtros. | Alta | Protótipo | SDD §9.2 |
| **RF-OS-17** | O sistema deve **avisar** (sem bloquear) sobre **conflito de horário** do mesmo funcionário no mesmo dia/hora. | Alta | Novo | MVP07 |
| **RF-OS-18** | Ordens de **hoje** e **atrasadas** devem receber **destaque visual** (badge/ícone) nas listas e na Agenda. | Alta | Novo | MVP10 |
| **RF-OS-19** | A forma de pagamento registrada deve ser **exibida** no detalhe da OS e considerada nos relatórios. | Alta | Protótipo | MVP03 |
| **RF-OS-20** | As tabelas de ordens devem permitir **ordenação por coluna** (data, valor, status) com indicador ▲/▼. | Média | Novo | MVP09 |
| **RF-OS-21** | O detalhe da OS deve oferecer a ação **"Enviar por WhatsApp"**, que **gera o PDF da OS sob demanda** e o disponibiliza para envio ao cliente. A geração deve ocorrer **somente** no acionamento (não antes) e o arquivo **não deve ser armazenado** (stateless). | Alta | Novo | Nova |
| **RF-OS-22** | O **PDF da OS** deve conter, no mínimo: número da OS, dados da lavanderia (nome/marca parametrizável), dados do cliente (nome, telefone, endereço), data/hora do serviço, funcionário responsável, **itens** (tipo, descrição do objeto, qtd, valor unitário e subtotal), **total** da OS, forma de pagamento (quando houver), status e observações. Valores em `R$ 0.000,00` e datas em `DD/MM/AAAA`. | Alta | Novo | Nova |
| **RF-OS-23** | O envio deve usar preferencialmente a **Web Share API** (`navigator.share` com o PDF como arquivo); onde indisponível (ex.: desktop), o sistema deve **baixar o PDF** e **abrir um WhatsApp deep link** (`wa.me/<telefone do cliente>`) com **texto pré-preenchido**, cabendo ao usuário anexar o arquivo baixado. O telefone é obtido do cadastro do cliente e normalizado para o formato `wa.me`. | Alta | Novo | Nova |
| **RF-OS-24** | O fluxo de envio deve ser **stateless de ponta a ponta**: o PDF é montado em memória no cliente e **descartado** após o compartilhamento/download; o sistema **não persiste** o PDF, seu conteúdo ou o histórico de envios. | Essencial\* | Novo | Nova |

> **\* RF-OS-24** é uma **restrição condicionada**: não gera trabalho isolado, mas é **obrigatória sempre que** RF-OS-21..23 forem construídos. No roadmap, deve ser tratada como critério de aceite do bloco de envio por WhatsApp, não como item independente.

### 3.6 Agenda (RF-AGD)

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-AGD-01** | A Agenda deve listar ordens **ordenadas por data + hora**. | Alta | Protótipo | Protótipo |
| **RF-AGD-02** | A Agenda deve **agrupar por dia** com separadores legíveis ("3 de Junho de 2026"). | Alta | Protótipo | F09 |
| **RF-AGD-03** | A Agenda deve filtrar por status operacional **Agendado / Realizado / Pago**, cada um mapeando um conjunto de status da máquina (RN-04). | Alta | Protótipo | F08 |
| **RF-AGD-04** | O admin deve dispor de filtros extras por **funcionário** e por **data específica**. | Alta | Protótipo | Protótipo |
| **RF-AGD-05** | O funcionário deve ver **apenas as próprias ordens** (restrição aplicada no servidor) e dispor do botão "Realizado" no card para toggle direto. | Essencial | Protótipo | RN-12 |
| **RF-AGD-06** | A Agenda deve ser **paginada** (10/página); no mobile, a navegação fica fixa acima da bottom-nav. | Média | Protótipo | SDD §9.3 |
| **RF-AGD-07** | A Agenda deve destacar/seccionar ordens **Atrasadas / Hoje / Próximos dias**. | Alta | Novo | MVP10 |

### 3.7 Dashboard (RF-DSH) — admin

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-DSH-01** | O Dashboard deve ter um **seletor de competência** (mês/ano) que governa todos os dados exibidos. | Alta | Protótipo | Protótipo |
| **RF-DSH-02** | O Dashboard deve exibir os KPIs do mês: **Agendadas**, **Pendente de Execução** (`AGENDAMENTO_PAGO`), **Pendente de Pagamento** (`REALIZADA`) e **Faturamento** (`PAGA` + `AGENDAMENTO_PAGO`). | Alta | Protótipo | MVP05, RN-15 |
| **RF-DSH-03** | Os **KPI cards** devem ser clicáveis, filtrando a lista de ordens abaixo por status (drill-down). | Alta | Protótipo | Protótipo |
| **RF-DSH-04** | A lista do Dashboard deve ter **ordenação definida**: sem filtro, pendentes primeiro (por data/hora), demais por número desc — nunca por ordem de inserção. | Essencial | Protótipo | F05 |
| **RF-DSH-05** | A lista do Dashboard deve ser **paginada** (10/página). | Média | Protótipo | SDD §9.4 |
| **RF-DSH-06** | O Dashboard deve oferecer **atalhos rápidos** (Nova Ordem, Novo Cliente, Ver Agenda de Hoje). | Média | Novo | MVP15 |
| **RF-DSH-07** | O Dashboard deve exibir contadores contextuais adicionais (clientes ativos, total pendente a receber, ordens de hoje/semana) — métricas finais a definir (§10.3). | Média | Protótipo (parcial) | MVP05 |

### 3.8 Relatórios (RF-REL) — admin

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-REL-01** | Os relatórios devem considerar ordens `PAGA` filtráveis por **intervalo de meses, tipo de serviço e funcionário** (filtros combináveis). | Alta | Protótipo | Protótipo |
| **RF-REL-02** | Os relatórios devem exibir **faturamento total**, **quantidade de ordens pagas** e **receita por tipo de serviço** (ranking desc). | Alta | Protótipo | RN-15 |
| **RF-REL-03** | Os relatórios devem exibir **receita por mês** como gráfico de barras em tela. | Alta | Protótipo | Protótipo |
| **RF-REL-04** | O **período inicial** dos relatórios deve ser **calculado dinamicamente** (ex.: últimos 6 meses até o mês atual), nunca hardcoded. | Alta | Novo | F11 |
| **RF-REL-05** | O botão **"Limpar filtros"** deve limpar apenas serviço e funcionário, **preservando o período** selecionado. | Média | Novo | F15 |
| **RF-REL-06** | Os relatórios devem oferecer visão de **cancelamentos** (taxa de cancelamento / comparativo agendadas × realizadas × canceladas). | Média | Novo | F13 |
| **RF-REL-07** | Os relatórios devem permitir **impressão/exportação em PDF** com CSS de impressão dedicado. | Média | Novo | MVP08 |

### 3.9 Transversais / UX (RF-UX)

| ID | Requisito | Prioridade | Referência | Origem |
|---|---|---|---|---|
| **RF-UX-01** | Todas as **datas** devem ser exibidas no formato brasileiro `DD/MM/AAAA`; meses de relatório como `Mmm/AAAA`. | Essencial | Protótipo | F01 |
| **RF-UX-02** | Todos os **valores monetários** devem ser exibidos no padrão brasileiro `R$ 0.000,00` (vírgula decimal), por **função única de formatação**, consistente em todas as telas. | Essencial | Protótipo (parcial) | F06 |
| **RF-UX-03** | O sistema deve exibir **feedback de sucesso/erro** (toast/snackbar ~3s) em toda operação de escrita. | Alta | Novo | F10, RNF-USA-02 |
| **RF-UX-04** | Campos **obrigatórios** devem ser sinalizados com asterisco (`*`) de forma consistente em todos os formulários. | Média | Protótipo | F14 |
| **RF-UX-05** | Listas vazias devem exibir mensagem **orientadora** (ex.: "Nenhuma ordem agendada. Clique em '+ Nova ordem' para criar a primeira."). | Média | Novo | MVP16 |
| **RF-UX-06** | A navegação deve ser **responsiva**: topbar no desktop (> 700px) e bottom-nav fixa + botão "Opções" no mobile (≤ 700px). | Essencial | Protótipo | SDD §10.3 |
| **RF-UX-07** | As abas de navegação devem exibir **badge de contagem** (ex.: "Agenda (7)"). | Baixa | Novo | MVP12 |
| **RF-UX-08** | O nome/marca da empresa deve ser **parametrizável** por configuração, sem alteração de código. | Alta | Protótipo (parcial) | MVP11 |
| **RF-UX-09** | Ações destrutivas (cancelar OS, inativar cliente, logout) devem exigir **modal de confirmação**. | Alta | Protótipo | Protótipo |
| **RF-UX-10** | Deve existir **seed de dados de demonstração** realista, cobrindo o fluxo completo: ordens em todos os status, ao menos **um cliente inativo** e **uma ordem cancelada**, e variedade de serviços. | Média | Protótipo (parcial) | MVP14 |
| **RF-UX-11** | Registros ativos/inativos devem ter **distinção visual** (opacidade/badge). | Média | Protótipo | Protótipo |

---

## 4. Regras de negócio

| ID | Regra | Requisitos afetados |
|---|---|---|
| **RN-01** | **Validação de CPF** por dígitos verificadores + máscara `###.###.###-##`. | RF-CLI-02 |
| **RN-02** | **CPF único** por cliente; cadastro/edição bloqueiam duplicata com mensagem amigável. | RF-CLI-12 |
| **RN-03** | **Telefone** com máscara `(00) 00000-0000` (celular) ou `(00) 0000-0000` (fixo). | RF-CLI-03 |
| **RN-04** | **Máquina de status da OS** (toggles bidirecionais): botão *Realizado* alterna `AGENDADA↔REALIZADA` e `AGENDAMENTO_PAGO↔PAGA`; botão *Pago* alterna `AGENDADA↔AGENDAMENTO_PAGO` e `REALIZADA↔PAGA`; *Cancelar* `AGENDADA→CANCELADA`; *Reativar* `CANCELADA→AGENDADA`. Transição sempre validada no servidor. | RF-OS-08, RF-OS-09 |
| **RN-05** | **Edição de OS** permitida apenas em `AGENDADA` e `AGENDAMENTO_PAGO`; demais status são read-only (salvo toggles/cancelamento). | RF-OS-07 |
| **RN-06** | **Horário comercial**: agendamentos restritos a 08h–18h. | RF-OS-06 |
| **RN-07** | **Data futura**: data do serviço deve ser hoje ou futura na criação e na edição; comparação com data atual dinâmica. | RF-OS-04, RF-OS-05 |
| **RN-08** | **Itens da OS**: ≥ 1 item; `qtd ≥ 1`; `valor` unitário informado manualmente. | RF-OS-03 |
| **RN-09** | **Snapshot**: `endereco` e `nome`/`valor` dos itens são gravados na OS na emissão; alterar cliente/catálogo não reescreve OS já emitidas. Exceção: ao editar OS, o endereço é regenerado do cadastro atual. | RF-OS-13 |
| **RN-10** | **Soft delete** de clientes e usuários (`ativo = false`); nunca exclusão física com vínculos. | RF-CLI-07, RF-USR-05 |
| **RN-11** | **Inativo não opera**: usuário inativo não loga; cliente inativo não é selecionável em nova OS. | RF-AUT-02, RF-CLI-07 |
| **RN-12** | **Isolamento do funcionário**: funcionário só vê/edita ordens onde é o responsável; nunca ordens de terceiros. Aplicado no servidor. | RF-AUT-04, RF-AGD-05 |
| **RN-13** | **E-mail único** de usuário; senha mínima de 6 caracteres. | RF-USR-02, RF-USR-03 |
| **RN-14** | **Pagamento exige forma**: transições para status pago requerem `formaPagamento` selecionada. | RF-OS-10 |
| **RN-15** | **Cálculos**: Total da OS = Σ(qtd × valor); KPIs e faturamento conforme RF-DSH-02; relatórios sobre ordens `PAGA`. Valores monetários em `Decimal` (nunca `float`). | RF-DSH-02, RF-REL-02 |
| **RN-16** | **Número de OS** sequencial, único e gerado transacionalmente (sem duplicatas em concorrência). | RF-OS-01, RNF-CON-01 |
| **RN-17** | **PDF stateless / envio manual**: o PDF da OS é gerado **sob demanda no cliente**, **somente** no momento do envio, **nunca é armazenado** (local, servidor ou banco) e **não gera histórico de envios**. O envio é **manual** (o sistema apenas gera e abre o compartilhamento; quem envia é o usuário). Sem servidor de mensageria e sem disparo automático. | RF-OS-21, RF-OS-24, RES-07 |

---

## 5. Requisitos de interface externa

### 5.1 Interfaces de usuário

- **RIU-01** — Interface web responsiva, breakpoint **700px**: desktop mostra topbar + tabelas; mobile mostra bottom-nav fixa + listas em card.
- **RIU-02** — Modais centralizados no desktop; slide-up a partir do rodapé no mobile.
- **RIU-03** — Paginação fixa acima da bottom-nav no mobile, com padding compensatório no container da lista.
- **RIU-04** — Mapa de cores de status padronizado:

  | Status | Label | Cor | Fundo |
  |---|---|---|---|
  | `AGENDADA` | Agendada | `#1a6fbb` | `#e8f3fc` |
  | `REALIZADA` | Serviço Realizado | `#1f7a3e` | `#e6f4ec` |
  | `AGENDAMENTO_PAGO` | Agendamento Pago | `#b85e1a` | `#fdf0e6` |
  | `PAGA` | Pagamento Recebido | `#5b3fa6` | `#eeebfb` |
  | `CANCELADA` | Cancelada | `#b83232` | `#fdeaea` |

- **RIU-05** — Formulários com validação por campo e mensagens de erro inline.

> RIU-01..05 descrevem o **comportamento-alvo** validado no protótipo. A implementação usará os componentes da stack definida no `SDD.md` (Tailwind + shadcn/ui) — o CSS do protótipo não é reaproveitado (RES-08).

### 5.2 Interfaces de software

- **RIS-01** *(Fase 4)* — Integração com **ViaCEP** (HTTP) para autocompletar endereço por CEP.
- **RIS-02** — **Google Maps** via URL (deep-link para navegação), sem SDK embarcado.
- **RIS-03** — **PostgreSQL** via Prisma Client; **Auth.js** para sessão.
- **RIS-04** — **WhatsApp** via **deep link** `wa.me`/`api.whatsapp.com` (texto pré-preenchido) e/ou **Web Share API** (`navigator.share`) para compartilhar o PDF. Sem SDK/servidor de mensageria; integração 100% no cliente. Nota: o deep link `wa.me` transporta **apenas texto**; o anexo do PDF depende da Web Share API (mobile) ou de anexo manual pelo usuário (desktop).
- **RIS-05** — **Geração de PDF no cliente** (biblioteca JS de PDF ou impressão com CSS dedicado — decisão em §10.3) a partir dos dados da OS; sem chamada a serviço externo e sem persistência do arquivo (ver RN-17).

### 5.3 Interfaces de comunicação

- **RIC-01** — HTTPS/TLS obrigatório em produção.
- **RIC-02** — Mutations via Server Actions tipadas; leituras via data fetching no servidor.

---

## 6. Requisitos não-funcionais

> Como o produto é construído do zero diretamente sobre a stack de produção, **todos** os RNFs abaixo são requisitos de construção — nenhum é "etapa posterior".

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
| **RNF-MAN-01** | TypeScript `strict`, sem `any`; ESLint + Prettier configurados desde o primeiro commit. |
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
- **Requisitos:** RF-AUT-01..04, RF-AUT-08, RF-AUT-09.

### CU-02 — Cadastrar cliente
- **Ator:** Administrador
- **Fluxo principal:** 1) abre novo cliente; 2) preenche dados com máscaras (CPF, telefone, CEP) e complemento; 3) sistema valida CPF (dígitos + unicidade); 4) salva; 5) exibe toast de sucesso.
- **Exceções:** CPF inválido ou duplicado → erro no campo.
- **Requisitos:** RF-CLI-01..06, RF-CLI-12, RF-UX-03.

### CU-03 — Criar ordem de serviço
- **Ator:** Administrador
- **Pré-condições:** Existe ao menos um cliente ativo e um funcionário.
- **Fluxo principal:** 1) abre nova OS; 2) seleciona cliente por autocomplete; 3) seleciona funcionário; 4) informa data (hoje ou futura) e hora (08–18h); 5) adiciona ≥ 1 item (tipo, descrição, qtd, valor); 6) opcionalmente observações/forma de pagamento; 7) sistema gera número sequencial transacional, grava snapshot de endereço e salva.
- **Exceções:** data no passado / hora fora do comercial → erro; nenhum item → erro; conflito de horário do funcionário → aviso (não bloqueia).
- **Requisitos:** RF-OS-01..06, RF-OS-13, RF-OS-17.

### CU-04 — Registrar pagamento da OS
- **Ator:** Administrador
- **Fluxo principal:** 1) aciona botão *Pago*; 2) sistema exibe resumo e exige forma de pagamento; 3) confirma; 4) status avança (`AGENDADA→AGENDAMENTO_PAGO` ou `REALIZADA→PAGA`).
- **Exceções:** forma de pagamento não selecionada → confirmação desabilitada; transição inválida → recusada pelo servidor.
- **Requisitos:** RF-OS-09, RF-OS-10, RF-OS-19, RN-14.

### CU-05 — Marcar serviço como realizado (funcionário)
- **Ator:** Funcionário
- **Pré-condições:** OS atribuída ao funcionário.
- **Fluxo principal:** 1) na Agenda, localiza a OS do dia; 2) aciona "Realizado"; 3) status alterna `AGENDADA↔REALIZADA` (ou `AGENDAMENTO_PAGO↔PAGA`).
- **Exceções:** OS de outro funcionário → invisível na UI e recusada no servidor.
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

### CU-11 — Enviar OS ao cliente por WhatsApp
- **Ator:** Administrador
- **Pré-condições:** OS existente; cliente com telefone cadastrado.
- **Fluxo principal:** 1) abre o detalhe da OS; 2) aciona **"Enviar por WhatsApp"**; 3) o sistema **gera o PDF da OS sob demanda** (em memória, no navegador); 4) em dispositivo com **Web Share API**, abre a folha de compartilhamento nativa e o usuário escolhe o WhatsApp, com o PDF anexado; 5) o usuário confirma o envio no próprio WhatsApp; 6) o PDF é **descartado** (nada é armazenado).
- **Fluxo alternativo (desktop / sem Web Share):** 3a) o sistema **baixa o PDF** e **abre o WhatsApp** (`wa.me/<telefone>`) com **texto pré-preenchido** (resumo da OS); 4a) o usuário **anexa** o PDF baixado e envia.
- **Exceções:** cliente sem telefone → não é possível montar o deep link (o download/compartilhamento do PDF ainda é oferecido); compartilhamento cancelado pelo usuário → nenhuma alteração de estado.
- **Requisitos:** RF-OS-21..24, RN-17, RES-07, RIS-04, RIS-05.

---

## 8. Matriz de rastreabilidade

Vínculo entre os itens do relatório de avaliação do protótipo (`relatorio_final.md`), os requisitos desta ERS, sua prioridade e a maturidade da especificação.

> **Lembrete: nenhuma linha representa entrega.** Todos os requisitos abaixo serão construídos do zero.

| Item do relatório | Requisito(s) ERS | Prioridade | Referência |
|---|---|---|---|
| F01 — Data BR | RF-UX-01 | Essencial | Protótipo |
| F02 — Máscara telefone | RF-CLI-03 | Essencial | Protótipo |
| F03 — Data dinâmica na criação | RF-OS-04 | Essencial | Protótipo |
| F04 — Validação de data na edição | RF-OS-05 | Essencial | Protótipo |
| F05 — Ordenação do Dashboard | RF-DSH-04 | Essencial | Protótipo |
| F06 — Moeda BR consistente | RF-UX-02 | Essencial | Protótipo (parcial) |
| F07 — Máscara CEP | RF-CLI-04 | Alta | Novo |
| F08 — Agenda por status operacional | RF-AGD-03 | Alta | Protótipo |
| F09 — Agenda agrupada por dia | RF-AGD-02 | Alta | Protótipo |
| F10 — Toast de sucesso | RF-UX-03 | Alta | Novo |
| F11 — Período dinâmico dos relatórios | RF-REL-04 | Alta | Novo |
| F12 — Ações no detalhe da OS | RF-OS-11 | Alta | Protótipo |
| F13 — Relatório de cancelamentos | RF-REL-06 | Média | Novo |
| F14 — Asterisco em campos obrigatórios | RF-UX-04 | Média | Protótipo |
| F15 — Limpar filtros sem resetar período | RF-REL-05 | Média | Novo |
| F16 — Aviso ao inativar cliente | RF-CLI-08 | Média | Novo |
| F17 — Autocomplete de cliente | RF-OS-02 | Alta | Protótipo |
| F18 — Endereço regenerado na edição | RF-OS-13 | Média | Protótipo |
| MVP01 — Busca de clientes | RF-CLI-09 | Alta | Protótipo |
| MVP02 — Filtros de ordens | RF-OS-14, RF-OS-15 | Alta | Protótipo / parcial |
| MVP03 — Forma de pagamento | RF-OS-10, RF-OS-19 | Essencial / Alta | Protótipo |
| MVP04 — Histórico por cliente | RF-CLI-11 | Alta | Protótipo |
| MVP05 — Contadores no Dashboard | RF-DSH-02, RF-DSH-07 | Alta / Média | Protótipo / parcial |
| MVP06 — Complemento no endereço | RF-CLI-05 | Alta | Protótipo |
| MVP07 — Aviso de conflito de horário | RF-OS-17 | Alta | Novo |
| MVP08 — Impressão/PDF de relatórios | RF-REL-07 | Média | Novo |
| MVP09 — Ordenação por coluna | RF-CLI-13, RF-OS-20 | Média | Novo |
| MVP10 — Indicador hoje/atrasada | RF-OS-18, RF-AGD-07 | Alta | Novo |
| MVP11 — Nome/marca parametrizável | RF-UX-08 | Alta | Protótipo (parcial) |
| MVP12 — Badge de contagem nas abas | RF-UX-07 | Baixa | Novo |
| MVP13 — "Esqueci minha senha" | RF-AUT-07 | Baixa | Novo |
| MVP14 — Dados de exemplo realistas | RF-UX-10 | Média | Protótipo (parcial) |
| MVP15 — Atalhos rápidos no Dashboard | RF-DSH-06 | Média | Novo |
| MVP16 — Mensagens de lista vazia | RF-UX-05 | Média | Novo |
| — *(escopo novo, v1.1)* | RF-OS-21..24, RN-17, CU-11 | Alta | Novo |
| — *(escopo novo, v2.0)* | RF-AUT-08, RF-AUT-09 | Essencial | Novo |

**Resumo por maturidade de especificação** — dos **89 requisitos funcionais** do §3:

| Referência | Qtde | Significado para o roadmap |
|---|---|---|
| Protótipo | 57 | Comportamento definido; pode ir direto para implementação. |
| Protótipo (parcial) | 8 | Exige complemento de definição (RF-USR-03, RF-CLI-12, RF-SRV-01, RF-OS-15, RF-DSH-07, RF-UX-02, RF-UX-08, RF-UX-10). |
| Novo | 24 | Exige especificação de UI/regra antes de entrar em sprint. |

**Distribuição por prioridade:** Essencial **24** · Alta **43** · Média **17** · Baixa **5** (total 89).

---

## 9. Catálogo priorizado de requisitos (insumo do roadmap)

Esta seção **substitui** o antigo "backlog de pendências" da v1.x. Como o produto é construído do zero, o catálogo abaixo é o **conjunto completo de trabalho**, organizado por prioridade e por dependência — pronto para ser convertido em roadmap de implementação.

> **Isto não é um roadmap.** Não há fases, sequência de sprints, alocação nem datas; apenas prioridade, agrupamento, precedências e bloqueios.

### 9.1 Pré-requisitos técnicos (antes de qualquer RF)

Não são requisitos de produto, mas condicionam todo o restante. Derivam do `SDD.md` e dos RNFs do §6.

| ID | Descrição | RNF/RF relacionados |
|---|---|---|
| **PT-01** | Bootstrap do projeto: Next.js 15 + TypeScript strict + ESLint/Prettier. | RNF-MAN-01 |
| **PT-02** | PostgreSQL + Prisma: schema inicial, migrations versionadas e índices. | RNF-CON-03, RNF-DES-03 |
| **PT-03** | Camada de validação única com Zod (cliente + servidor). | RNF-MAN-04, RNF-SEG-03 |
| **PT-04** | Autenticação/sessão (Auth.js), hash de senha e middleware de rotas protegidas. | RF-AUT-08, RF-AUT-09, RNF-SEG-01/02/04 |
| **PT-05** | Design system base (Tailwind + shadcn/ui) e shell responsivo de navegação. | RF-UX-06, RIU-01..03 |
| **PT-06** | Módulo único de formatação BR (data, moeda, CPF, telefone, CEP). | RF-UX-01, RF-UX-02, RF-CLI-02..04, RNF-USA-01 |
| **PT-07** | Infra de testes (unitário + integração) e pipeline de build/Docker. | RNF-MAN-02/03, RNF-POR-02 |
| **PT-08** | Seed de dados de demonstração. | RF-UX-10 |
| **PT-09** | Configuração parametrizável de marca/empresa. | RF-UX-08 |

### 9.2 Requisitos Essenciais (24)

Núcleo sem o qual o sistema não opera.

| Módulo | Requisitos |
|---|---|
| Autenticação | RF-AUT-01, RF-AUT-02, RF-AUT-03, RF-AUT-04, RF-AUT-08, RF-AUT-09 |
| Clientes | RF-CLI-01, RF-CLI-02, RF-CLI-03, RF-CLI-06 |
| Catálogo de serviços | RF-SRV-01, RF-SRV-02 |
| Ordens de serviço | RF-OS-01, RF-OS-03, RF-OS-04, RF-OS-05, RF-OS-09, RF-OS-10 |
| Agenda | RF-AGD-05 |
| Dashboard | RF-DSH-04 |
| UX | RF-UX-01, RF-UX-02, RF-UX-06 |
| *Condicional* | RF-OS-24 — obrigatório **se** RF-OS-21..23 forem construídos (critério de aceite, não item isolado) |

### 9.3 Requisitos de prioridade Alta (43)

Necessários para um MVP robusto.

| Módulo | Requisitos |
|---|---|
| Usuários | RF-USR-01 … RF-USR-07 |
| Clientes | RF-CLI-04, RF-CLI-05, RF-CLI-07, RF-CLI-09, RF-CLI-10, RF-CLI-11, RF-CLI-12 |
| Ordens de serviço | RF-OS-02, RF-OS-06, RF-OS-07, RF-OS-08, RF-OS-11, RF-OS-14, RF-OS-15, RF-OS-16, RF-OS-17, RF-OS-18, RF-OS-19 |
| Envio por WhatsApp | RF-OS-21, RF-OS-22, RF-OS-23 |
| Agenda | RF-AGD-01, RF-AGD-02, RF-AGD-03, RF-AGD-04, RF-AGD-07 |
| Dashboard | RF-DSH-01, RF-DSH-02, RF-DSH-03 |
| Relatórios | RF-REL-01, RF-REL-02, RF-REL-03, RF-REL-04 |
| UX | RF-UX-03, RF-UX-08, RF-UX-09 |

### 9.4 Requisitos de prioridade Média (17)

Agregam valor operacional; podem ficar para iteração seguinte.

| Módulo | Requisitos |
|---|---|
| Autenticação | RF-AUT-05 |
| Clientes | RF-CLI-08, RF-CLI-13 |
| Ordens de serviço | RF-OS-12, RF-OS-13, RF-OS-20 |
| Agenda | RF-AGD-06 |
| Dashboard | RF-DSH-05, RF-DSH-06, RF-DSH-07 |
| Relatórios | RF-REL-05, RF-REL-06, RF-REL-07 |
| UX | RF-UX-04, RF-UX-05, RF-UX-10, RF-UX-11 |

### 9.5 Requisitos de prioridade Baixa (5) — evolução

| Módulo | Requisitos |
|---|---|
| Autenticação | RF-AUT-06, RF-AUT-07 |
| Clientes | RF-CLI-14 *(Fase 4 — depende de ViaCEP)* |
| Catálogo de serviços | RF-SRV-03 *(decisão em aberto — §10.3)* |
| UX | RF-UX-07 |

### 9.6 Precedências entre blocos

Restrições factuais de ordem que o roadmap deve respeitar (não são fases nem prazos):

| Bloco | Depende de |
|---|---|
| Qualquer módulo funcional | PT-01 … PT-05 |
| Usuários (RF-USR-*) | Autenticação (RF-AUT-01..04, RF-AUT-08) |
| Clientes (RF-CLI-*) | PT-02, PT-06 |
| Ordens de serviço (RF-OS-*) | Clientes (RF-CLI-01..06) + Catálogo (RF-SRV-01/02) + Usuários (funcionário atribuível) |
| Agenda (RF-AGD-*) | Ordens (RF-OS-01, RF-OS-09) |
| Dashboard (RF-DSH-*) | Ordens com status e valores (RF-OS-01, RF-OS-09, RF-OS-10) |
| Relatórios (RF-REL-*) | Ordens em status `PAGA` (RF-OS-10) |
| Envio por WhatsApp (RF-OS-21..24) | Detalhe da OS (RF-OS-11) + marca parametrizável (RF-UX-08 / PT-09) |
| Destaques hoje/atrasada (RF-OS-18, RF-AGD-07) | Listas de ordens e Agenda já construídas |
| Seed de demonstração (PT-08 / RF-UX-10) | Modelo de dados completo (PT-02) |

### 9.7 Bloqueios de decisão

Requisitos que **não devem entrar em implementação** antes de fechar a decisão correspondente em §10.3:

| Requisito | Decisão pendente (§10.3) |
|---|---|
| RF-SRV-03 | #1 — Administração do catálogo entra no MVP? |
| RF-OS-01 / RN-16 | #2 — Estratégia de numeração sequencial. |
| Modelo de dados / RN-15 | #3 — Representação monetária (`Decimal(10,2)` vs. centavos inteiros). |
| RF-AUT-09 | #4 — Política de sessão (expiração, "lembrar-me"). |
| RF-CLI-09 | #5 — Busca inclui CPF/telefone além do nome? |
| RF-DSH-07 | #6 — Métricas contextuais finais. |
| RF-OS-22 / RIS-05 | #7 — Biblioteca de geração de PDF. |

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

| # | Questão | Impacta |
|---|---|---|
| 1 | **Administração do catálogo de serviços no MVP** — a modelagem suporta a tabela `Servico`; confirmar se a tela entra no escopo inicial. | RF-SRV-03 |
| 2 | **Numeração de OS** — tabela `Contador` dedicada vs. `max(numero)+1` transacional. | RF-OS-01, RN-16, RNF-CON-01 |
| 3 | **Valor monetário** — `Decimal(10,2)` (recomendado) vs. centavos em inteiro. | RN-15, modelo de dados |
| 4 | **Política de sessão** — expiração e "lembrar-me". | RF-AUT-09 |
| 5 | **Escopo de busca de clientes** — incluir CPF/telefone além do nome? (recomendado). | RF-CLI-09 |
| 6 | **Contadores extras do Dashboard** — definir métricas finais (clientes ativos, total a receber, ordens de hoje/semana). | RF-DSH-07 |
| 7 | **Geração de PDF** — biblioteca JS dedicada vs. impressão com CSS; afeta fidelidade do layout e tamanho do bundle. | RF-OS-22, RF-REL-07, RIS-05 |

### 10.4 Histórico de revisões

| Versão | Data | Descrição |
|---|---|---|
| 1.0 | Jul/2026 | Baseline inicial consolidando protótipo, relatório de avaliação e SDD. |
| 1.1 | Jul/2026 | Inclusão da geração de **PDF da OS sob demanda** e **envio manual por WhatsApp**, stateless e sem armazenamento (RF-OS-21..24, RN-17, RES-07, RIS-04/05, CU-11). |
| 2.0 | Jul/2026 | **Rebaseline para construção do zero.** Removida toda marcação de "implementado" — o protótipo passa a ser apenas referência de comportamento (RES-08). A coluna *Status* foi substituída por *Referência* (maturidade da especificação). RF-AUT-08/09 promovidos a Essencial e os RNFs deixam de ser "exclusivos de produção". §8 passa a rastrear prioridade e maturidade, sem progresso. §9 reescrito como **catálogo priorizado completo**, com pré-requisitos técnicos (PT-01..09), precedências entre blocos e bloqueios de decisão — insumo direto do roadmap. |

---

*Especificação de Requisitos de Software (ERS) — fonte de verdade dos requisitos do Sistema de Gestão para Lavanderia, a ser construído do zero. Complementa o `SDD.md` (design) e o `relatorio_final.md` (avaliação do protótipo).*
