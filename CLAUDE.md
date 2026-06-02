# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Vite, hot reload)
npm run build    # production build to dist/
```

No test runner or linter is configured.

## Architecture

This is a **single-file React prototype** for a laundry business management system ("Sistema de Lavanderia"). All application logic, styles, and UI live in `src/App.jsx` (~2007 lines). There is no routing library, no state management library, and no external CSS framework.

### Data model (in-memory only — no persistence)

All state is held in `useState` at the top of the `App` component and resets on page refresh:

- `USERS_INICIAL` — hardcoded const array (admin + 2 funcionários); seed for `usuarios` state
- `usuarios` — state array (managed at runtime); used for auth, funcionário selects, and the Funcionários management screen
- `clientes` — customer records: nome, sobrenome, CPF, telefone, email, full address fields (rua, numero, complemento, bairro, cidade, estado, cep), and `ativo` flag (soft delete)
- `servicos` — **plain const** (not state): `{ id, nome }` only; predefined pick-list when creating orders. No price or active flag here — price is set per line item in each order.
- `ordens` — service orders: clienteId + funcionarioId + dataEmissao + data + hora + `servicos[]` (line items: nome/qtd/valor/descricao) + status + endereco + obs + formaPagamento

### Auth & roles

`login()` compares email+password against `usuarios` (checks `ativo !== false`). Two roles:
- `admin` — sees all tabs: Dashboard, Clientes, Ordens, Agenda, Relatórios; accesses Funcionários via Opções menu
- `funcionario` — sees only Agenda, filtered to their own orders

> Note: there is no "Serviços" tab. The service catalog is a hardcoded const.

### Navigation

`aba` state string drives tab rendering. Desktop shows `.topbar`; mobile shows `.bottom-nav` (fixed, bottom). Both derive tab list from `abas` (role-dependent). Bottom nav also has a fixed "Opções" button. `NavIcon` renders SVG icons from `NAV_ICONS` path constants.

There is a hidden **Funcionários** pseudo-tab (`aba === "funcionarios"`), reached only via Opções → Funcionários; not part of `abas`.

### Modals

Single `modal` string state. Active values:

| value | description |
|---|---|
| `"cliente"` | New customer form |
| `"editarCliente"` | Edit existing customer |
| `"historicoCliente"` | View order history for a client (read-only, opened from Clientes tab) |
| `"ordem"` | New service order form |
| `"editarOrdem"` | Edit existing order (only from `agendada`/`agendamento_pago` status) |
| `"detalhe"` | View order details — also hosts inline edit mode via `detalheEditando` flag |
| `"confirmarAvanco"` | Confirm bidirectional status toggle (shows order summary + payment form when needed) |
| `"confirm"` | Generic confirmation (cancel order / inactivate client) |
| `"confirmLogout"` | Logout confirmation |
| `"opcoes"` | Options menu (Funcionários, Reset de senha, Sair) |
| `"novoUsuario"` | Create new user (admin only) |
| `"detalheUsuario"` | View/manage an existing user |
| `"editarUsuario"` | Edit user name/email |
| `"resetSenhaPropria"` | Logged-in user changes their own password |
| `"resetarSenhaUsuario"` | Admin resets another user's password |

The `Modal` wrapper handles overlay + sticky header/footer. Form states `fCliente` and `fOrdem`, validation errors (`erros`), live in `App`. There is a stale `setEditServico(null)` call inside `closeModal` — `editServico` is never defined as state; dead remnant from a removed Serviços tab.

### Status flow for ordens

Status transitions are **bidirectional toggles** via `calcularNovoStatus(currentStatus, botao)`:

- **Realizado button**: `agendada ↔ realizada`, `agendamento_pago ↔ paga`
- **Pago button**: `agendada ↔ agendamento_pago`, `realizada ↔ paga`

Cancellation sets status to `cancelada` (only from `agendada`). Cancelled orders can be reactivated to `agendada` via `reativarOrdem`. `STATUS_CONFIG` maps each status to label + color + background for `Badge`.

When registering payment (`agendada→agendamento_pago` or `realizada→paga`), the `confirmarAvanco` modal requires selecting a `confirmarFormaPagamento` before the confirm button is enabled.

### Inline edit in detalhe modal

The `"detalhe"` modal has two modes controlled by `detalheEditando` (boolean state):
- **View mode**: read-only grid + service list + Maps button + footer actions (Edit, Cancel OS, Fechar)
- **Edit mode**: same form fields as `"editarOrdem"`, entered via `entrarModoEdicaoDetalhe(o)`, exited via `cancelarEdicaoDetalhe()` or saved via `salvarEdicaoOrdem()`

Editing from `detalhe` modal is only allowed on `agendada` and `agendamento_pago` orders.

### Styling

All CSS is a template literal string (`css`) injected via `<style>{css}</style>`. Responsive breakpoint is `700px`: below it hides topbar and shows bottom nav; tables switch to card-style lists (`.table-desktop` / `.mobile-list` toggled via media query). The desktop modal uses `align-items:center`; mobile modal slides up from bottom.

### Reusable UI components (defined before `App`)

- `Badge({ status })` — colored pill using `STATUS_CONFIG`
- `Modal({ title, onClose, footer, children })` — overlay with sticky header/footer
- `FormGroup({ label, required, error, children })` — form field wrapper with label and error message
- `FInput` — `FormGroup` + `<input>` shorthand
- `FSelect` — `FormGroup` + `<select>` shorthand
- `NavIcon({ id })` — renders SVG path from `NAV_ICONS` for bottom nav
- `MapsPinIcon` — Google Maps pin SVG (yellow) used in Maps buttons
- `mapsUrl(endereco, cli)` — builds Google Maps URL from order address + client city/state
- `ClienteAutoComplete({ clienteId, onSelect, clientes, error })` — autocomplete input for client selection in order forms; on focus with no text shows last 5 clients (by id desc); on type searches active clients (max 10); uses `onMouseDown` on items (fires before `onBlur`); syncs display value via `useEffect([clienteId])` when parent changes clienteId

### Key state variables

- `proximoNumeroOS` — auto-incrementing OS number counter (starts at 132 in mock data)
- `ordemEditando` / `clienteEditando` — ID of record being edited
- `ordemAvancando` — `{ id, targetStatus }` for the confirmarAvanco modal
- `detalheOrdem` — order object opened in detalhe modal
- `detalheEditando` — boolean; true when detalhe modal is in edit mode
- `confirmData` — `{ tipo, id, msg }` for generic confirm modal
- `confirmarFormaPagamento` — selected payment method in confirmarAvanco (required for payment actions)
- `dashMes` — `"YYYY-MM"` string; current month selector for Dashboard KPIs
- `dashFiltroStatus` — filters dashboard list by status when a KPI card is clicked (null = show all)
- `historicoClienteId` — client ID for the historicoCliente modal
- `usuarioDetalhe` — user object for detalheUsuario/editarUsuario/resetarSenhaUsuario modals
- `fUsuario` / `fNovoUsuario` / `fResetSenha` — form state for user management modals
- `usuarios` / `proximoIdUsuario` — user list state and auto-increment counter

### Pagination state (all reset to 0 when their respective filters change)

- `agendaPagina` — current page for Agenda tab
- `dashPagina` — current page for Dashboard tab
- `clientesPagina` — current page for Clientes tab
- `ordensPagina` — current page for Ordens tab

All tabs paginate at **10 records/page**. Pagination nav uses class `.paginacao` (Dashboard, Clientes, Ordens) or `.agenda-paginacao` (Agenda). On mobile, both are `position:fixed` just above the bottom nav (`bottom:calc(60px + env(safe-area-inset-bottom))`). List containers use `.paginacao-pad` (or `.agenda-list`) to add `padding-bottom:60px` so content isn't hidden behind the fixed nav.

### Filter state

- `filtroBuscaCliente` — text search for Clientes tab
- `filtroOrdemCliente` / `filtroOrdemInicio` / `filtroOrdemFim` — Ordens tab filters
- `filtroStatusAgenda` — Agenda status filter: `"agendado"` | `"realizado"` | `"pago"` (maps to sets of statuses in `ordensFiltradas()`)
- `filtroFunc` / `filtroData` — Agenda funcionário and date filters (admin only)
- `relInicio` / `relFim` / `relServico` / `relFunc` — Relatórios filters

### Key utilities

- `validarCPF` / `fmtCPF` — CPF digit-check validation and `###.###.###-##` input masking
- `fmtData(iso)` — `"2026-05-28"` → `"28/05/2026"` (string split, no timezone dependency)
- `fmtMes(ym)` — `"2026-03"` → `"Mar/2026"` using `MESES_ABREV`
- `fmtDataPorExtenso(iso)` — `"2026-06-03"` → `"3 de Junho de 2026"` using `MESES_EXTENSO`
- `fmtTelefone(v)` — phone mask: `(00) 00000-0000` (mobile) or `(00) 0000-0000` (landline)
- `totalOrdem(o)` — sums `qtd * valor` across an order's service line items
- `FORMAS_PAGAMENTO` — const array of payment method strings (PIX, DÉBITO, CRÉDITO variants)

### Key derivations (useMemo)

- `ordensRelatorio` — orders with `status === "paga"` filtered by month range, funcionário, service type
- `faturamentoTotal` — total revenue from `ordensRelatorio` (further filtered by `relServico` if set)
- `porServicoRel` — revenue breakdown by service name, sorted descending
- `porMesRel` — revenue breakdown by month, sorted ascending; rendered as inline bar chart

### Dashboard

`dashMes` (month selector in page header) drives all dashboard data. `ordensDashMes` = orders in that month. `kpiDash` aggregates: agendadas, pendenteExecucao (agendamento_pago), pendentePagamento (realizada), faturamento (paga + agendamento_pago). KPI cards are clickable to filter `ordensDashboard` by status (`dashFiltroStatus`). `ordensDashboard` shows all orders in the month: when no filter, pending orders (agendada + agendamento_pago) sorted by date/hour first, then others sorted by number desc.

### Ordens tab

Filters: client name (text), start date, end date — all combinable, all reset `ordensPagina` to 0. Layout: `.ordens-filtros` flex row (desktop) / column (mobile). On mobile: client name full-width on top, dates below side by side.

### Agenda tab

`ordensFiltradas()` function (not memo) applies `filtroStatusAgenda` → status whitelist, funcionário filter, date filter, and role filter (funcionário sees only their own). Results sorted by date+hora, grouped by date into day separators (`.agenda-day-sep`, gray style: `background:#e8eaed; border:1px solid #d1d5db; color:#4b5563`).

Filter bar layout uses CSS grid `1fr auto 1fr` on desktop (left spacer balances right column, center holds status pills). On mobile: column layout, right filters moved above pills (`order:-1`).

Agenda cards (`.agenda-card` with inner `.agenda-card-top`): left column = OS#, Cliente: (bold prominent), Data do Serviço/Hora/Funcionário labels, services listed vertically in gray. Right column = total + Badge, and for funcionário role a "Realizado" button bottom-right (blue when filter=agendado, green otherwise).

### Funcionários screen

Hidden tab `aba === "funcionarios"` accessible via Opções → Funcionários (admin only). Lists all users as cards with role badge. Clicking a card opens `detalheUsuario` modal. Admin can inativar/reativar, edit name/email, and reset password from there.

### Service line items in orders

Each order's `servicos` array contains `{ nome, qtd, valor, descricao }`. When creating/editing, user picks from predefined `servicosAtivos` list. `descricao` is a free-text "Descrição do Objeto" field (optional). Custom service name entry via `servicoId === ""` with manual nome. Price always entered manually per line item.

### Responsive layout patterns

- Breakpoint: `700px` — `@media(max-width:700px)` for mobile, `@media(min-width:701px)` for desktop
- `.table-desktop` / `.mobile-list` toggled by media query (display:none each way)
- `.form-row.cols2` → single column on mobile; `.form-row.cols2-force` stays two columns
- `.rel-filter-grid` → 4 columns desktop, 2 columns mobile (defined in CSS class, not inline style — inline would override media query)
- `.agenda-filter-bar` → CSS grid `1fr auto 1fr` desktop; flex column mobile
- Pagination nav fixed above bottom nav on mobile via `position:fixed; bottom:calc(60px + env(safe-area-inset-bottom))`

### Known dead code

`setEditServico(null)` inside `closeModal` — `editServico` is never defined as state; remnant from a removed Serviços tab. Safe to ignore.
