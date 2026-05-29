# 📋 Relatório Final — Protótipo Sistema de Lavanderia

> **Escopo**: Análise completa do protótipo visando um MVP robusto para aprovação do cliente.
> **Foco**: Funcionalidades simples que agregam valor + furos de apresentação/formatação/UX que podem comprometer a demonstração.
> **Fora de escopo**: Segurança, persistência de dados, arquitetura — serão tratados na implementação da solução aprovada.
> **Data**: 27/05/2026

---

## 📌 Resumo

| Categoria | Qtd |
|---|:---:|
| 🐛 Furos e inconsistências encontrados | 18 |
| 🧩 Funcionalidades simples sugeridas para o MVP | 16 |
| **Total de itens** | **34** |

---

## 🐛 PARTE 1 — Furos e Inconsistências

Problemas que já existem no protótipo e que, se não corrigidos, podem causar confusão durante a demonstração ou transmitir falta de polimento.

---

### ✅ F01 — Formato de data brasileiro não é usado

**Onde**: Todo o sistema (Dashboard, Ordens, Agenda, Relatórios, Modal de detalhes)

Datas são exibidas no formato ISO `2026-05-28` em todo o sistema. O padrão brasileiro é `28/05/2026`. Isso pode confundir o cliente na hora da demonstração.

**Exemplos no código**:
- Linha 627: `{o.data} · {o.hora}` → exibe `2026-05-28 · 09:00`
- Linha 845: `{o.data} às {o.hora}` → exibe `2026-05-28 às 09:00`
- Linha 909: meses no relatório exibidos como `2026-03` em vez de `Mar/2026`

**Correção**: Criar função `fmtData(d)` que converta `2026-05-28` → `28/05/2026` e `fmtMes(m)` que converta `2026-03` → `Mar/2026`.

---

### ✅ F02 — Telefone sem máscara de formatação

**Onde**: Modal de cadastro/edição de cliente (linhas 933, 959)

O campo de telefone do cliente aceita texto livre. O CPF tem máscara `000.000.000-00` com a função `fmtCPF`, mas o telefone não tem nenhuma máscara equivalente. Isso causa inconsistência: o CPF fica sempre bonito, o telefone fica bagunçado.

**Correção**: Criar função `fmtTelefone(v)` com máscara `(00) 00000-0000` ou `(00) 0000-0000`, análoga à `fmtCPF`.

---

### ✅ F03 — Data hardcoded na validação de ordens

**Onde**: [App.jsx:383](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L383)

```javascript
if (fOrdem.data <= "2026-05-22") e.data = "Escolha uma data futura.";
```

A data `"2026-05-22"` está fixa no código. Amanhã esse valor já estará defasado. Qualquer data entre 22/05 e a data real de hoje será aceita como válida (quando não deveria), e datas válidas futuras poderão ser rejeitadas quando o calendário avançar.

**Correção**: Substituir por `new Date().toISOString().slice(0,10)` para comparar com a data atual dinâmica.

---

### ✅ F04 — Edição de ordem não valida data futura

**Onde**: [App.jsx:418-441](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L418-L441) — função `salvarEdicaoOrdem()`

A criação de ordem valida se a data é futura (mesmo com o bug F03), mas a **edição** de ordem não faz essa verificação. Ao editar uma ordem agendada, é possível colocar uma data no passado sem nenhum impedimento.

**Correção**: Adicionar a mesma validação de data futura na `salvarEdicaoOrdem()`.

---

### ✅ F05 — Dashboard mostra ordens sem ordenação lógica

**Onde**: [App.jsx:621](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L621)

```javascript
ordens.slice(0, 6)
```

O dashboard pega as 6 primeiras ordens na **ordem de inserção no array**, não por data ou relevância. Isso significa que o cliente verá ordens antigas de março no topo enquanto as ordens de amanhã ficam escondidas.

**Correção**: Ordenar por data decrescente ou mostrar as próximas agendadas primeiro: `[...ordens].sort((a,b) => b.data.localeCompare(a.data)).slice(0, 6)`.

---

### 🟡 F06 — Valor monetário sem formatação brasileira

**Onde**: Todo o sistema

Valores são exibidos como `R$ 250.00` (ponto decimal) em vez de `R$ 250,00` (vírgula decimal, padrão brasileiro). Embora `toFixed(2)` funcione, o separador decimal deveria ser vírgula.

**Exemplos**:
- Linha 613: `R$ ${totalFaturado.toFixed(2)}` → exibe `R$ 2230.00`
- Linha 849: `R$ ${totalOrdem(o).toFixed(2)}` → exibe `R$ 550.00`

**Correção**: Criar função `fmtMoeda(v)` usando `v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` ou no mínimo `.toFixed(2).replace('.', ',')`.

---

### 🟡 F07 — CEP sem máscara de formatação

**Onde**: Modal de cadastro/edição de cliente (linhas 937, 963)

O campo CEP aceita texto livre. Deveria ter máscara `00000-000` como o CPF tem máscara. Os dados de exemplo estão formatados (`78700-000`), mas nada impede o usuário de digitar `78700000` ou `78.700-000`.

**Correção**: Criar função `fmtCEP(v)` com máscara `00000-000`.

---

### 🟡 F08 — Agenda mostra apenas ordens "agendada", mas deveria mostrar "realizada" também

**Onde**: [App.jsx:484](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L484) — função `ordensFiltradas()`

```javascript
if (o.status !== "agendada") return false;
```

A agenda filtra **apenas** ordens com status `agendada`. Ordens `realizada` (serviço feito, mas ainda não pago) desaparecem completamente da visão do funcionário. Se o funcionário marcar como realizado e quiser rever os detalhes, não tem onde encontrar.

**Correção**: Filtrar por `["agendada", "realizada"].includes(o.status)` e diferenciar visualmente com o badge.

---

### 🟡 F09 — Agenda não agrupa por dia

**Onde**: Aba Agenda (linhas 838-862)

A agenda lista todas as ordens em uma lista corrida sem separação por data. O funcionário precisa escanear visualmente para identificar o que é hoje, amanhã, semana que vem. Para um sistema de agenda, essa informação deveria ser imediata.

**Correção**: Agrupar os cards por data com cabeçalhos como "Hoje — 27/05/2026", "Amanhã — 28/05/2026", "30/05/2026".

---

### 🟡 F10 — Sem feedback visual de sucesso após salvar

**Onde**: Funções `salvarCliente()`, `salvarServico()`, `salvarOrdem()`, `salvarEdicaoOrdem()`, `salvarEdicaoCliente()`

Ao salvar qualquer registro, o modal simplesmente fecha. Não há toast, snackbar ou qualquer indicação de que a operação foi bem-sucedida. O usuário clica "Salvar" e o modal desaparece — ele fica sem certeza se funcionou.

**Correção**: Implementar um componente `Toast` simples que apareça por 3 segundos com "✓ Cliente salvo com sucesso", etc.

---

### 🟡 F11 — Relatórios com período hardcoded

**Onde**: [App.jsx:311-312](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L311-L312)

```javascript
const [relInicio, setRelInicio] = useState("2026-01");
const [relFim, setRelFim] = useState("2026-05");
```

Os filtros de período nos relatórios iniciam com valores fixos `2026-01` a `2026-05`. Se a demonstração for em julho, os filtros padrão não incluirão dados recém-criados.

**Correção**: Calcular dinamicamente com base na data atual, por exemplo, últimos 6 meses até o mês atual.

---

### 🟡 F12 — Modal de detalhes da ordem é somente leitura

**Onde**: [App.jsx:1086-1114](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L1086-L1114)

O modal "Detalhes da ordem" mostra todas as informações mas oferece apenas o botão "Fechar". O usuário precisa fechar o modal, encontrar a ordem na lista e clicar na ação desejada. Deveria ter botões contextuais:
- Se `agendada`: Editar | Marcar Realizado | Cancelar
- Se `realizada`: Marcar Pago
- Se `cancelada`: Reativar

---

### 🟡 F13 — Relatórios ignoram ordens canceladas

**Onde**: [App.jsx:493](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L493)

```javascript
if (o.status !== "paga") return false;
```

Os relatórios consideram apenas ordens pagas. Não existe visão de taxa de cancelamento, ordens perdidas ou comparativo entre ordens agendadas vs realizadas vs canceladas. Para o dono do negócio, saber que 30% das ordens foram canceladas é informação valiosa.

---

### 🟢 F14 — Sem indicação de campos obrigatórios no modal de serviço

**Onde**: [App.jsx:979-980](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L979-L980)

O modal de novo serviço usa `<FInput>` sem a prop `required`, então o asterisco `*` não aparece nos labels "Nome do serviço" e "Valor padrão". Nos modais de cliente e ordem, os campos obrigatórios têm asterisco. Inconsistência visual.

**Correção**: Adicionar `required` nos dois `FInput` do modal de serviço.

---

### 🟢 F15 — Botão "Limpar filtros" nos relatórios reseta também o período

**Onde**: [App.jsx:886](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L886)

O botão "Limpar filtros" só aparece quando `relServico` ou `relFunc` está preenchido, mas ao clicar ele também reseta `relInicio` e `relFim` para valores fixos. O comportamento esperado seria limpar apenas os filtros de serviço e funcionário, mantendo o período selecionado.

---

### 🟢 F16 — Cliente inativo pode ter ordens abertas sem aviso

**Onde**: Fluxo de inativação de clientes

Ao inativar um cliente que tem ordens com status `agendada`, não há nenhum aviso de que existem ordens pendentes para aquele cliente. A mensagem de confirmação é genérica: "Ao inativar este cliente, todas suas ordens serão mantidas no histórico." — mas não menciona que tem 3 ordens agendadas para a semana que vem.

**Correção**: Na mensagem de confirmação, informar: "Este cliente possui X ordens agendadas. Ao inativar, as ordens serão mantidas mas o cliente não poderá ser selecionado em novas ordens."

---

### 🟢 F17 — Dropdown de cliente na criação de ordem não mostra informação suficiente

**Onde**: [App.jsx:991](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L991)

```javascript
{clientes.filter(c => c.ativo).map(c => <option value={c.id}>{c.nome} {c.sobrenome}</option>)}
```

Se existirem dois clientes chamados "Carlos Oliveira", não há como diferenciar. O dropdown deveria mostrar ao menos o bairro ou CPF parcial: `Carlos Oliveira — Centro` ou `Carlos Oliveira (***.***.980-05)`.

---

### 🟢 F18 — Endereço da ordem não se atualiza quando o endereço do cliente muda

**Onde**: [App.jsx:394](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L394), [App.jsx:436](file:///c:/Users/Digitalização05/Desktop/Prototipo%20React/src/App.jsx#L436)

```javascript
endereco: `${cli.rua}, ${cli.numero} - ${cli.bairro}`
```

O endereço é salvo como string fixa no momento da criação. Se o admin editar o endereço do cliente, ordens já criadas mantêm o endereço antigo. Isso é aceitável (snapshot do endereço na data), mas **ao editar uma ordem existente**, o endereço deveria ser regenerado a partir do cadastro atual do cliente, ou ao menos deveria haver a opção de atualizar.

---

## 🧩 PARTE 2 — Funcionalidades Simples Sugeridas para o MVP

Funcionalidades que não existem no protótipo e que agregariam valor significativo para aprovação do cliente, com esforço relativamente baixo de implementação.

---

### 🔴 MVP01 — Busca/filtro na lista de clientes

**Onde deveria estar**: Aba "Clientes"

A aba "Clientes" não possui nenhum campo de busca ou filtro. A aba "Agenda" tem filtro por funcionário e data, mas Clientes e Ordens não têm nada. Com 5 clientes de demonstração é OK, mas o cliente vai imaginar o sistema com 200+ clientes e vai questionar.

**Sugestão**: Campo de busca acima da tabela que filtre por nome, CPF ou telefone em tempo real.

---

### 🔴 MVP02 — Busca/filtro na lista de ordens

**Onde deveria estar**: Aba "Ordens de Serviço"

Mesma situação que clientes. Com 11 ordens de demonstração, ainda é navegável. Mas deveria ter filtro por status, por cliente ou por período.

**Sugestão**: Pelo menos um filtro por status (Todas | Agendadas | Realizadas | Pagas | Canceladas) com botões ou tabs.

---

### 🔴 MVP03 — Campo "Forma de Pagamento" na ordem

**Onde deveria estar**: No avanço de status para "paga"

Quando uma ordem avança para `paga`, não existe registro de **como** o pagamento foi feito (Dinheiro, PIX, Cartão Crédito, Cartão Débito, Boleto). Para o dono do negócio, saber a distribuição dos métodos de pagamento é essencial para gestão financeira.

**Sugestão**: No modal de confirmação de avanço para "pago", adicionar um `<select>` obrigatório de forma de pagamento. Exibir essa informação no modal de detalhes e nos relatórios.

---

### 🟡 MVP04 — Histórico de ordens por cliente

**Onde deveria estar**: Aba "Clientes" ou modal de detalhes do cliente

Não há forma rápida de ver todas as ordens de um cliente específico. O admin precisa ir na aba Ordens e procurar visualmente. Em uma lavanderia, é comum o cliente ligar e perguntar "qual foi o último serviço que fizeram aqui?" — o sistema deveria responder isso em 2 cliques.

**Sugestão**: Botão "Ver ordens" na linha de cada cliente, ou link na aba Clientes que filtra a aba Ordens por aquele cliente.

---

### 🟡 MVP05 — Contadores na Dashboard

**Onde deveria estar**: Aba "Dashboard"

A dashboard mostra apenas 3 métricas sobre ordens. Faltam dados contextuais básicos:
- Total de clientes ativos
- Total de serviços cadastrados
- Ordens agendadas para hoje / esta semana
- Valor total pendente (ordens agendadas + realizadas ainda não pagas)

**Sugestão**: Adicionar uma segunda linha de stat-cards com essas métricas.

---

### 🟡 MVP06 — Campo "Complemento" no endereço do cliente

**Onde deveria estar**: Modal de cadastro/edição de cliente

O formulário de endereço tem Rua, Número, Bairro, Cidade, Estado e CEP, mas falta o campo "Complemento" (Apto 101, Bloco B, Fundos, etc.). Para serviços de lavanderia a domicílio, o funcionário precisa dessa informação para encontrar o local.

**Sugestão**: Adicionar campo `complemento` entre "Número" e "Bairro".

---

### 🟡 MVP07 — Validação de conflito de horário

**Onde deveria estar**: Funções `salvarOrdem()` e `salvarEdicaoOrdem()`

Ao criar uma ordem, nada impede agendar dois serviços para o mesmo funcionário no mesmo dia e horário. Se o João Silva já tem uma ordem às 09:00 do dia 28/05, o sistema aceita agendar outra para ele no mesmo horário sem nenhum aviso.

**Sugestão**: Ao menos um **aviso** (não bloqueio) quando houver conflito: "Atenção: João Silva já possui uma ordem agendada para 28/05/2026 às 09:00. Deseja continuar?"

---

### 🟡 MVP08 — Exportação de relatórios (Impressão / PDF)

**Onde deveria estar**: Aba "Relatórios"

A aba de relatórios calcula dados e exibe na tela, mas não oferece nenhuma forma de exportar ou imprimir. Para um sistema de gestão, o dono vai querer levar esses números para o contador ou compartilhar.

**Sugestão**: Botão "Imprimir relatório" que usa `window.print()` com CSS de impressão dedicado. É a solução mais simples e gera PDF pelo navegador.

---

### 🟡 MVP09 — Ordenação das tabelas

**Onde deveria estar**: Abas "Clientes" e "Ordens de Serviço"

As tabelas não têm ordenação. Os registros aparecem na ordem de inserção. O admin deveria poder clicar no cabeçalho da coluna para ordenar por nome, data, valor, status, etc.

**Sugestão**: Implementar sort no header das colunas com indicador visual (▲/▼).

---

### 🟡 MVP10 — Indicador visual de ordens próximas do vencimento (hoje/atrasadas)

**Onde deveria estar**: Abas "Dashboard", "Ordens" e "Agenda"

Ordens agendadas para hoje ou com data passada (atrasadas) não têm nenhum destaque visual. Uma ordem para ontem e uma para daqui a 2 semanas parecem iguais visualmente.

**Sugestão**: Badge colorido ou ícone de alerta para ordens de hoje ("🔵 Hoje") e ordens atrasadas ("🔴 Atrasada"). Na Agenda, separar em seções: "Atrasadas", "Hoje", "Próximos dias".

---

### 🟡 MVP11 — Nome do sistema / marca do cliente

**Onde deveria estar**: Tela de login e topbar

O sistema mostra apenas "🧺 Lavanderia" como marca. Para a demonstração ao cliente, o ideal seria parametrizar o nome da empresa. Se o cliente se chama "LavaFácil" ou "CleanMax", ver o próprio nome no sistema gera identificação imediata.

**Sugestão**: Variável de configuração no topo do arquivo com o nome da empresa, ou pelo menos alterar para o nome real do cliente antes da demo.

---

### 🟢 MVP12 — Contagem de itens nas abas

**Onde deveria estar**: Navegação (topbar e bottom nav)

As abas mostram apenas o nome ("Clientes", "Ordens"). Seria útil ter um badge com contagem: "Clientes (5)", "Ordens (11)", "Agenda (7)".

**Sugestão**: Adicionar badge numérico ao lado do label das abas, pelo menos para "Agenda" mostrando quantas ordens estão agendadas.

---

### 🟢 MVP13 — "Esqueci minha senha" na tela de login

**Onde deveria estar**: Tela de login

A tela de login não tem link de recuperação. Embora no protótipo não funcione de verdade, ter o link visível demonstra que o fluxo foi pensado.

**Sugestão**: Link "Esqueci minha senha" que abre um modal informativo: "Na versão final, um e-mail de recuperação será enviado."

---

### 🟢 MVP14 — Dados de exemplo mais realistas

**Onde deveria estar**: Estado inicial do `useState`

Os dados de demonstração poderiam ser mais ricos para impressionar na demo:
- Mais variedade de serviços (ex: "Limpeza de Colchão", "Higienização de Cadeira de Escritório", "Limpeza de Banco de Carro")
- Ordens em mais status diferentes visíveis na dashboard
- Um cliente inativo para demonstrar a funcionalidade
- Uma ordem cancelada para mostrar o fluxo completo

---

### 🟢 MVP15 — Dashboard com "atalhos rápidos"

**Onde deveria estar**: Aba "Dashboard"

A dashboard mostra métricas e uma lista de ordens, mas não tem ações rápidas. Botões como "Nova Ordem", "Novo Cliente", "Ver Agenda de Hoje" economizam cliques e demonstram produtividade.

**Sugestão**: Seção "Ações rápidas" com 3-4 botões de atalho abaixo dos stat-cards.

---

### 🟢 MVP16 — Mensagem de "nenhum registro" mais informativa

**Onde deveria estar**: Listas vazias

Quando uma lista está vazia, aparece apenas "Nenhuma ordem encontrada." (linha 837). Poderia ter uma mensagem mais orientadora: "Nenhuma ordem agendada. Clique em '+ Nova ordem' para criar a primeira."

---

## 📊 PARTE 3 — Priorização para MVP

### 🏁 Essencial antes da demonstração ao cliente

| # | Item | Tipo | Esforço |
|---|---|---|---|
| F01 | Formato de data brasileiro (`28/05/2026`) | Furo | 20 min |
| F02 | Máscara de telefone `(00) 00000-0000` | Furo | 15 min |
| F03 | Data hardcoded na validação | Furo | 5 min |
| F04 | Validação de data futura na edição | Furo | 5 min |
| F05 | Ordenação do dashboard por data | Furo | 10 min |
| F06 | Formatação monetária brasileira (`R$ 250,00`) | Furo | 15 min |
| F14 | Asterisco nos campos obrigatórios de serviço | Furo | 2 min |
| MVP11 | Nome do sistema com marca do cliente | Funcionalidade | 5 min |

**⏱ Tempo estimado total: ~1h15min**

---

### 🎯 Recomendado para um MVP robusto

| # | Item | Tipo | Esforço |
|---|---|---|---|
| F07 | Máscara de CEP `00000-000` | Furo | 10 min |
| F08 | Agenda mostrando ordens realizadas | Furo | 10 min |
| F09 | Agenda agrupada por dia | Furo | 45 min |
| F10 | Toast de feedback ao salvar | Furo | 30 min |
| F11 | Período dos relatórios dinâmico | Furo | 10 min |
| F12 | Ações no modal de detalhes | Furo | 30 min |
| F17 | Info extra no dropdown de clientes | Furo | 10 min |
| MVP01 | Busca na lista de clientes | Funcionalidade | 30 min |
| MVP02 | Filtro por status na lista de ordens | Funcionalidade | 30 min |
| MVP03 | Forma de pagamento | Funcionalidade | 25 min |
| MVP04 | Histórico de ordens por cliente | Funcionalidade | 30 min |
| MVP05 | Contadores extras na Dashboard | Funcionalidade | 20 min |
| MVP06 | Campo complemento no endereço | Funcionalidade | 10 min |
| MVP07 | Aviso de conflito de horário | Funcionalidade | 30 min |
| MVP10 | Indicador de ordens hoje/atrasadas | Funcionalidade | 25 min |
| MVP15 | Atalhos rápidos na Dashboard | Funcionalidade | 20 min |

**⏱ Tempo estimado total: ~5h45min**

---

### 📌 Bom ter, mas pode ficar para depois

| # | Item | Tipo | Esforço |
|---|---|---|---|
| F13 | Relatório de cancelamentos | Furo | 40 min |
| F15 | Limpar filtros sem resetar período | Furo | 10 min |
| F16 | Aviso de ordens pendentes ao inativar cliente | Furo | 15 min |
| F18 | Endereço dinâmico na edição de ordem | Furo | 15 min |
| MVP08 | Exportação/impressão de relatórios | Funcionalidade | 45 min |
| MVP09 | Ordenação por coluna nas tabelas | Funcionalidade | 40 min |
| MVP12 | Badge de contagem nas abas | Funcionalidade | 15 min |
| MVP13 | Link "Esqueci minha senha" | Funcionalidade | 10 min |
| MVP14 | Dados de exemplo mais ricos | Funcionalidade | 20 min |
| MVP16 | Mensagens de lista vazia orientadoras | Funcionalidade | 10 min |

---

## ✅ PARTE 4 — O que o protótipo já faz bem

Para manter a perspectiva, o protótipo tem acertos que demonstram maturidade:

- ✅ **Validação de CPF completa** com algoritmo de dígitos verificadores e máscara automática
- ✅ **Fluxo de status bem definido** (`agendada → realizada → paga | cancelada`) com confirmação
- ✅ **Responsividade** desktop/mobile bem implementada com topbar ↔ bottom nav
- ✅ **Campo de observações** na ordem de serviço — essencial para o dia-a-dia
- ✅ **Link para Google Maps** no endereço — detalhe que impressiona
- ✅ **Serviço personalizado** na ordem — permite flexibilidade além do catálogo
- ✅ **Relatórios com filtros combinados** (período + serviço + funcionário)
- ✅ **Reativação** de clientes e ordens canceladas
- ✅ **Validação de horário comercial** (08:00-18:00)
- ✅ **Credenciais de demo** visíveis na tela de login
- ✅ **Modal de confirmação** de logout e de ações destrutivas
- ✅ **Separação visual** ativo/inativo com opacidade e badges coloridos
- ✅ **Nota explicativa** no CEP sobre busca automática na versão final — demonstra planejamento

---

> **Conclusão**: O protótipo cobre bem o fluxo principal e demonstra competência técnica. Os itens da seção "Essencial antes da demonstração" (~1h15 de trabalho) são suficientes para eliminar os furos mais visíveis. Os itens "Recomendados para MVP robusto" (~5h45) transformam o protótipo de "funcional" para "impressionante" na visão do cliente.
