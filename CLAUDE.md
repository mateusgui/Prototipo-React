# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Vite, hot reload)
npm run build    # production build to dist/
```

No test runner or linter is configured.

## Architecture

This is a **single-file React prototype** for a laundry business management system ("Sistema de Lavanderia"). All application logic, styles, and UI live in `src/App.jsx` (~915 lines). There is no routing library, no state management library, and no external CSS framework.

### Data model (in-memory only — no persistence)

All state is held in `useState` at the top of the `App` component and resets on page refresh:

- `USERS` — hardcoded array (admin + 2 funcionários); used for auth and for populating funcionário selects
- `clientes` — customer records with full address and CPF
- `servicos` — service catalog with name/price/active flag
- `ordens` — service orders linking cliente + funcionário + date/time + service line items + status

### Auth & roles

`login()` compares email+password against `USERS`. Two roles exist:
- `admin` — sees all tabs: Dashboard, Clientes, Serviços, Ordens, Agenda, Relatórios
- `funcionario` — sees only Agenda, filtered to their own orders

### Navigation

Uses a single `aba` state string. Desktop shows a top bar; mobile shows a fixed bottom nav. Both render the same tab list derived from `abas` (role-dependent).

### Modals

All forms (cliente, serviço, ordem, detalhe, confirm) are controlled via a single `modal` string state. The `Modal` wrapper component handles overlay + sticky header/footer. Form field state (`fCliente`, `fServico`, `fOrdem`) and validation errors (`erros`) live in the parent `App`.

### Status flow for ordens

`agendada → realizada → paga` (forward only via `avancarStatus`). Cancellation sets status to `cancelada` and is only allowed from `agendada`.

### Styling

All CSS is written as a template literal string (`css`) injected via `<style>{css}</style>`. Responsive breakpoint is `700px`: below it hides the topbar and shows bottom nav; tables switch to card-style lists (`.table-desktop` / `.mobile-list` toggled via media query).

### Key utilities

- `validarCPF` / `fmtCPF` — CPF validation (digit check algorithm) and input masking
- `totalOrdem` — sums `qtd * valor` across an order's service line items
- `ordensRelatorio` / `faturamentoTotal` / `porServicoRel` / `porMesRel` — `useMemo` derivations used in the Relatórios tab
