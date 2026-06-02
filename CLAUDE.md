# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Vite, hot reload)
npm run build    # production build to dist/
```

No test runner or linter is configured.

## Architecture

This is a **single-file React prototype** for a laundry business management system ("Sistema de Lavanderia"). All application logic, styles, and UI live in `src/App.jsx` (~1254 lines). There is no routing library, no state management library, and no external CSS framework.

### Data model (in-memory only — no persistence)

All state is held in `useState` at the top of the `App` component and resets on page refresh:

- `USERS` — hardcoded const array (admin + 2 funcionários); used for auth and for populating funcionário selects
- `clientes` — customer records with nome, sobrenome, CPF, telefone, email, full address fields, and `ativo` flag (soft delete)
- `servicos` — **plain const** (not state) with `id` and `nome` only; used as a predefined pick-list when creating orders. No price or active flag here — price is set per service line item in each order.
- `ordens` — service orders linking clienteId + funcionarioId + data/hora + `servicos[]` (line items with nome/qtd/valor) + status + endereco + obs

### Auth & roles

`login()` compares email+password against `USERS`. Two roles exist:
- `admin` — sees all tabs: Dashboard, Clientes, Ordens, Agenda, Relatórios
- `funcionario` — sees only Agenda, filtered to their own orders

> Note: there is no "Serviços" tab. The service catalog is a hardcoded const.

### Navigation

Uses a single `aba` state string. Desktop shows a top bar (`topbar`); mobile shows a fixed bottom nav (`bottom-nav`). Both render the same tab list derived from `abas` (role-dependent). `NavIcon` renders SVG icons for the bottom nav using `NAV_ICONS` path constants.

### Modals

All forms are controlled via a single `modal` string state. Active modal values:

| value | description |
|---|---|
| `"cliente"` | New customer form |
| `"editarCliente"` | Edit existing customer |
| `"ordem"` | New service order form |
| `"editarOrdem"` | Edit existing order (only from `agendada` status) |
| `"detalhe"` | View order details (read-only) |
| `"confirmarAvanco"` | Confirm status advance (shows order summary before committing) |
| `"confirm"` | Generic confirmation (cancel order / inactivate client) |
| `"confirmLogout"` | Logout confirmation |

The `Modal` wrapper component handles overlay + sticky header/footer. Form field states `fCliente` and `fOrdem`, and validation errors (`erros`), live in the parent `App`. There is a stale `setEditServico(null)` call inside `closeModal` — `editServico` is never defined as state and is a dead remnant from a removed Serviços tab.

### Status flow for ordens

`agendada → realizada → paga` (forward only via `avancarStatus`, confirmed through `confirmarAvanco` modal). Cancellation sets status to `cancelada` and is only allowed from `agendada`. Canceled orders can be reactivated back to `agendada` via `reativarOrdem`. `STATUS_CONFIG` maps each status to a label + color + background for the `Badge` component.

### Styling

All CSS is written as a template literal string (`css`) injected via `<style>{css}</style>`. Responsive breakpoint is `700px`: below it hides the topbar and shows bottom nav; tables switch to card-style lists (`.table-desktop` / `.mobile-list` toggled via media query).

### Reusable UI components

- `Badge({ status })` — colored pill using `STATUS_CONFIG`
- `Modal({ title, onClose, footer, children })` — overlay with sticky header/footer
- `FormGroup({ label, required, error, children })` — form field wrapper with label and error message
- `FInput` — `FormGroup` + `<input>` shorthand
- `FSelect` — `FormGroup` + `<select>` shorthand
- `NavIcon({ id })` — renders SVG path from `NAV_ICONS` for bottom nav tabs
- `MapsPinIcon` — small Google Maps pin SVG used in the Maps button
- `mapsUrl(endereco, cli)` — builds a Google Maps search URL from order address + client city/state; used in the detalhe and confirmarAvanco modals

### Key state variables (non-obvious)

- `proximoNumeroOS` — auto-incrementing OS number counter (starts at 111, increments on each new order)
- `ordemEditando` / `clienteEditando` — ID of the record currently being edited
- `ordemAvancando` — ID of the order pending status advance confirmation
- `detalheOrdem` — order object opened in the detail modal
- `confirmData` — `{ tipo, id, msg }` for the generic confirm modal

### Key utilities

- `validarCPF` / `fmtCPF` — CPF validation (digit check algorithm) and input masking
- `fmtData(iso)` — converts `"2026-05-28"` → `"28/05/2026"` without timezone dependency
- `fmtMes(ym)` — converts `"2026-03"` → `"Mar/2026"` using `MESES_ABREV`
- `fmtTelefone(v)` — phone mask: `(00) 00000-0000` (mobile) or `(00) 0000-0000` (landline)
- `totalOrdem(o)` — sums `qtd * valor` across an order's service line items

### Key derivations (useMemo)

- `ordensRelatorio` — paid orders filtered by date range, funcionário, and service type (used in Relatórios tab)
- `faturamentoTotal` — total revenue from `ordensRelatorio`, filtered further by `relServico` if set
- `porServicoRel` — revenue breakdown by service name, sorted descending
- `porMesRel` — revenue breakdown by month, sorted ascending; rendered as a bar chart

### Dashboard KPIs

`kpiMes` aggregates order counts (agendadas, realizadas, pagas, canceladas) and monthly revenue filtered to the current calendar month. `ordensDashboard` shows the 6 most recent orders (agendadas first sorted by date, then others sorted by date descending).

### Ordens tab filters

Filters by client name (text search), start date, and end date. All filters are combinable and clearable.

### Agenda tab filters

Admin can filter by funcionário and by date. Funcionário role always sees only their own orders (filtered by `user.id`). Only orders with `status === "agendada"` appear in Agenda.

### Service line items in orders

Each order's `servicos` array contains `{ nome, qtd, valor }`. When creating/editing an order, the user picks from the predefined `servicosAtivos` list or enters a custom service name (`servicoId === "__livre"`). Price is always entered manually per line item.
