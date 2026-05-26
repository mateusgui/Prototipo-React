# 📋 Relatório de Análise — Protótipo Sistema de Lavanderia

> **Escopo**: Análise completa do arquivo [App.jsx](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx) (1.111 linhas) e arquivos de suporte.
> **Data**: 26/05/2026

---

## Sumário Executivo

O protótipo cobre bem o fluxo principal (login → cadastro de clientes/serviços → ordens → agenda → relatórios), mas apresenta **bugs lógicos**, **lacunas de validação**, **funcionalidades básicas ausentes** e **problemas de UX** que, se não corrigidos antes de mostrar ao cliente, podem gerar dúvidas sobre a maturidade do produto.

A tabela abaixo resume as categorias:

| Categoria | Críticos | Médios | Baixos |
|---|:---:|:---:|:---:|
| 🐛 Bugs e Falhas Lógicas | 4 | 3 | 2 |
| 🕳️ Lacunas de UX / Usabilidade | 1 | 6 | 3 |
| 🧩 Funcionalidades Simples Faltando | 2 | 7 | 4 |
| 🔒 Segurança & Arquitetura | 2 | 2 | 1 |

---

## 🐛 1. Bugs e Falhas Lógicas

### 🔴 Crítico

#### 1.1 Data hardcoded na validação de ordens
**Arquivo**: [App.jsx:355](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L355)
```javascript
if (fOrdem.data <= "2026-05-22") e.data = "Escolha uma data futura.";
```
A data `"2026-05-22"` está fixa no código. Qualquer ordem criada após essa data mas com data no passado será aceita, e ordens válidas podem ser rejeitadas. Deveria comparar com `new Date().toISOString().slice(0,10)` (data atual dinâmica).

#### 1.2 Edição de ordem não valida data futura
**Arquivo**: [App.jsx:388-410](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L388-L410)
A função `salvarEdicaoOrdem()` **não verifica se a data é futura** (ao contrário de `salvarOrdem()`). Isso permite que alguém edite uma ordem agendada e coloque uma data no passado.

#### 1.3 `setOrdemSvcField` sobrescreve estado inconsistentemente
**Arquivo**: [App.jsx:495-497](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L495-L497)
Quando o usuário seleciona um serviço predefinido no dropdown (linhas 964-968), são feitas **3 chamadas sequenciais** a `setOrdemSvcField` que usam o setter funcional `setFOrdem(p => ...)`. Como cada chamada captura o estado anterior separadamente, as atualizações de `nome` e `valor` podem **sobrescrever umas às outras** em batched updates do React. O correto seria uma única chamada que atualize os três campos simultaneamente.

#### 1.4 Possível remoção de todos os serviços de uma ordem
**Arquivo**: [App.jsx:979](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L979)
O botão `×` permite remover **todas** as linhas de serviço, deixando a lista vazia. Não há proteção mínima (pelo menos 1 serviço). A validação no `salvarOrdem` pega isso, mas a UX fica confusa — o formulário mostra 0 linhas sem mensagem imediata.

---

### 🟡 Médio

#### 1.5 Dashboard mostra ordens sem ordenação
**Arquivo**: [App.jsx:585](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L585)
`ordens.slice(0, 6)` pega as primeiras 6 da ordem de inserção. Não há sort por data, status ou relevância. A dashboard deveria mostrar as ordens mais recentes ou as próximas agendadas.

#### 1.6 Relatórios consideram apenas status "paga"
**Arquivo**: [App.jsx:457](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L457)
Ordens canceladas são completamente ignoradas nos relatórios. Não há nenhuma visão de "taxa de cancelamento" ou "ordens perdidas", que seria informação valiosa para o dono do negócio.

#### 1.7 Clientes inativos continuam disponíveis em ordens existentes
Ao inativar um cliente, ordens já criadas com esse cliente permanecem inalteradas (correto), mas o nome do cliente aparece como `undefined undefined` se o cliente for excluído da lista por qualquer razão. O `?.` protege de crash, mas não de informação faltando.

---

### 🟢 Baixo

#### 1.8 IDs gerados com `Date.now()` podem colidir
**Arquivo**: [App.jsx:328](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L328), [363](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L363), [420](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L420)
`Date.now()` como ID é aceito para protótipo, mas se dois registros forem criados rapidamente (clique duplo), os IDs colidem.

#### 1.9 `confirmData` não é limpo ao fechar modal genérico
**Arquivo**: [App.jsx:306](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L306)
A função `closeModal()` não reseta `confirmData` para `null`. Não causa crash, mas deixa dados stale em memória.

---

## 🕳️ 2. Lacunas de UX / Usabilidade

### 🔴 Crítico

#### 2.1 Sem busca/filtro na lista de clientes e ordens
A aba "Clientes" e "Ordens de Serviço" **não possuem nenhum campo de busca**. Em operação real, mesmo com poucos clientes, localizar um registro por nome ou CPF é essencial. A aba "Agenda" tem filtro, mas as demais não.

---

### 🟡 Médio

#### 2.2 Não há feedback visual de sucesso após salvar
Ao salvar um cliente, serviço ou ordem, o modal simplesmente fecha. Não há **toast**, **snackbar** ou qualquer indicação de que a operação foi bem-sucedida. O usuário fica sem saber se deu certo.

#### 2.3 Modal de detalhes não permite ações diretas
O modal "Detalhes da ordem" ([App.jsx:1033-1058](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L1033-L1058)) mostra apenas informações e um botão "Fechar". Deveria ter botões de ação contextual (Editar, Avançar status, Cancelar) de acordo com o status da ordem, evitando que o usuário feche o modal para fazer a ação.

#### 2.4 Agenda não separa/agrupa por dia
A agenda lista todas as ordens sem agrupamento por data. Em uso real, o funcionário quer ver: "Hoje → 3 serviços, Amanhã → 2 serviços". A falta de agrupamento dificulta o planejamento diário.

#### 2.5 Agenda mostra ordens de todos os status, incluindo canceladas e pagas
A aba Agenda deveria filtrar apenas ordens relevantes (`agendada` e possivelmente `realizada`). Mostrar ordens pagas e canceladas polui a visão do funcionário.

#### 2.6 Telefone sem máscara de formatação
O campo de telefone do cliente aceita texto livre. Deveria ter máscara `(00) 00000-0000` como o CPF tem máscara `000.000.000-00`. Isso causa inconsistência na apresentação dos dados.

#### 2.7 Formato de data brasileiro não é usado
Datas são exibidas no formato ISO `2026-05-28` em todo o sistema. O padrão brasileiro é `28/05/2026`. Isso pode confundir o cliente na hora da demonstração.

---

### 🟢 Baixo

#### 2.8 Campo de Estado é texto livre
O campo "Estado" no cadastro de cliente é um input aberto. Deveria ser um `<select>` com os 27 estados brasileiros para evitar erros de digitação.

#### 2.9 Tabelas sem paginação
As tabelas de ordens e clientes renderizam todos os registros de uma vez. Para o protótipo é aceitável, mas vale destacar que em produção isso será necessário.

#### 2.10 Sem indicação de campos obrigatórios no modal de serviço
O modal de novo serviço ([App.jsx:935-936](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L935-L936)) não usa a prop `required` nos `FInput`, então o asterisco `*` não aparece, diferente do modal de cliente que os tem.

---

## 🧩 3. Funcionalidades Simples Faltando

### 🔴 Crítico

#### 3.1 Sem exclusão de serviço — apenas inativação
Serviços podem ser inativados, mas **não podem ser reativados** (diferente de clientes que têm botão "Reativar"). Se o admin inativar um serviço por engano, a única saída é recriar.

#### 3.2 Sem observações/notas na ordem de serviço
O modelo de ordem ([App.jsx:268-273](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L268-L273)) não tem campo de **observações/notas**. Em uma lavanderia, é crítico anotar: "sofá com mancha no canto esquerdo", "cliente pediu para ligar 30min antes", "acesso pelo portão lateral". Esta é provavelmente a funcionalidade mais importante que está faltando.

---

### 🟡 Médio

#### 3.3 Sem histórico de ordens por cliente
Não há forma de ver rapidamente todas as ordens de um cliente específico. O admin precisa navegar manualmente na lista de ordens. Um link "Ver ordens" na tela de clientes resolveria.

#### 3.4 Sem contagem de clientes/serviços ativos na Dashboard
A dashboard mostra apenas métricas de ordens. Métricas básicas como "Total de clientes ativos" e "Serviços cadastrados" dariam mais contexto.

#### 3.5 Sem exportação de relatórios
A aba de relatórios calcula dados corretamente, mas não há opção de exportar (PDF, CSV, impressão). Para um sistema de gestão, isso é esperado.

#### 3.6 Sem confirmação ao clicar "Marcar realizado" na Agenda (funcionário)
**Arquivo**: [App.jsx:811](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L811)
Na aba Agenda, quando o funcionário clica "Marcar realizado", o status muda **imediatamente** sem confirmação. Na aba Ordens (admin) existe modal de confirmação. Deveria ser consistente.

#### 3.7 Sem validação de conflito de horário
Ao criar uma ordem, nada impede agendar dois serviços para o mesmo funcionário no mesmo dia e horário. Deveria ao menos exibir um aviso.

#### 3.8 Sem campo "Complemento" no endereço
O formulário de cliente tem Rua, Número, Bairro, Cidade, Estado e CEP, mas falta o campo "Complemento" (apto, bloco, referência). Para serviços de lavanderia domiciliar, esse dado é importante para o funcionário encontrar o local.

#### 3.9 Sem forma de pagamento na ordem
Não há campo para registrar o método de pagamento (Dinheiro, PIX, Cartão, etc). Quando a ordem avança para "paga", não se sabe como o pagamento foi feito.

---

### 🟢 Baixo

#### 3.10 Sem "Esqueci minha senha"
A tela de login não tem link de recuperação. Aceitável para protótipo, mas vale mencionar.

#### 3.11 Sem foto/avatar do funcionário
Os funcionários na agenda são identificados apenas por nome. Um avatar ajudaria na identificação visual rápida.

#### 3.12 Dashboard sem gráfico visual de tendência
A aba Relatórios tem barras de progresso por mês, mas a Dashboard não tem nenhum indicador visual de tendência (subindo/descendo). Mesmo um simples "↑ 15% vs. mês anterior" agregaria valor.

#### 3.13 Sem reativação de serviço inativado
Como mencionado em 3.1, não há botão "Reativar" para serviços, embora exista para clientes. Inconsistência funcional.

---

## 🔒 4. Segurança & Arquitetura

> [!IMPORTANT]
> Estes pontos são **esperados em um protótipo** e não são falhas do protótipo em si, mas devem estar no radar para a versão de produção.

### 🔴 Crítico (para produção)

#### 4.1 Senhas em texto plano no código-fonte
**Arquivo**: [App.jsx:3-7](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L3-L7)
As credenciais estão hardcoded (`admin123`, `func123`). Na versão final, autenticação deve ser server-side com hashing (bcrypt/argon2).

#### 4.2 Sem persistência de dados
Todos os dados vivem em `useState` e são perdidos ao recarregar a página. O CLAUDE.md já documenta isso, mas vale reforçar que esta é a limitação mais visível durante uma demo — se o cliente atualizar a página, tudo desaparece.

---

### 🟡 Médio

#### 4.3 Sem controle de sessão/timeout
O login não tem expiração. Uma vez logado, o usuário permanece logado indefinidamente (até recarregar a página). Em produção, deveria ter timeout de inatividade.

#### 4.4 Arquivo único de 1.111 linhas
Todo o sistema está em um único arquivo `App.jsx`. Para o protótipo funciona, mas a manutenção será problemática. Recomendação: separar em componentes antes de adicionar mais features.

---

### 🟢 Baixo

#### 4.5 Sem `vite.config.js` visível
O projeto usa Vite mas não há arquivo de configuração customizado no root. Funciona com defaults, mas pode ser necessário para proxy de API, aliases, etc.

---

## 🗂️ 5. Resumo de Prioridades para Correção

### Antes de mostrar ao cliente (Quick Wins)
| # | Item | Esforço |
|---|---|---|
| 1.1 | Corrigir data hardcoded na validação | 5 min |
| 1.2 | Adicionar validação de data na edição | 5 min |
| 1.5 | Ordenar ordens por data no dashboard | 10 min |
| 2.7 | Formatar datas para padrão brasileiro | 20 min |
| 2.10 | Adicionar `required` nos campos de serviço | 2 min |
| 3.1/3.13 | Adicionar botão "Reativar" para serviços | 10 min |

### Para a próxima iteração do protótipo
| # | Item | Esforço |
|---|---|---|
| 3.2 | Campo de observações na ordem | 30 min |
| 2.1 | Busca na lista de clientes e ordens | 40 min |
| 2.2 | Toast de sucesso após salvar | 30 min |
| 2.6 | Máscara de telefone | 15 min |
| 2.4 | Agrupar agenda por dia | 45 min |
| 3.9 | Campo forma de pagamento | 20 min |
| 3.8 | Campo complemento no endereço | 10 min |
| 2.3 | Ações no modal de detalhes | 30 min |

### Para versão de produção
| # | Item | Esforço |
|---|---|---|
| 4.2 | Persistência (backend/banco) | Grande |
| 4.1 | Autenticação real | Grande |
| 4.4 | Componentização do código | Médio |
| 3.5 | Exportação de relatórios | Médio |
| 3.7 | Validação de conflito de horário | Médio |
| 2.5 | Filtrar agenda por status relevante | Pequeno |

---

## ✅ Pontos Positivos

Para ser justo, o protótipo tem vários acertos que vale ressaltar:

- ✅ **Validação de CPF completa** com algoritmo de dígitos verificadores e máscara
- ✅ **Fluxo de status bem definido** (agendada → realizada → paga / cancelada)
- ✅ **Responsividade** bem implementada com breakpoint mobile/desktop
- ✅ **Modal de confirmação de logout** — detalhe que demonstra cuidado com UX
- ✅ **Modal de confirmação antes de avançar status** (na aba Ordens)
- ✅ **Relatórios com filtros combinados** (período + serviço + funcionário)
- ✅ **Separação visual de ativo/inativo** com opacidade e badges
- ✅ **Serviço personalizado** na ordem — permite flexibilidade para serviços avulsos
- ✅ **Tela de login com credenciais de demo** — facilita testes pelo cliente
- ✅ **Validação de horário comercial** (08:00-18:00)
- ✅ **Duplicidade de CPF verificada** no cadastro de clientes
