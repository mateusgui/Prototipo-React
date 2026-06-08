# Proposta Técnica e Comercial — Sistema de Gestão para Lavanderia

---

## 1. Objetivo do Projeto

Desenvolver um sistema web de gestão operacional para lavanderias, acessível por navegador em computadores e dispositivos móveis (celular/tablet), sem necessidade de instalação. O sistema tem como objetivo centralizar o cadastro de clientes, o controle de ordens de serviço, o acompanhamento da agenda de execução e a geração de relatórios de faturamento, substituindo o controle manual (cadernos, planilhas ou grupos de WhatsApp) por um fluxo digital organizado e de fácil uso para toda a equipe.

A solução é entregue sobre **infraestrutura moderna baseada em contêineres (Docker)**, garantindo um ambiente padronizado, confiável e **pronto para ser escalado no futuro** conforme o crescimento da operação.

---

## 2. Escopo Técnico — Módulos e Funcionalidades Inclusas

### 2.1 Autenticação e Controle de Acesso

- Login por e-mail e senha.
- Dois perfis de acesso: **Administrador** e **Funcionário**.
- Administrador acessa todos os módulos do sistema.
- Funcionário acessa apenas a Agenda, visualizando somente as ordens atribuídas a ele.
- Gerenciamento de usuários pelo administrador: cadastro, edição de nome/e-mail, inativação/reativação e reset de senha.
- Cada usuário pode redefinir a própria senha quando autenticado.

### 2.2 Módulo de Cadastro

**Clientes:**
- Cadastro completo: nome, sobrenome, CPF (com validação de dígitos), telefone, e-mail e endereço (rua, número, complemento, bairro, cidade, estado, CEP).
- **Preenchimento automático de endereço pelo CEP** (integração com serviço de consulta de CEP, ex.: ViaCEP): ao digitar o CEP, os campos de rua, bairro, cidade e estado são preenchidos automaticamente, restando ao operador apenas informar número e complemento.
- Edição de dados cadastrais.
- Inativação e reativação de clientes (soft delete — histórico preservado).
- Busca por nome na listagem.
- Histórico de ordens de serviço por cliente acessível diretamente da listagem.
- Paginação (10 registros por página).
- Máscaras automáticas de entrada para CPF e telefone.

**Catálogo de Serviços:**
- Lista de serviços predefinida para seleção rápida na criação da ordem. Exemplos previstos:
  - Limpeza e Higienização
  - Impermeabilização
  - Lavagem de Tapetes
  - Lavagem de Cortinas
- A seleção do serviço é feita a partir desse catálogo; o valor é sempre informado manualmente por item de serviço, permitindo flexibilidade de preço a cada atendimento.

### 2.3 Módulo de Ordens de Serviço

- Geração de Ordem de Serviço (OS) com número sequencial automático.
- Vinculação a cliente (busca com autocomplete — exibe os 5 últimos cadastrados ao focar o campo e pesquisa por digitação) e a funcionário responsável.
- Data e hora de agendamento (restrição de horário comercial: 08h–18h e validação de data futura).
- Múltiplos itens de serviço por OS, cada um com: tipo de serviço (do catálogo), descrição do objeto (ex.: "sofá cinza, 3 lugares"), quantidade e valor unitário.
- Campo de observações livres por ordem.
- Registro da forma de pagamento (PIX, Débito, Crédito à vista e Crédito parcelado em até 6x).
- Edição de OS enquanto no status **Agendada** ou **Agendamento Pago**.
- Cancelamento e reativação de OS.
- Listagem com filtros combinados por nome do cliente, data início e data fim.
- Botão de acesso ao Google Maps a partir do endereço de cada OS (abre o mapa no navegador, facilitando o deslocamento da equipe).
- Paginação (10 registros por página).

**Fluxo de status bidirecional:**

```
Agendada ←→ Realizada
Agendada ←→ Agendamento Pago
Agendamento Pago ←→ Paga (Finalizada)
Realizada ←→ Paga (Finalizada)
Agendada → Cancelada → Agendada (reativação)
```

A confirmação de pagamento exige a seleção da forma de pagamento antes de ser concluída.

### 2.4 Agenda

- Visualização das ordens filtradas por status: **Agendado**, **Realizado** ou **Pago**.
- Separadores visuais por dia de serviço (ex.: "3 de Junho de 2026").
- Filtros adicionais para o administrador: funcionário responsável e data específica.
- Funcionário visualiza apenas suas próprias ordens e pode marcar/desmarcar o status **Realizado** diretamente pelo card.
- Paginação (10 registros por página) com navegação fixa na parte inferior da tela no mobile.

### 2.5 Dashboard

- Painel de KPIs filtrável por competência (mês/ano selecionável).
- Indicadores exibidos: ordens agendadas, pendentes de execução (agendamento pago), pendentes de pagamento (realizadas, ainda não pagas) e faturamento total do mês.
- Clique nos indicadores filtra a lista de ordens exibida abaixo.
- Listagem paginada das ordens do mês (10 por página).

### 2.6 Relatórios

- Relatório de faturamento filtrável por: intervalo de meses, tipo de serviço e funcionário.
- Indicadores: faturamento total, quantidade de ordens pagas e variedade de tipos de serviço.
- Detalhamento de receita **por tipo de serviço** (ranking decrescente).
- Detalhamento de receita **por mês** com gráfico de barras.

### 2.7 Interface e Experiência de Uso

- Layout responsivo: versão desktop (navegador em computador) e versão mobile (celular/tablet), sem instalação de aplicativo.
- Navegação por abas no topo (desktop) e barra inferior fixa (mobile).
- Paginação fixa acima da barra de navegação no mobile para não obstruir o conteúdo.
- Identidade visual consistente, com componentes de formulário, modais e indicadores de status padronizados.

---

## 3. Arquitetura e Infraestrutura

- Aplicação web responsiva, acessada por qualquer navegador moderno, sem instalação.
- Banco de dados para persistência segura das informações de clientes, ordens de serviço, usuários e histórico operacional.
- **Empacotamento em contêineres Docker**, garantindo padronização entre os ambientes de desenvolvimento e produção e facilitando a manutenção e a evolução do sistema.
- Arquitetura **preparada para escalar** conforme o aumento do volume de clientes e ordens.

> **Nota:** O protótipo apresentado para validação tem como finalidade demonstrar os fluxos de uso e a interface (UI) do sistema. As funcionalidades de integração e a infraestrutura definitiva descritas nesta proposta são entregues nas fases de desenvolvimento do produto.

---

## 4. Fases de Desenvolvimento e Entrega

O projeto é dividido em quatro fases sequenciais, permitindo acompanhamento e validação ao longo do desenvolvimento:

| Fase | Entrega | Conteúdo |
|---|---|---|
| **Fase 1 — Fundação** | Acesso e cadastros | Autenticação, controle de acesso por perfil, gestão de usuários e módulo de cadastro de clientes. |
| **Fase 2 — Núcleo Operacional** | Operação do dia a dia | Catálogo de serviços, ordens de serviço com fluxo de status, e Agenda de execução. |
| **Fase 3 — Gestão e Inteligência** | Visão gerencial | Dashboard de indicadores e Relatórios de faturamento. |
| **Fase 4 — Integração, Infraestrutura e Entrega** | Produto em produção | Integração de consulta de CEP, empacotamento em Docker, publicação em ambiente de produção e ajustes finais. |

---

## 5. Exclusões de Escopo

Os itens abaixo **não fazem parte** do presente escopo e podem ser considerados para fases futuras, mediante nova proposta.

| # | Exclusão | Observação |
|---|---|---|
| 1 | **Integração Fiscal (NFS-e)** | O sistema não emitirá Nota Fiscal de Serviços Eletrônica junto à prefeitura. A OS gerada é um documento interno de controle operacional, sem validade fiscal. |
| 2 | **Gateway de Pagamento Integrado** | O sistema registrará a forma de pagamento e o status de recebimento, mas não processará cobranças internamente. O pagamento continua sendo realizado via maquininha, PIX pelo app do banco ou outra forma acordada com o cliente. |
| 3 | **Aplicativo Nativo (iOS / Android)** | O sistema é acessado pelo navegador do celular (web responsivo). Não haverá publicação nas lojas App Store ou Google Play. |
| 4 | **Envio Automático de Mensagens** | Não haverá disparo automático de confirmações, lembretes ou cobranças por WhatsApp, SMS ou e-mail. |
| 5 | **Anexo de Fotos (Antes/Depois)** | O sistema não contará com funcionalidade de anexar fotos do antes e depois do serviço às ordens. |
| 6 | **Multi-empresa / Multi-filial** | O sistema é configurado para uma única empresa/unidade. Não há separação de dados por filial. |
| 7 | **Controle de Estoque de Insumos** | Não há módulo de estoque de produtos químicos ou equipamentos. |
| 8 | **Relatórios Avançados / Exportação** | Não há exportação para PDF/Excel nem painéis de BI. Os relatórios são exibidos em tela. |
| 9 | **Precificação Automática de Serviços** | O sistema não calculará preços automaticamente por tabela de preços. O valor é sempre informado manualmente por item de serviço na OS. |

---

## 6. Hospedagem e Sustentação do Sistema

Após a entrega da **Fase 4**, para que o sistema fique disponível na internet 24 horas por dia, de forma segura e rápida, é necessária a contratação da infraestrutura de servidores em nuvem.

Oferecemos o gerenciamento completo dessa infraestrutura em um pacote mensal, que inclui:

- Aluguel de servidor VPS privado de alta performance.
- Rotinas de backup automatizadas do banco de dados para prevenção de perda de dados.
- Renovação de certificados de segurança (SSL).
- Suporte técnico tira-dúvidas em horário comercial.

**Valor da Manutenção e Hospedagem Mensal: R$ [Inserir valor, ex: 450,00] / mês.**

*(A primeira mensalidade será cobrada apenas 30 dias após a entrega final do sistema em produção.)*

---

*Documento gerado em Junho de 2026.*
