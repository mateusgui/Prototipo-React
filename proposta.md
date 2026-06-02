# Proposta Técnica — Sistema de Gestão para Lavanderia

---

## 1. Objetivo do Projeto

Desenvolver um sistema web de gestão operacional para lavanderias, acessível por navegador em computadores e dispositivos móveis (celular/tablet), sem necessidade de instalação. O sistema tem como objetivo centralizar o cadastro de clientes, o controle de ordens de serviço, o acompanhamento da agenda de execução e a geração de relatórios de faturamento, substituindo o controle manual (cadernos, planilhas ou grupos de WhatsApp) por um fluxo digital organizado e de fácil uso para toda a equipe.

---

## 2. Escopo Técnico — Módulos e Funcionalidades Inclusas

### 2.1 Autenticação e Controle de Acesso

- Login por e-mail e senha.
- Dois perfis de acesso: **Administrador** e **Funcionário**.
- Administrador acessa todos os módulos do sistema.
- Funcionário acessa apenas a Agenda, visualizando somente as ordens atribuídas a ele.
- Gerenciamento de usuários pelo administrador: cadastro, edição de nome/e-mail, inativação/reativação e reset de senha.

### 2.2 Módulo de Cadastro

**Clientes:**
- Cadastro completo: nome, CPF (com validação de dígitos), telefone, e-mail e endereço (rua, número, complemento, bairro, cidade, estado, CEP).
- Edição de dados cadastrais.
- Inativação e reativação de clientes (soft delete — histórico preservado).
- Busca por nome na listagem.
- Histórico de ordens de serviço por cliente acessível diretamente da listagem.
- Paginação (10 registros por página).

**Catálogo de Serviços:**
- Lista de serviços predefinida (ex.: Limpeza e Higienização, Impermeabilização, Lavagem de Tapetes, Lavagem de Cortinas).
- Serviço livre: o operador pode inserir um nome customizado ao criar a ordem.

### 2.3 Módulo de Ordens de Serviço

- Geração de Ordem de Serviço (OS) com número sequencial automático.
- Vinculação a cliente (busca com autocomplete — exibe os 5 últimos cadastrados no foco; pesquisa por digitação) e a funcionário responsável.
- Data e hora de agendamento (restrição de horário comercial: 08h–18h).
- Múltiplos itens de serviço por OS, cada um com: tipo de serviço, descrição do objeto (ex.: "sofá cinza, 3 lugares"), quantidade e valor unitário (preço sempre informado manualmente).
- Campo de observações livres.
- Registro da forma de pagamento (PIX, Débito, Crédito à vista, parcelado em até 6x).
- Edição de OS enquanto no status Agendada ou Agendamento Pago.
- Cancelamento e reativação de OS.
- Listagem com filtros combinados por nome do cliente, data início e data fim.
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
- Indicadores exibidos: ordens agendadas, pendentes de execução (agendamento pago), pendentes de pagamento (realizadas, não pagas) e faturamento total do mês.
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
- Botão de acesso ao Google Maps a partir do endereço de cada OS (abre o mapa no navegador).
- Máscaras automáticas de entrada para CPF e telefone.

---

## 3. Exclusões de Escopo

Os itens abaixo **não fazem parte** do presente escopo e podem ser considerados para fases futuras, mediante nova proposta.

| # | Exclusão | Observação |
|---|---|---|
| 1 | **Integração Fiscal (NFS-e)** | O sistema não emitirá Nota Fiscal de Serviços Eletrônica junto à prefeitura. A OS gerada é um documento interno de controle operacional, sem validade fiscal. |
| 2 | **Gateway de Pagamento Integrado** | O sistema registrará a forma de pagamento e o status de recebimento, mas não processará cobranças internamente. O pagamento continua sendo realizado via maquininha, PIX pelo app do banco ou outra forma acordada com o cliente. |
| 3 | **Aplicativo Nativo (iOS / Android)** | O sistema é acessado pelo navegador do celular (web responsivo). Não haverá publicação nas lojas App Store ou Google Play. |
| 4 | **Envio Automático de Mensagens** | Não haverá disparo automático de confirmações, lembretes ou cobranças por WhatsApp, SMS ou e-mail. |
| 5 | **Consulta Automática de CEP** | O preenchimento do endereço pelo CEP (integração com ViaCEP ou similar) não está incluso nesta fase. O endereço é preenchido manualmente. |
| 6 | **Multi-empresa / Multi-filial** | O sistema é configurado para uma única empresa/unidade. Não há separação de dados por filial. |
| 7 | **Persistência de Dados (Banco de Dados)** | O protótipo atual mantém os dados em memória (resetam ao recarregar a página). A versão de produção com banco de dados real é escopo separado. |
| 8 | **Controle de Estoque de Insumos** | Não há módulo de estoque de produtos químicos ou equipamentos. |
| 9 | **Relatórios Avançados / Exportação** | Não há exportação para PDF/Excel nem painéis de BI. Os relatórios são exibidos em tela. |
| 10 | **Precificação Automática de Serviços** | O sistema não calculará preços automaticamente por tabela de preços. O valor é sempre informado manualmente por item de serviço na OS. |

---

*Documento gerado em Junho de 2026.*
