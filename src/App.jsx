import React, { useState, useMemo, useEffect } from "react";

const FORMAS_PAGAMENTO = ["PIX", "DÉBITO", "CRÉDITO À VISTA", "CRÉDITO 1x", "CRÉDITO 2x", "CRÉDITO 3x", "CRÉDITO 4x", "CRÉDITO 5x", "CRÉDITO 6x"];

const USERS_INICIAL = [
  { id: 1, email: "admin@lavanderia.com", senha: "123456", nome: "Admin", perfil: "admin", ativo: true },
  { id: 2, email: "joao@lavanderia.com", senha: "123456", nome: "João Silva", perfil: "funcionario", ativo: true },
  { id: 3, email: "maria@lavanderia.com", senha: "123456", nome: "Maria Souza", perfil: "funcionario", ativo: true },
];

const STATUS_CONFIG = {
  agendada: { label: "Agendada", color: "#1a6fbb", bg: "#e8f3fc" },
  realizada: { label: "Serviço Realizado", color: "#1f7a3e", bg: "#e6f4ec" },
  agendamento_pago: { label: "Agendamento Pago", color: "#b85e1a", bg: "#fdf0e6" },
  paga: { label: "Pagamento Recebido", color: "#5b3fa6", bg: "#eeebfb" },
  cancelada: { label: "Cancelada", color: "#b83232", bg: "#fdeaea" },
};

const NAV_ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  clientes: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  servicos: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  ordens: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  agenda: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  relatorios: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
};

function NavIcon({ id }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={NAV_ICONS[id]} />
    </svg>
  );
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
  let r = (s * 10) % 11; if (r >= 10) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
  r = (s * 10) % 11; if (r >= 10) r = 0;
  return r === parseInt(cpf[10]);
}

function fmtCPF(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  if (v.length > 3) return v.replace(/(\d{3})(\d+)/, "$1.$2");
  return v;
}

// Converte "2026-05-28" → "28/05/2026" sem depender de fuso horário
function fmtData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Converte "2026-03" → "Mar/2026"
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
function fmtMes(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${MESES_ABREV[parseInt(m, 10) - 1]}/${y}`;
}
const MESES_EXTENSO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function fmtDataPorExtenso(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} de ${MESES_EXTENSO[parseInt(m, 10) - 1]} de ${y}`;
}
// Máscara de telefone: celular (00) 00000-0000 ou fixo (00) 0000-0000
function fmtTelefone(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (v.length > 6) return v.replace(/(\d{2})(\d{4,5})(\d+)/, "($1) $2-$3");
  if (v.length > 2) return v.replace(/(\d{2})(\d+)/, "($1) $2");
  if (v.length > 0) return `(${v}`;
  return v;
}

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;color:#1a1d23}
.app{min-height:100vh;background:#f4f6f9;padding-bottom:0}

/* ── TOPBAR (desktop) ── */
.topbar{background:#fff;border-bottom:1px solid #e2e5ea;padding:0 28px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.topbar-brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px;color:#1a1d23}
.topbar-nav{display:flex;gap:2px}
.nav-btn{background:none;border:none;cursor:pointer;padding:6px 14px;border-radius:6px;font-size:14px;color:#6b7280;transition:all .15s;display:flex;align-items:center;gap:6px}
.nav-btn:hover{background:#f4f6f9;color:#1a1d23}
.nav-btn.active{background:#eeebfb;color:#5b3fa6;font-weight:500}
.topbar-right{display:flex;align-items:center;gap:10px}
.user-chip{font-size:13px;color:#6b7280;background:#f4f6f9;padding:4px 10px;border-radius:99px;border:1px solid #e2e5ea}
.btn-opcoes{background:none;border:1px solid #e2e5ea;cursor:pointer;padding:5px 10px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#6b7280}
.btn-opcoes:hover{border-color:#c0c8d4;color:#1a1d23}
.opcoes-item{display:flex;align-items:center;gap:14px;width:100%;padding:14px 0;background:none;border:none;border-bottom:1px solid #f0f0f0;cursor:pointer;font-size:15px;color:#1a1d23;text-align:left}
.opcoes-item:last-child{border-bottom:none}
.opcoes-item:hover{color:#5b3fa6}
.opcoes-item-danger,.opcoes-item-danger:hover{color:#b83232}

/* ── BOTTOM NAV (mobile) ── */
.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e2e5ea;z-index:50;padding:0 4px;padding-bottom:env(safe-area-inset-bottom)}
.bottom-nav-inner{display:flex;justify-content:space-around}
.bnav-btn{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 6px;flex:1;color:#9ca3af;transition:color .15s;min-width:0}
.bnav-btn.active{color:#5b3fa6}
.bnav-btn span{font-size:10px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px}
.bnav-dot{width:4px;height:4px;border-radius:99px;background:#5b3fa6;margin-top:1px}

/* ── PAGE ── */
.page{padding:28px}
.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.page-title{font-size:20px;font-weight:600;color:#1a1d23}
.btn-primary{background:#5b3fa6;color:#fff;border:none;cursor:pointer;padding:8px 18px;border-radius:8px;font-size:14px;font-weight:500;transition:background .15s;white-space:nowrap}
.btn-primary:hover{background:#4d3490}
.btn-sm{padding:5px 12px;border-radius:6px;font-size:13px;border:1px solid #e2e5ea;background:#fff;cursor:pointer;color:#374151;transition:all .15s;white-space:nowrap}
.btn-sm:hover{border-color:#c0c8d4;background:#f9fafb}
.btn-danger{color:#b83232;border-color:#f0c4c4;background:#fff}
.btn-danger:hover{background:#fdeaea;border-color:#f0a0a0}
.btn-advance{color:#1f7a3e;border-color:#b8dfc8;background:#fff}
.btn-advance:hover{background:#e6f4ec;border-color:#8fceaa}
.btn-edit{color:#fff;background:#1f7a3e;border-color:#1f7a3e;display:inline-flex;align-items:center;gap:4px}
.btn-edit:hover{background:#186132;border-color:#186132}

/* ── CARD / TABLE ── */
.card{background:#fff;border-radius:12px;border:1px solid #e2e5ea;overflow:hidden}
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.table{width:100%;border-collapse:collapse;font-size:14px;min-width:600px}
.table th{text-align:left;padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;background:#f9fafb;border-bottom:1px solid #e2e5ea;white-space:nowrap}
.table td{padding:13px 16px;border-bottom:1px solid #f0f2f5;color:#374151;vertical-align:middle}
.table tr:last-child td{border-bottom:none}
.table tr:hover td{background:#fafbfc}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:500;white-space:nowrap}

/* mobile list cards (ordens / clientes) */
.m-card{background:#fff;border:1px solid #e2e5ea;border-radius:12px;padding:14px 16px;margin-bottom:10px}
.m-card-row{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px}
.m-card-title{font-size:15px;font-weight:600;color:#1a1d23}
.m-card-sub{font-size:13px;color:#6b7280;margin-bottom:4px}
.m-card-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;border-top:1px solid #f0f2f5;padding-top:10px}

/* ── STAT GRID ── */
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border:1px solid #e2e5ea;border-radius:12px;padding:20px 22px}
.stat-card.clickable{cursor:pointer;transition:transform .12s,box-shadow .12s}
.stat-card.clickable:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,.09)}
.stat-label{font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.stat-sublabel{font-size:11px;color:#9ca3af;margin-bottom:6px}
.stat-value{font-size:26px;font-weight:700;color:#1a1d23}
.stat-card.purple .stat-value{color:#5b3fa6}
.stat-card.green .stat-value{color:#1f7a3e}
.stat-card.blue .stat-value{color:#1a6fbb}
.stat-card.orange .stat-value{color:#b85e1a}

/* ── AGENDA ── */
.agenda-card{background:#fff;border:1px solid #e2e5ea;border-radius:12px;padding:16px 20px;margin-bottom:10px;display:flex;flex-direction:column;cursor:pointer;transition:all .15s}
.agenda-card-top{display:flex;justify-content:space-between;align-items:stretch;gap:12px}
.agenda-card:hover{border-color:#c0c8d4;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.agenda-card-name{font-size:15px;font-weight:600;color:#1a1d23;margin-bottom:3px}
.agenda-card-sub{font-size:13px;color:#6b7280}

/* ── CLIENTE AUTOCOMPLETE ── */
.cliente-ac-wrap{position:relative}
.cliente-ac-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #d1d5db;border-radius:8px;z-index:300;box-shadow:0 4px 16px rgba(0,0,0,.12);max-height:240px;overflow-y:auto}
.cliente-ac-header{font-size:11px;color:#9ca3af;padding:8px 14px 4px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
.cliente-ac-item{padding:10px 14px;cursor:pointer;border-bottom:1px solid #f0f2f5;transition:background .1s}
.cliente-ac-item:last-child{border-bottom:none}
.cliente-ac-item:hover{background:#f5f0ff}

/* ── RELATÓRIOS ── */
.rel-filter-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}

/* ── ORDENS FILTROS ── */
.ordens-filtros{display:flex;gap:10px;margin-bottom:16px;align-items:flex-end}
.ordens-filtro-nome{flex:1 1 200px}
.ordens-filtro-datas{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}

/* ── AGENDA FILTROS ── */
.agenda-filter-bar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:16px}
.agenda-filter-right{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}

/* ── AGENDA PAGINAÇÃO ── */
.agenda-day-sep{background:#e8eaed;border-radius:8px;padding:7px 16px;font-size:12px;font-weight:700;color:#4b5563;letter-spacing:.4px;margin:16px 0 8px;border:1px solid #d1d5db}
.agenda-list{position:relative}
.agenda-paginacao{display:flex;justify-content:center;align-items:center;gap:12px;padding:14px 0 4px}
.pag-btn{padding:7px 18px;border-radius:8px;border:1px solid #e2e5ea;background:#fff;font-size:13px;cursor:pointer;color:#374151;font-weight:500;transition:all .15s}
.pag-btn:hover:not(:disabled){border-color:#a78bda;color:#5b3fa6;background:#f5f0ff}
.pag-btn:disabled{opacity:.4;cursor:default}
.pag-info{font-size:13px;color:#6b7280;min-width:90px;text-align:center}

/* ── FORMS / MODALS ── */
.modal-overlay{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:0}
.modal{background:#fff;border-radius:18px 18px 0 0;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,.15)}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #e2e5ea;position:sticky;top:0;background:#fff;z-index:1}
.modal-title{font-size:16px;font-weight:600;color:#1a1d23}
.modal-close{background:none;border:none;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#6b7280}
.modal-close:hover{background:#f4f6f9;color:#1a1d23}
.modal-body{padding:20px}
.modal-footer{padding:14px 20px;border-top:1px solid #e2e5ea;display:flex;justify-content:flex-end;gap:10px;background:#f9fafb;border-radius:0;position:sticky;bottom:0}
.form-row{display:grid;gap:14px;margin-bottom:4px}
.form-row.cols2{grid-template-columns:1fr 1fr}
.form-row.cols3{grid-template-columns:2fr 1fr 1fr}
.form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.form-label{font-size:12px;font-weight:600;color:#374151;letter-spacing:.2px}
.form-label span{color:#b83232}
.form-input,.form-select{border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;font-size:14px;color:#1a1d23;background:#fff;outline:none;transition:border .15s;width:100%}
.form-input:focus,.form-select:focus{border-color:#a78bda;box-shadow:0 0 0 3px rgba(91,63,166,.1)}
.form-input.error,.form-select.error{border-color:#e55a5a}
.form-error{font-size:12px;color:#b83232;margin-top:2px}
.section-sep{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 12px;padding-bottom:6px;border-bottom:1px solid #f0f2f5}
.service-row{display:flex;flex-direction:column;gap:10px;margin-bottom:12px;padding:14px;background:#f9fafb;border:2px solid #c7d0db;border-radius:10px}
.service-row-bottom{display:grid;grid-template-columns:88px 1fr 32px;gap:8px;align-items:end}
.svc-field-label{font-weight:700;font-size:12px;color:#374151;display:block;margin-bottom:3px}
.pagamento-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.pagamento-btn{padding:6px 14px;border-radius:99px;border:1.5px solid #d1d5db;background:#fff;font-size:13px;cursor:pointer;transition:all .15s;color:#374151}
.pagamento-btn.selected{border-color:#5b3fa6;background:#eeebfb;color:#5b3fa6;font-weight:600}
.pagamento-btn:hover:not(.selected){border-color:#a78bda;background:#f5f0ff}
.btn-add-svc{background:none;border:1px dashed #d1d5db;color:#6b7280;border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer;transition:all .15s;width:100%;margin-top:4px}
.btn-add-svc:hover{border-color:#a78bda;color:#5b3fa6;background:#f5f0ff}
.btn-rem{background:none;border:none;cursor:pointer;color:#b83232;font-size:20px;padding:8px 4px;border-radius:6px;line-height:1}
.btn-rem:hover{background:#fdeaea}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:18px}
.detail-label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
.detail-value{font-size:14px;color:#1a1d23;font-weight:500}
.svc-list-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f0f2f5;font-size:14px}
.svc-list-row:last-child{border-bottom:none}
.svc-total{display:flex;justify-content:space-between;padding:10px 0 0;font-weight:700;font-size:15px}
.confirm-msg{font-size:14px;color:#374151;line-height:1.6;margin-bottom:8px}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;background:#f4f6f9;display:flex;align-items:center;justify-content:center;padding:20px}
.login-card{background:#fff;border-radius:16px;border:1px solid #e2e5ea;padding:36px 36px 28px;width:100%;max-width:360px;box-shadow:0 4px 24px rgba(0,0,0,.07)}
.login-logo{text-align:center;margin-bottom:24px}
.login-logo-icon{font-size:36px;margin-bottom:8px}
.login-logo-title{font-size:20px;font-weight:700;color:#1a1d23}
.login-logo-sub{font-size:13px;color:#6b7280;margin-top:2px}
.demo-box{background:#f4f6f9;border-radius:8px;padding:12px 14px;font-size:12px;color:#6b7280;margin-top:16px;line-height:1.8}
.demo-box strong{color:#374151}
.empty{text-align:center;padding:40px 0;color:#9ca3af;font-size:14px}
.rel-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #f0f2f5;font-size:14px}
.rel-row:last-child{border-bottom:none}
.rel-card{background:#fff;border:1px solid #e2e5ea;border-radius:12px;padding:8px 20px 16px}

/* ── RESPONSIVE ── */
@media(max-width:700px){
  .topbar{display:none}
  .bottom-nav{display:block}
  .app{padding-bottom:calc(60px + env(safe-area-inset-bottom))}
  .page{padding:16px 12px}
  .page-title{font-size:17px}
  .stat-grid{grid-template-columns:1fr 1fr;gap:10px}
  .stat-card{padding:14px 16px}
  .stat-value{font-size:20px}
  .table-desktop{display:none}
  .mobile-list{display:block}
  .form-row.cols2{grid-template-columns:1fr}
  .form-row.cols2-force{grid-template-columns:1fr 1fr}
  .form-row.cols3{grid-template-columns:1fr 1fr}
  .rel-two-col{grid-template-columns:1fr!important}
  .rel-filter-grid{grid-template-columns:1fr 1fr}
  .modal{border-radius:18px 18px 0 0;max-height:95vh}
  .ordens-filtros{flex-direction:column;align-items:stretch}
  .ordens-filtro-nome{flex:none}
  .ordens-filtro-datas{flex-wrap:nowrap}
  .agenda-filter-bar{display:flex;flex-direction:column;gap:10px;align-items:stretch}
  .agenda-filter-right{justify-content:center;order:-1}
  .agenda-filter-spacer{display:none}
  .agenda-paginacao{position:fixed;bottom:calc(60px + env(safe-area-inset-bottom));left:0;right:0;background:#fff;border-top:1px solid #e2e5ea;z-index:40;padding:10px 20px;justify-content:space-between}
  .agenda-list{padding-bottom:60px}
}
@media(min-width:701px){
  .modal-overlay{align-items:center;padding:20px}
  .modal{border-radius:14px;max-height:88vh}
  .modal-footer{border-radius:0 0 14px 14px}
  .table-desktop{display:block}
  .mobile-list{display:none}
}
.btn-success{background:#1f7a3e;color:#fff;border:none;cursor:pointer;padding:8px 18px;border-radius:8px;font-size:14px;font-weight:500;transition:background .15s;white-space:nowrap}
.btn-success:hover{background:#186132}
.btn-cancel-red{background:#b83232;color:#fff;border:none;cursor:pointer;padding:8px 18px;border-radius:8px;font-size:14px;font-weight:500;transition:background .15s;white-space:nowrap}
.btn-cancel-red:hover{background:#9c2929}
.btn-maps{display:inline-flex;align-items:center;gap:5px;background:#4285F4;border:1px solid #3b78dc;color:#fff;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;text-decoration:none;margin-top:6px;white-space:nowrap}
.btn-maps:hover{background:#3367d6;border-color:#2a56c6;color:#fff}
`;

function Badge({ status }) {
  const s = STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f4f6f9" };
  return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function mapsUrl(endereco, cli) {
  const parts = [endereco];
  if (cli?.cidade) parts.push(cli.cidade);
  if (cli?.estado) parts.push(cli.estado);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

function MapsPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#FBBC04" stroke="#FBBC04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill="#fff" stroke="#fff" />
    </svg>
  );
}

function FormGroup({ label, required, error, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}{required && <span> *</span>}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

function FInput({ label, required, error, ...props }) {
  return (
    <FormGroup label={label} required={required} error={error}>
      <input className={`form-input${error ? " error" : ""}`} {...props} />
    </FormGroup>
  );
}

function FSelect({ label, required, error, children, ...props }) {
  return (
    <FormGroup label={label} required={required} error={error}>
      <select className={`form-select${error ? " error" : ""}`} {...props}>{children}</select>
    </FormGroup>
  );
}

function ClienteAutoComplete({ clienteId, onSelect, clientes, error }) {
  const [inputVal, setInputVal] = useState("");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!clienteId) { setInputVal(""); return; }
    const cli = clientes.find(c => String(c.id) === String(clienteId));
    setInputVal(cli ? `${cli.nome} ${cli.sobrenome}` : "");
  }, [clienteId]);

  const ativos = clientes.filter(c => c.ativo);
  const ultimos5 = [...ativos].sort((a, b) => b.id - a.id).slice(0, 5);
  const sugestoes = busca.trim()
    ? ativos.filter(c => `${c.nome} ${c.sobrenome}`.toLowerCase().includes(busca.toLowerCase())).slice(0, 10)
    : ultimos5;

  return (
    <FormGroup label="Cliente" required error={error}>
      <div className="cliente-ac-wrap">
        <input
          className={`form-input${error ? " error" : ""}`}
          placeholder="🔍  Buscar cliente..."
          autoComplete="off"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setBusca(e.target.value); onSelect(""); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
        />
        {aberto && (
          <div className="cliente-ac-dropdown">
            {!busca.trim() && <div className="cliente-ac-header">Últimos cadastrados</div>}
            {sugestoes.length === 0
              ? <div style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 13 }}>Nenhum cliente encontrado.</div>
              : sugestoes.map(c => (
                <div key={c.id} className="cliente-ac-item" onMouseDown={() => { onSelect(String(c.id)); setInputVal(`${c.nome} ${c.sobrenome}`); setBusca(""); setAberto(false); }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>{c.nome} {c.sobrenome}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{c.cpf} · {c.telefone}</div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </FormGroup>
  );
}

function Modal({ title, onClose, footer, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [aba, setAba] = useState("dashboard");

  const servicos = [
    { id: 1, nome: "Limpeza e Higienização" },
    { id: 2, nome: "Impermeabilização" },
    { id: 3, nome: "Lavagem de Tapetes" },
    { id: 4, nome: "Lavagem de Cortinas" },
  ];

  const [clientes, setClientes] = useState([
    { id: 1, nome: "Ana", sobrenome: "Lima", cpf: "529.982.247-25", telefone: "(65) 99999-1111", rua: "Rua das Flores", numero: "10", bairro: "Centro", cidade: "Rondonópolis", estado: "MT", cep: "78700-000", ativo: true },
    { id: 2, nome: "Carlos", sobrenome: "Pereira", cpf: "871.688.760-60", telefone: "(65) 98888-2222", rua: "Av. Brasil", numero: "200", bairro: "Jardim", cidade: "Rondonópolis", estado: "MT", cep: "78710-000", ativo: true },
    { id: 3, nome: "Fernanda", sobrenome: "Santos", cpf: "153.509.460-56", telefone: "(65) 97777-3333", rua: "Rua Goiás", numero: "45", bairro: "Vila Aurora", cidade: "Rondonópolis", estado: "MT", cep: "78720-000", ativo: true },
    { id: 4, nome: "Roberto", sobrenome: "Oliveira", cpf: "046.113.980-05", telefone: "(65) 96666-4444", rua: "Rua Mato Grosso", numero: "312", bairro: "Residencial", cidade: "Rondonópolis", estado: "MT", cep: "78730-000", ativo: true },
    { id: 5, nome: "Patrícia", sobrenome: "Alves", cpf: "222.845.750-23", telefone: "(65) 95555-5555", rua: "Av. Lions", numero: "88", bairro: "Coophavila II", cidade: "Rondonópolis", estado: "MT", cep: "78740-000", ativo: true },
  ]);

  const [ordens, setOrdens] = useState([
    { id: 1, numero: 100, clienteId: 1, funcionarioId: 2, dataEmissao: "2026-02-28", data: "2026-03-05", hora: "09:00", status: "paga", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }], endereco: "Rua das Flores, 10 - Centro", obs: "Sofá com mancha no canto esquerdo. Acesso pelo portão lateral." },
    { id: 2, numero: 101, clienteId: 2, funcionarioId: 3, dataEmissao: "2026-03-14", data: "2026-03-20", hora: "14:00", status: "paga", servicos: [{ nome: "Impermeabilização", qtd: 2, valor: 300 }], endereco: "Av. Brasil, 200 - Jardim", obs: "Cliente pediu para ligar 30min antes de chegar." },
    { id: 3, numero: 102, clienteId: 1, funcionarioId: 2, dataEmissao: "2026-04-02", data: "2026-04-08", hora: "10:00", status: "paga", servicos: [{ nome: "Lavagem de Tapete", qtd: 3, valor: 180 }], endereco: "Rua das Flores, 10 - Centro", obs: "" },
    { id: 4, numero: 103, clienteId: 2, funcionarioId: 3, dataEmissao: "2026-04-16", data: "2026-04-22", hora: "11:00", status: "paga", servicos: [{ nome: "Impermeabilização", qtd: 1, valor: 300 }, { nome: "Lavagem de Tapete", qtd: 2, valor: 180 }], endereco: "Av. Brasil, 200 - Jardim", obs: "Tapete persa delicado, usar produto neutro." },
    { id: 5, numero: 104, clienteId: 1, funcionarioId: 2, dataEmissao: "2026-05-01", data: "2026-05-07", hora: "14:00", status: "paga", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 2, valor: 250 }], endereco: "Rua das Flores, 10 - Centro", obs: "" },
    { id: 6, numero: 105, clienteId: 3, funcionarioId: 2, dataEmissao: "2026-05-14", data: "2026-05-20", hora: "10:00", status: "paga", servicos: [{ nome: "Lavagem de Tapete", qtd: 2, valor: 180 }], endereco: "Rua Goiás, 45 - Vila Aurora", obs: "Tapete de lã, usar produto específico." },
    { id: 7, numero: 106, clienteId: 4, funcionarioId: 3, dataEmissao: "2026-05-22", data: "2026-05-28", hora: "11:30", status: "realizada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }, { nome: "Impermeabilização", qtd: 1, valor: 300 }], endereco: "Rua Mato Grosso, 312 - Residencial", obs: "Sofá retrátil com 4 módulos. Portão eletrônico, ligar ao chegar." },
    { id: 8, numero: 107, clienteId: 5, funcionarioId: 2, dataEmissao: "2026-05-26", data: "2026-06-03", hora: "09:00", status: "agendamento_pago", servicos: [{ nome: "Lavagem de Tapete", qtd: 1, valor: 180 }], endereco: "Av. Lions, 88 - Coophavila II", obs: "Cliente pagou antecipado via PIX." },
    { id: 9, numero: 108, clienteId: 1, funcionarioId: 3, dataEmissao: "2026-05-29", data: "2026-06-06", hora: "14:00", status: "agendada", servicos: [{ nome: "Impermeabilização", qtd: 2, valor: 300 }], endereco: "Rua das Flores, 10 - Centro", obs: "Segunda impermeabilização do ano. Checar resultado da anterior." },
    { id: 10, numero: 109, clienteId: 2, funcionarioId: 2, dataEmissao: "2026-06-01", data: "2026-06-10", hora: "08:00", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 3, valor: 250 }], endereco: "Av. Brasil, 200 - Jardim", obs: "Três sofás de 2 lugares. Preferência por horário matutino." },
    { id: 11, numero: 110, clienteId: 4, funcionarioId: 3, dataEmissao: "2026-06-01", data: "2026-06-13", hora: "15:00", status: "agendada", servicos: [{ nome: "Lavagem de Tapete", qtd: 2, valor: 180 }, { nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }], endereco: "Rua Mato Grosso, 312 - Residencial", obs: "" },
    { id: 12, numero: 111, clienteId: 2, funcionarioId: 3, dataEmissao: "2026-06-01", data: "2026-06-03", hora: "10:30", status: "agendada", servicos: [{ nome: "Impermeabilização", qtd: 1, valor: 300 }], endereco: "Av. Brasil, 200 - Jardim", obs: "" },
    { id: 13, numero: 112, clienteId: 3, funcionarioId: 2, dataEmissao: "2026-06-01", data: "2026-06-03", hora: "14:00", status: "agendada", servicos: [{ nome: "Lavagem de Cortinas", qtd: 4, valor: 90 }], endereco: "Rua Goiás, 45 - Vila Aurora", obs: "Cortinas do quarto e da sala." },
    { id: 14, numero: 113, clienteId: 1, funcionarioId: 2, dataEmissao: "2026-06-01", data: "2026-06-04", hora: "08:30", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }], endereco: "Rua das Flores, 10 - Centro", obs: "" },
    { id: 15, numero: 114, clienteId: 4, funcionarioId: 3, dataEmissao: "2026-06-02", data: "2026-06-04", hora: "11:00", status: "agendamento_pago", servicos: [{ nome: "Lavagem de Tapete", qtd: 3, valor: 180 }], endereco: "Rua Mato Grosso, 312 - Residencial", obs: "Pagamento recebido via transferência." },
    { id: 16, numero: 115, clienteId: 5, funcionarioId: 2, dataEmissao: "2026-06-02", data: "2026-06-04", hora: "16:00", status: "agendada", servicos: [{ nome: "Impermeabilização", qtd: 2, valor: 300 }, { nome: "Lavagem de Tapete", qtd: 1, valor: 180 }], endereco: "Av. Lions, 88 - Coophavila II", obs: "" },
    { id: 17, numero: 116, clienteId: 2, funcionarioId: 3, dataEmissao: "2026-06-02", data: "2026-06-05", hora: "09:00", status: "agendada", servicos: [{ nome: "Lavagem de Cortinas", qtd: 6, valor: 90 }], endereco: "Av. Brasil, 200 - Jardim", obs: "Cortinas de linho, cuidado com temperatura." },
    { id: 18, numero: 117, clienteId: 3, funcionarioId: 2, dataEmissao: "2026-06-02", data: "2026-06-05", hora: "13:30", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 2, valor: 250 }], endereco: "Rua Goiás, 45 - Vila Aurora", obs: "" },
    { id: 19, numero: 118, clienteId: 4, funcionarioId: 2, dataEmissao: "2026-06-02", data: "2026-06-06", hora: "09:30", status: "agendada", servicos: [{ nome: "Lavagem de Tapete", qtd: 2, valor: 180 }], endereco: "Rua Mato Grosso, 312 - Residencial", obs: "" },
    { id: 20, numero: 119, clienteId: 5, funcionarioId: 3, dataEmissao: "2026-06-02", data: "2026-06-06", hora: "15:00", status: "agendamento_pago", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }, { nome: "Lavagem de Cortinas", qtd: 2, valor: 90 }], endereco: "Av. Lions, 88 - Coophavila II", obs: "Pagamento via cartão débito." },
    { id: 21, numero: 120, clienteId: 1, funcionarioId: 3, dataEmissao: "2026-06-02", data: "2026-06-07", hora: "08:00", status: "agendada", servicos: [{ nome: "Impermeabilização", qtd: 1, valor: 300 }], endereco: "Rua das Flores, 10 - Centro", obs: "" },
    { id: 22, numero: 121, clienteId: 2, funcionarioId: 2, dataEmissao: "2026-06-02", data: "2026-06-07", hora: "11:30", status: "agendada", servicos: [{ nome: "Lavagem de Tapete", qtd: 1, valor: 180 }, { nome: "Impermeabilização", qtd: 1, valor: 300 }], endereco: "Av. Brasil, 200 - Jardim", obs: "Tapete persa, usar produto neutro." },
    { id: 23, numero: 122, clienteId: 3, funcionarioId: 3, dataEmissao: "2026-06-03", data: "2026-06-09", hora: "10:00", status: "agendada", servicos: [{ nome: "Lavagem de Cortinas", qtd: 8, valor: 90 }], endereco: "Rua Goiás, 45 - Vila Aurora", obs: "" },
    { id: 24, numero: 123, clienteId: 4, funcionarioId: 2, dataEmissao: "2026-06-03", data: "2026-06-09", hora: "14:30", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 2, valor: 250 }], endereco: "Rua Mato Grosso, 312 - Residencial", obs: "" },
    { id: 25, numero: 124, clienteId: 5, funcionarioId: 3, dataEmissao: "2026-06-03", data: "2026-06-10", hora: "09:00", status: "agendamento_pago", servicos: [{ nome: "Lavagem de Tapete", qtd: 2, valor: 180 }], endereco: "Av. Lions, 88 - Coophavila II", obs: "Pagou adiantado no atendimento anterior." },
    { id: 26, numero: 125, clienteId: 1, funcionarioId: 2, dataEmissao: "2026-06-03", data: "2026-06-10", hora: "13:00", status: "agendada", servicos: [{ nome: "Impermeabilização", qtd: 3, valor: 300 }], endereco: "Rua das Flores, 10 - Centro", obs: "" },
    { id: 27, numero: 126, clienteId: 2, funcionarioId: 3, dataEmissao: "2026-06-03", data: "2026-06-11", hora: "08:30", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }, { nome: "Lavagem de Cortinas", qtd: 3, valor: 90 }], endereco: "Av. Brasil, 200 - Jardim", obs: "" },
    { id: 28, numero: 127, clienteId: 3, funcionarioId: 2, dataEmissao: "2026-06-03", data: "2026-06-11", hora: "10:00", status: "agendada", servicos: [{ nome: "Lavagem de Tapete", qtd: 1, valor: 180 }], endereco: "Rua Goiás, 45 - Vila Aurora", obs: "" },
    { id: 29, numero: 128, clienteId: 4, funcionarioId: 3, dataEmissao: "2026-06-03", data: "2026-06-12", hora: "15:00", status: "agendada", servicos: [{ nome: "Impermeabilização", qtd: 2, valor: 300 }, { nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }], endereco: "Rua Mato Grosso, 312 - Residencial", obs: "" },
    { id: 30, numero: 129, clienteId: 5, funcionarioId: 2, dataEmissao: "2026-06-03", data: "2026-06-13", hora: "09:30", status: "agendada", servicos: [{ nome: "Lavagem de Cortinas", qtd: 5, valor: 90 }], endereco: "Av. Lions, 88 - Coophavila II", obs: "" },
    { id: 31, numero: 130, clienteId: 1, funcionarioId: 3, dataEmissao: "2026-06-03", data: "2026-06-16", hora: "10:00", status: "agendada", servicos: [{ nome: "Lavagem de Tapete", qtd: 2, valor: 180 }], endereco: "Rua das Flores, 10 - Centro", obs: "" },
    { id: 32, numero: 131, clienteId: 2, funcionarioId: 2, dataEmissao: "2026-06-03", data: "2026-06-16", hora: "14:00", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 2, valor: 250 }, { nome: "Impermeabilização", qtd: 1, valor: 300 }], endereco: "Av. Brasil, 200 - Jardim", obs: "" },
  ]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [proximoNumeroOS, setProximoNumeroOS] = useState(132);
  const [loginErro, setLoginErro] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [detalheOrdem, setDetalheOrdem] = useState(null);
  const [erros, setErros] = useState({});
  const [filtroFunc, setFiltroFunc] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroStatusAgenda, setFiltroStatusAgenda] = useState("agendado");
  const [agendaPagina, setAgendaPagina] = useState(0);
  const [relInicio, setRelInicio] = useState("2026-01");
  const [relFim, setRelFim] = useState("2026-05");
  const [relServico, setRelServico] = useState("");
  const [relFunc, setRelFunc] = useState("");

  const [fCliente, setFCliente] = useState({ nome: "", sobrenome: "", cpf: "", telefone: "", email: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "" });
  const [fOrdem, setFOrdem] = useState({ clienteId: "", funcionarioId: "", data: "", hora: "", obs: "", formaPagamento: "", servicos: [{ servicoId: "", nome: "", qtd: 1, valor: "", descricao: "" }] });
  const [ordemEditando, setOrdemEditando] = useState(null);
  const [ordemAvancando, setOrdemAvancando] = useState(null);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [detalheEditando, setDetalheEditando] = useState(false);
  const [filtroBuscaCliente, setFiltroBuscaCliente] = useState("");
  const [filtroOrdemCliente, setFiltroOrdemCliente] = useState("");
  const [filtroOrdemInicio, setFiltroOrdemInicio] = useState("");
  const [filtroOrdemFim, setFiltroOrdemFim] = useState("");
  const [usuarios, setUsuarios] = useState(USERS_INICIAL);
  const [proximoIdUsuario, setProximoIdUsuario] = useState(4);
  const [usuarioDetalhe, setUsuarioDetalhe] = useState(null);
  const [fUsuario, setFUsuario] = useState({ nome: "", email: "" });
  const [fNovoUsuario, setFNovoUsuario] = useState({ nome: "", email: "", senha: "", perfil: "funcionario" });
  const [fResetSenha, setFResetSenha] = useState({ nova: "" });
  const [confirmarFormaPagamento, setConfirmarFormaPagamento] = useState("");
  const [dashMes, setDashMes] = useState(new Date().toISOString().slice(0, 7));
  const [dashFiltroStatus, setDashFiltroStatus] = useState("agendada");
  const [historicoClienteId, setHistoricoClienteId] = useState(null);

  const funcionarios = usuarios.filter(u => u.perfil === "funcionario");

  function login() {
    const u = usuarios.find(u => u.email === loginEmail && u.senha === loginSenha && u.ativo !== false);
    if (u) { setUser(u); setAba(u.perfil === "admin" ? "dashboard" : "agenda"); }
    else setLoginErro("E-mail ou senha inválidos.");
  }

  function totalOrdem(o) { return o.servicos.reduce((s, sv) => s + sv.qtd * Number(sv.valor), 0); }
  function openModal(tipo) { setModal(tipo); setErros({}); }
  function closeModal() { setModal(null); setErros({}); setEditServico(null); setOrdemEditando(null); setOrdemAvancando(null); setClienteEditando(null); setDetalheEditando(false); setHistoricoClienteId(null); setUsuarioDetalhe(null); setFUsuario({ nome: "", email: "" }); setFNovoUsuario({ nome: "", email: "", senha: "", perfil: "funcionario" }); setFResetSenha({ nova: "" }); setConfirmarFormaPagamento(""); }
  function abrirConfirmarStatus(id, targetStatus) { setOrdemAvancando({ id, targetStatus }); setModal("confirmarAvanco"); }

  function validarFCliente(excluirId = null) {
    const e = {};
    if (!fCliente.nome) e.nome = "Obrigatório";
    if (!fCliente.cpf) e.cpf = "CPF é obrigatório";
    else if (!validarCPF(fCliente.cpf)) e.cpf = "CPF inválido. Verifique os dígitos.";
    else if (clientes.find(c => c.cpf === fCliente.cpf && c.id !== excluirId)) e.cpf = "Este CPF já está registrado.";
    if (!fCliente.telefone) e.telefone = "Obrigatório";
    if (!fCliente.rua) e.rua = "Obrigatório";
    if (!fCliente.numero) e.numero = "Obrigatório";
    if (!fCliente.bairro) e.bairro = "Obrigatório";
    if (!fCliente.cidade) e.cidade = "Obrigatório";
    if (!fCliente.estado) e.estado = "Obrigatório";
    return e;
  }

  function salvarCliente() {
    const e = validarFCliente();
    if (Object.keys(e).length) { setErros(e); return; }
    setClientes(p => [...p, { ...fCliente, id: Date.now(), ativo: true }]);
    setFCliente({ nome: "", sobrenome: "", cpf: "", telefone: "", email: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "" });
    closeModal();
  }

  function reativarCliente(id) { setClientes(p => p.map(c => c.id === id ? { ...c, ativo: true } : c)); }

  function inativarUsuario(id) { setUsuarios(p => p.map(u => u.id === id ? { ...u, ativo: false } : u)); }
  function reativarUsuario(id) { setUsuarios(p => p.map(u => u.id === id ? { ...u, ativo: true } : u)); }

  function salvarNovoUsuario() {
    const e = {};
    if (!fNovoUsuario.nome.trim()) e.uNome = "Nome obrigatório.";
    if (!fNovoUsuario.email.trim()) e.uEmail = "E-mail obrigatório.";
    else if (usuarios.some(u => u.email === fNovoUsuario.email.trim())) e.uEmail = "E-mail já cadastrado.";
    if (!fNovoUsuario.senha.trim()) e.uSenha = "Senha obrigatória.";
    else if (fNovoUsuario.senha.trim().length < 6) e.uSenha = "Mínimo de 6 caracteres.";
    if (Object.keys(e).length) { setErros(e); return; }
    setUsuarios(p => [...p, { id: proximoIdUsuario, nome: fNovoUsuario.nome.trim(), email: fNovoUsuario.email.trim(), senha: fNovoUsuario.senha.trim(), perfil: fNovoUsuario.perfil, ativo: true }]);
    setProximoIdUsuario(p => p + 1);
    closeModal();
  }

  function salvarEdicaoUsuario() {
    const e = {};
    if (!fUsuario.nome.trim()) e.uNome = "Nome obrigatório.";
    if (!fUsuario.email.trim()) e.uEmail = "E-mail obrigatório.";
    else if (usuarios.some(u => u.email === fUsuario.email.trim() && u.id !== usuarioDetalhe.id)) e.uEmail = "E-mail já cadastrado.";
    if (Object.keys(e).length) { setErros(e); return; }
    setUsuarios(p => p.map(u => u.id === usuarioDetalhe.id ? { ...u, nome: fUsuario.nome.trim(), email: fUsuario.email.trim() } : u));
    setModal("detalheUsuario");
    setErros({});
  }

  function salvarResetSenhaPropria() {
    if (!fResetSenha.nova.trim()) { setErros({ resetNova: "Nova senha obrigatória." }); return; }
    if (fResetSenha.nova.trim().length < 6) { setErros({ resetNova: "Mínimo de 6 caracteres." }); return; }
    setUsuarios(p => p.map(u => u.id === user.id ? { ...u, senha: fResetSenha.nova.trim() } : u));
    closeModal();
  }

  function salvarResetarSenhaUsuario() {
    if (!fResetSenha.nova.trim()) { setErros({ resetNova: "Nova senha obrigatória." }); return; }
    if (fResetSenha.nova.trim().length < 6) { setErros({ resetNova: "Mínimo de 6 caracteres." }); return; }
    setUsuarios(p => p.map(u => u.id === usuarioDetalhe.id ? { ...u, senha: fResetSenha.nova.trim() } : u));
    setModal("detalheUsuario");
    setErros({});
    setFResetSenha({ nova: "" });
  }

  function abrirEdicaoCliente(c) {
    setClienteEditando(c.id);
    setFCliente({ nome: c.nome, sobrenome: c.sobrenome, cpf: c.cpf, telefone: c.telefone, email: c.email || "", rua: c.rua, numero: c.numero, complemento: c.complemento || "", bairro: c.bairro, cidade: c.cidade, estado: c.estado, cep: c.cep || "" });
    setErros({});
    setModal("editarCliente");
  }

  function salvarEdicaoCliente() {
    const e = validarFCliente(clienteEditando);
    if (Object.keys(e).length) { setErros(e); return; }
    setClientes(p => p.map(c => c.id === clienteEditando ? { ...c, ...fCliente } : c));
    setFCliente({ nome: "", sobrenome: "", cpf: "", telefone: "", email: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "" });
    closeModal();
  }

  function salvarOrdem() {
    const e = {};
    if (!fOrdem.clienteId) e.clienteId = "Obrigatório";
    if (!fOrdem.funcionarioId) e.funcionarioId = "Obrigatório";
    if (!fOrdem.data) e.data = "Obrigatório";
    else if (fOrdem.data < new Date().toISOString().slice(0, 10)) e.data = "Escolha uma data futura.";
    if (!fOrdem.hora) e.hora = "Obrigatório";
    else if (fOrdem.hora < "08:00" || fOrdem.hora > "18:00") e.hora = "Entre 08:00 e 18:00";
    const svs = fOrdem.servicos.filter(s => s.nome && Number(s.valor) > 0);
    if (!svs.length) e.servicos = "Adicione pelo menos um serviço com valor.";
    if (Object.keys(e).length) { setErros(e); return; }
    const cli = clientes.find(c => c.id === parseInt(fOrdem.clienteId));
    const novoNumero = proximoNumeroOS;
    setOrdens(p => [...p, {
      id: Date.now(), numero: novoNumero, clienteId: parseInt(fOrdem.clienteId), funcionarioId: parseInt(fOrdem.funcionarioId),
      dataEmissao: new Date().toISOString().slice(0, 10),
      data: fOrdem.data, hora: fOrdem.hora, status: "agendada",
      servicos: svs.map(s => ({ nome: s.nome, qtd: parseInt(s.qtd) || 1, valor: parseFloat(s.valor), descricao: s.descricao || "" })),
      endereco: `${cli.rua}, ${cli.numero} - ${cli.bairro}`,
      obs: fOrdem.obs || "",
      formaPagamento: fOrdem.formaPagamento || ""
    }]);
    setProximoNumeroOS(n => n + 1);
    setFOrdem({ clienteId: "", funcionarioId: "", data: "", hora: "", obs: "", formaPagamento: "", servicos: [{ servicoId: "", nome: "", qtd: 1, valor: "", descricao: "" }] });
    closeModal();
  }

  function abrirEdicaoOrdem(o) {
    setOrdemEditando(o.id);
    setFOrdem({
      clienteId: String(o.clienteId),
      funcionarioId: String(o.funcionarioId),
      data: o.data,
      hora: o.hora,
      obs: o.obs || "",
      formaPagamento: o.formaPagamento || "",
      servicos: o.servicos.map(s => {
        const pred = servicosAtivos.find(sv => sv.nome === s.nome);
        return { servicoId: pred ? String(pred.id) : "", nome: s.nome, qtd: s.qtd, valor: String(s.valor), descricao: s.descricao || "" };
      })
    });
    setErros({});
    setModal("editarOrdem");
  }

  function salvarEdicaoOrdem() {
    const e = {};
    if (!fOrdem.clienteId) e.clienteId = "Obrigatório";
    if (!fOrdem.funcionarioId) e.funcionarioId = "Obrigatório";
    if (!fOrdem.data) e.data = "Obrigatório";
    else if (fOrdem.data < new Date().toISOString().slice(0, 10)) e.data = "Escolha uma data futura.";
    if (!fOrdem.hora) e.hora = "Obrigatório";
    else if (fOrdem.hora < "08:00" || fOrdem.hora > "18:00") e.hora = "Entre 08:00 e 18:00";
    const svs = fOrdem.servicos.filter(s => s.nome && Number(s.valor) > 0);
    if (!svs.length) e.servicos = "Adicione pelo menos um serviço com valor.";
    if (Object.keys(e).length) { setErros(e); return; }
    const cli = clientes.find(c => c.id === parseInt(fOrdem.clienteId));
    setOrdens(p => p.map(o => o.id === ordemEditando ? {
      ...o,
      clienteId: parseInt(fOrdem.clienteId),
      funcionarioId: parseInt(fOrdem.funcionarioId),
      data: fOrdem.data,
      hora: fOrdem.hora,
      servicos: svs.map(s => ({ nome: s.nome, qtd: parseInt(s.qtd) || 1, valor: parseFloat(s.valor), descricao: s.descricao || "" })),
      endereco: `${cli.rua}, ${cli.numero} - ${cli.bairro}`,
      obs: fOrdem.obs || "",
      formaPagamento: fOrdem.formaPagamento || ""
    } : o));
    setFOrdem({ clienteId: "", funcionarioId: "", data: "", hora: "", obs: "", formaPagamento: "", servicos: [{ servicoId: "", nome: "", qtd: 1, valor: "", descricao: "" }] });
    if (detalheEditando) {
      setDetalheEditando(false);
      setOrdemEditando(null);
      setErros({});
    } else {
      closeModal();
    }
  }

  function entrarModoEdicaoDetalhe(o) {
    setOrdemEditando(o.id);
    setFOrdem({
      clienteId: String(o.clienteId),
      funcionarioId: String(o.funcionarioId),
      data: o.data,
      hora: o.hora,
      obs: o.obs || "",
      formaPagamento: o.formaPagamento || "",
      servicos: o.servicos.map(s => {
        const pred = servicosAtivos.find(sv => sv.nome === s.nome);
        return { servicoId: pred ? String(pred.id) : "", nome: s.nome, qtd: s.qtd, valor: String(s.valor), descricao: s.descricao || "" };
      })
    });
    setErros({});
    setDetalheEditando(true);
  }

  function cancelarEdicaoDetalhe() {
    setDetalheEditando(false);
    setOrdemEditando(null);
    setErros({});
  }



  function mudarStatus(id, newStatus, formaPagamento = null) {
    setOrdens(p => p.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, status: newStatus };
      if (formaPagamento) updated.formaPagamento = formaPagamento;
      return updated;
    }));
  }

  function calcularNovoStatus(currentStatus, botao) {
    if (botao === "realizada") {
      if (currentStatus === "agendada") return "realizada";
      if (currentStatus === "realizada") return "agendada";
      if (currentStatus === "agendamento_pago") return "paga";
      if (currentStatus === "paga") return "agendamento_pago";
    }
    if (botao === "paga") {
      if (currentStatus === "agendada") return "agendamento_pago";
      if (currentStatus === "agendamento_pago") return "agendada";
      if (currentStatus === "realizada") return "paga";
      if (currentStatus === "paga") return "realizada";
    }
    return currentStatus;
  }

  function reativarOrdem(id) {
    setOrdens(p => p.map(o => o.id === id && o.status === "cancelada" ? { ...o, status: "agendada" } : o));
  }

  function confirmar(tipo, id, msg) { setConfirmData({ tipo, id, msg }); setModal("confirm"); }

  function executarConfirm() {
    if (!confirmData) return;
    if (confirmData.tipo === "cancelarOrdem") setOrdens(p => p.map(o => o.id === confirmData.id ? { ...o, status: "cancelada" } : o));
    if (confirmData.tipo === "inativarCliente") setClientes(p => p.map(c => c.id === confirmData.id ? { ...c, ativo: false } : c));
    closeModal();
  }

  function ordensFiltradas() {
    return ordens.filter(o => {
      // Filtro pelo botão de status da agenda
      let statusPermitidos;
      if (filtroStatusAgenda === "agendado") {
        statusPermitidos = ["agendada", "agendamento_pago"];
      } else if (filtroStatusAgenda === "realizado") {
        statusPermitidos = ["realizada"];
      } else if (filtroStatusAgenda === "pago") {
        statusPermitidos = ["paga", "agendamento_pago"];
      } else {
        // Sem filtro ativo: padrão por perfil
        statusPermitidos = user?.perfil === "funcionario"
          ? ["agendada", "agendamento_pago", "realizada", "paga"]
          : ["agendada", "agendamento_pago"];
      }
      if (!statusPermitidos.includes(o.status)) return false;
      if (user?.perfil === "funcionario" && o.funcionarioId !== user.id) return false;
      if (filtroFunc && o.funcionarioId !== parseInt(filtroFunc)) return false;
      if (filtroData && o.data !== filtroData) return false;
      return true;
    });
  }

  const ordensRelatorio = useMemo(() => ordens.filter(o => {
    if (o.status !== "paga") return false;
    const mes = o.data.slice(0, 7);
    if (relInicio && mes < relInicio) return false;
    if (relFim && mes > relFim) return false;
    if (relFunc && o.funcionarioId !== parseInt(relFunc)) return false;
    if (relServico && !o.servicos.some(s => s.nome === relServico)) return false;
    return true;
  }), [ordens, relInicio, relFim, relFunc, relServico]);

  const faturamentoTotal = useMemo(() => {
    if (!relServico) return ordensRelatorio.reduce((s, o) => s + totalOrdem(o), 0);
    return ordensRelatorio.reduce((s, o) => s + o.servicos.filter(sv => sv.nome === relServico).reduce((a, sv) => a + sv.qtd * sv.valor, 0), 0);
  }, [ordensRelatorio, relServico]);

  const porServicoRel = useMemo(() => {
    const map = {};
    ordensRelatorio.forEach(o => o.servicos.forEach(s => {
      if (!relServico || s.nome === relServico) map[s.nome] = (map[s.nome] || 0) + s.qtd * s.valor;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [ordensRelatorio, relServico]);

  const porMesRel = useMemo(() => {
    const map = {};
    ordensRelatorio.forEach(o => {
      const mes = o.data.slice(0, 7);
      const val = relServico
        ? o.servicos.filter(s => s.nome === relServico).reduce((a, s) => a + s.qtd * s.valor, 0)
        : totalOrdem(o);
      map[mes] = (map[mes] || 0) + val;
    });
    return Object.entries(map).sort();
  }, [ordensRelatorio, relServico]);

  const totalFaturado = ordens.filter(o => o.status === "paga").reduce((s, o) => s + totalOrdem(o), 0);
  const pendentes = ordens.filter(o => ["agendada", "agendamento_pago", "realizada"].includes(o.status)).length;
  const servicosAtivos = servicos;

  // Dashboard KPIs por competência selecionada
  const ordensDashMes = ordens.filter(o => o.data.slice(0, 7) === dashMes);
  const kpiDash = {
    agendadas: ordensDashMes.filter(o => o.status === "agendada").length,
    pendenteExecucao: ordensDashMes.filter(o => o.status === "agendamento_pago").length,
    pendentePagamento: ordensDashMes.filter(o => o.status === "realizada").length,
    faturamento: ordensDashMes.filter(o => ["paga", "agendamento_pago"].includes(o.status)).reduce((s, o) => s + totalOrdem(o), 0),
  };

  const ordensDashboard = (() => {
    if (dashFiltroStatus) {
      return ordensDashMes
        .filter(o => o.status === dashFiltroStatus)
        .sort((a, b) => b.numero - a.numero);
    }
    const pendentes = ordensDashMes
      .filter(o => ["agendada", "agendamento_pago"].includes(o.status))
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
    const outros = ordensDashMes
      .filter(o => !["agendada", "agendamento_pago"].includes(o.status))
      .sort((a, b) => b.numero - a.numero);
    return [...pendentes, ...outros].slice(0, 6);
  })();

  function setOrdemSvcField(i, field, val) {
    setFOrdem(p => { const s = [...p.servicos]; s[i] = { ...s[i], [field]: val }; return { ...p, servicos: s }; });
  }

  const abas = user?.perfil === "admin"
    ? [["dashboard", "Dashboard"], ["clientes", "Clientes"], ["ordens", "Ordens"], ["agenda", "Agenda"], ["relatorios", "Relatórios"]]
    : [["agenda", "Agenda"]];

  if (!user) return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">🧺</div>
            <div className="login-logo-title">Lavanderia</div>
            <div className="login-logo-sub">Sistema de Gestão</div>
          </div>
          <FormGroup label="E-mail" required>
            <input className="form-input" type="email" placeholder="seu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          </FormGroup>
          <FormGroup label="Senha" required>
            <input className="form-input" type="password" placeholder="••••••••" value={loginSenha} onChange={e => setLoginSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
          </FormGroup>
          {loginErro && <p style={{ color: "#b83232", fontSize: 13, marginBottom: 10 }}>{loginErro}</p>}
          <button className="btn-primary" style={{ width: "100%", padding: "10px 0", fontSize: 15 }} onClick={login}>Entrar</button>
          <div className="demo-box">
            <strong>Demonstração</strong><br />
            Admin: admin@lavanderia.com / admin123<br />
            Func: joao@lavanderia.com / func123
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* TOPBAR desktop */}
        <div className="topbar">
          <div className="topbar-brand"><span>🧺</span> Lavanderia</div>
          <div className="topbar-nav">
            {abas.map(([id, label]) => (
              <button key={id} className={`nav-btn${aba === id ? " active" : ""}`} onClick={() => setAba(id)}>{label}</button>
            ))}
          </div>
          <div className="topbar-right">
            <span className="user-chip">{user.nome}</span>
            <button className="btn-opcoes" title="Opções" onClick={() => setModal("opcoes")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* BOTTOM NAV mobile */}
        <div className="bottom-nav">
          <div className="bottom-nav-inner">
            {abas.map(([id, label]) => (
              <button key={id} className={`bnav-btn${aba === id ? " active" : ""}`} onClick={() => setAba(id)}>
                <NavIcon id={id} />
                <span>{label}</span>
                {aba === id && <div className="bnav-dot" />}
              </button>
            ))}
            <button className="bnav-btn" onClick={() => setModal("opcoes")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Opções</span>
            </button>
          </div>
        </div>

        <div className="page">

          {/* DASHBOARD */}
          {aba === "dashboard" && (<>
            <div className="page-header">
              <h1 className="page-title">Visão geral</h1>
              <input
                type="month"
                className="form-input"
                style={{ width: "auto", fontSize: 13, padding: "4px 10px" }}
                value={dashMes}
                onChange={e => { setDashMes(e.target.value); setDashFiltroStatus(null); }}
              />
            </div>
            <div className="stat-grid">
              <div
                className="stat-card blue clickable"
                style={dashFiltroStatus === "agendada" ? { outline: "2px solid #1a6fbb", outlineOffset: "0" } : {}}
                onClick={() => setDashFiltroStatus(p => p === "agendada" ? null : "agendada")}
              >
                <div className="stat-label">Agendadas</div>
                <div className="stat-sublabel">{fmtMes(dashMes)}</div>
                <div className="stat-value">{kpiDash.agendadas}</div>
              </div>
              <div
                className="stat-card orange clickable"
                style={dashFiltroStatus === "agendamento_pago" ? { outline: "2px solid #b85e1a", outlineOffset: "0" } : {}}
                onClick={() => setDashFiltroStatus(p => p === "agendamento_pago" ? null : "agendamento_pago")}
              >
                <div className="stat-label">Pendente de Execução</div>
                <div className="stat-sublabel">Agendamento Pago</div>
                <div className="stat-value">{kpiDash.pendenteExecucao}</div>
              </div>
              <div
                className="stat-card purple clickable"
                style={dashFiltroStatus === "realizada" ? { outline: "2px solid #5b3fa6", outlineOffset: "0" } : {}}
                onClick={() => setDashFiltroStatus(p => p === "realizada" ? null : "realizada")}
              >
                <div className="stat-label">Pendente de Pagamento</div>
                <div className="stat-sublabel">Executado, não pago</div>
                <div className="stat-value">{kpiDash.pendentePagamento}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">Faturamento Total</div>
                <div className="stat-sublabel">{fmtMes(dashMes)}</div>
                <div className="stat-value" style={{ fontSize: 20 }}>R$ {kpiDash.faturamento.toFixed(2).replace(".", ",")}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>
                {dashFiltroStatus === "agendada" && `Agendadas — ${fmtMes(dashMes)}`}
                {dashFiltroStatus === "agendamento_pago" && `Pendente de Execução — ${fmtMes(dashMes)}`}
                {dashFiltroStatus === "realizada" && `Pendente de Pagamento — ${fmtMes(dashMes)}`}
                {!dashFiltroStatus && `Recentes — ${fmtMes(dashMes)}`}
              </span>
              {dashFiltroStatus && (
                <button className="btn-sm" onClick={() => setDashFiltroStatus(null)}>Limpar filtro</button>
              )}
            </div>
            {/* desktop table */}
            <div className="card table-desktop">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>#OS</th><th>Cliente</th><th>Data / Hora</th><th>Funcionário</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {ordensDashboard.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0" }}>Nenhuma ordem encontrada.</td></tr>
                    )}
                    {ordensDashboard.map(o => {
                      const cli = clientes.find(c => c.id === o.clienteId);
                      const func = usuarios.find(u => u.id === o.funcionarioId);
                      return (
                        <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>
                          <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#5b3fa6" }}>#{o.numero}</td>
                          <td><strong>{cli?.nome} {cli?.sobrenome}</strong></td>
                          <td style={{ color: "#6b7280" }}>{fmtData(o.data)} · {o.hora}</td>
                          <td>{func?.nome}</td>
                          <td><strong>R$ {totalOrdem(o).toFixed(2)}</strong></td>
                          <td><Badge status={o.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* mobile cards */}
            <div className="mobile-list">
              {ordensDashboard.length === 0 && <p className="empty">Nenhuma ordem encontrada.</p>}
              {ordensDashboard.map(o => {
                const cli = clientes.find(c => c.id === o.clienteId);
                const func = usuarios.find(u => u.id === o.funcionarioId);
                return (
                  <div key={o.id} className="m-card" style={{ cursor: "pointer" }} onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>
                    <div className="m-card-row">
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#5b3fa6", fontFamily: "monospace", letterSpacing: ".5px" }}>OS #{o.numero}</span>
                        <div className="m-card-title" style={{ marginTop: 2 }}>{cli?.nome} {cli?.sobrenome}</div>
                      </div>
                      <strong>R$ {totalOrdem(o).toFixed(2)}</strong>
                    </div>
                    <div className="m-card-sub">{fmtData(o.data)} · {o.hora} · {func?.nome}</div>
                    <div style={{ marginTop: 8 }}><Badge status={o.status} /></div>
                  </div>
                );
              })}
            </div>
          </>)}

          {/* FUNCIONÁRIOS */}
          {aba === "funcionarios" && (<>
            <div className="page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="btn-sm" onClick={() => setAba("dashboard")}>← Voltar</button>
                <h1 className="page-title">Usuários do sistema</h1>
              </div>
              <button className="btn-primary" onClick={() => openModal("novoUsuario")}>+ Novo usuário</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {usuarios.map(u => (
                <div key={u.id} className="m-card" style={{ cursor: "pointer", opacity: u.ativo ? 1 : .55 }} onClick={() => { setUsuarioDetalhe(u); openModal("detalheUsuario"); }}>
                  <div className="m-card-row">
                    <div className="m-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {u.nome}
                      {!u.ativo && <span className="badge" style={{ background: "#fdeaea", color: "#b83232", fontSize: 11 }}>Inativo</span>}
                    </div>
                    <span className="badge" style={{ background: u.perfil === "admin" ? "#eeebfb" : "#e8f3fc", color: u.perfil === "admin" ? "#5b3fa6" : "#1a6fbb" }}>
                      {u.perfil === "admin" ? "Admin" : "Funcionário"}
                    </span>
                  </div>
                  <div className="m-card-sub">{u.email}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* CLIENTES */}
          {aba === "clientes" && (() => {
            const clientesOrdenados = [...clientes].sort((a, b) => b.id - a.id);
            const clientesFiltrados = clientesOrdenados.filter(c =>
              `${c.nome} ${c.sobrenome}`.toLowerCase().includes(filtroBuscaCliente.toLowerCase())
            );
            const totalAtivos = clientes.filter(c => c.ativo).length;
            return (<>
              <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <h1 className="page-title">Clientes</h1>
                  <span className="badge" style={{ background: "#e6f4ec", color: "#1f7a3e", fontSize: 13, fontWeight: 600 }}>
                    {totalAtivos} ativo{totalAtivos !== 1 ? "s" : ""}
                  </span>
                </div>
                <button className="btn-primary" onClick={() => openModal("cliente")}>+ Novo cliente</button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="🔍  Buscar por nome do cliente..."
                  value={filtroBuscaCliente}
                  onChange={e => setFiltroBuscaCliente(e.target.value)}
                  style={{ maxWidth: 360 }}
                />
              </div>
              <div className="card table-desktop">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Cidade</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {clientesFiltrados.length === 0 && (
                        <tr><td colSpan={6} className="empty">Nenhum cliente encontrado.</td></tr>
                      )}
                      {clientesFiltrados.map(c => (
                        <tr key={c.id} style={{ opacity: c.ativo ? 1 : .5, cursor: "pointer" }} onClick={() => { setHistoricoClienteId(c.id); openModal("historicoCliente"); }}>
                          <td><strong>{c.nome} {c.sobrenome}</strong></td>
                          <td style={{ color: "#6b7280", fontFamily: "monospace" }}>{c.cpf}</td>
                          <td>{c.telefone}</td>
                          <td>{c.cidade} / {c.estado}</td>
                          <td><span className="badge" style={{ background: c.ativo ? "#e6f4ec" : "#fdeaea", color: c.ativo ? "#1f7a3e" : "#b83232" }}>{c.ativo ? "Ativo" : "Inativo"}</span></td>
                          <td style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                            {c.ativo && <button className="btn-sm btn-edit" onClick={() => abrirEdicaoCliente(c)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>Editar</button>}
                            {c.ativo && <button className="btn-sm btn-danger" onClick={() => confirmar("inativarCliente", c.id, "Ao inativar este cliente, todas suas ordens serão mantidas no histórico. Deseja continuar?")}>Inativar</button>}
                            {!c.ativo && <button className="btn-sm btn-advance" onClick={() => reativarCliente(c.id)}>Reativar</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mobile-list">
                {clientesFiltrados.length === 0 && <p className="empty">Nenhum cliente encontrado.</p>}
                {clientesFiltrados.map(c => (
                  <div key={c.id} className="m-card" style={{ opacity: c.ativo ? 1 : .5, cursor: "pointer" }} onClick={() => { setHistoricoClienteId(c.id); openModal("historicoCliente"); }}>
                    <div className="m-card-row">
                      <div className="m-card-title">{c.nome} {c.sobrenome}</div>
                      <span className="badge" style={{ background: c.ativo ? "#e6f4ec" : "#fdeaea", color: c.ativo ? "#1f7a3e" : "#b83232" }}>{c.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="m-card-sub">{c.cpf}</div>
                    <div className="m-card-sub">{c.telefone} · {c.cidade}/{c.estado}</div>
                    <div className="m-card-actions" onClick={e => e.stopPropagation()}>
                      {c.ativo && <button className="btn-sm btn-edit" onClick={() => abrirEdicaoCliente(c)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>Editar</button>}
                      {c.ativo && <button className="btn-sm btn-danger" onClick={() => confirmar("inativarCliente", c.id, "Ao inativar este cliente, todas suas ordens serão mantidas no histórico. Deseja continuar?")}>Inativar</button>}
                      {!c.ativo && <button className="btn-sm btn-advance" onClick={() => reativarCliente(c.id)}>Reativar</button>}
                    </div>
                  </div>
                ))}
              </div>
            </>);
          })()}

          {/* ORDENS */}
          {aba === "ordens" && (() => {
            const ordensFiltradas = ordens.filter(o => {
              const cli = clientes.find(c => c.id === o.clienteId);
              const nomeCliente = `${cli?.nome || ""} ${cli?.sobrenome || ""}`.toLowerCase();
              if (filtroOrdemCliente && !nomeCliente.includes(filtroOrdemCliente.toLowerCase())) return false;
              if (filtroOrdemInicio && o.data < filtroOrdemInicio) return false;
              if (filtroOrdemFim && o.data > filtroOrdemFim) return false;
              return true;
            }).sort((a, b) => b.numero - a.numero);
            const temFiltro = filtroOrdemCliente || filtroOrdemInicio || filtroOrdemFim;
            return (<>
              <div className="page-header">
                <h1 className="page-title">Ordens de serviço</h1>
                <button className="btn-primary" onClick={() => openModal("ordem")}>+ Nova ordem</button>
              </div>
              {/* Filtros */}
              <div className="ordens-filtros">
                <div className="ordens-filtro-nome">
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Buscar cliente</div>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="🔍  Nome do cliente..."
                    value={filtroOrdemCliente}
                    onChange={e => setFiltroOrdemCliente(e.target.value)}
                  />
                </div>
                <div className="ordens-filtro-datas">
                  <div style={{ flex: "0 1 160px", minWidth: 130 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Data início</div>
                    <input
                      className="form-input"
                      type="date"
                      value={filtroOrdemInicio}
                      onChange={e => setFiltroOrdemInicio(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: "0 1 160px", minWidth: 130 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Data fim</div>
                    <input
                      className="form-input"
                      type="date"
                      value={filtroOrdemFim}
                      onChange={e => setFiltroOrdemFim(e.target.value)}
                    />
                  </div>
                  {temFiltro && (
                    <button className="btn-sm" style={{ alignSelf: "flex-end", marginBottom: 1 }} onClick={() => { setFiltroOrdemCliente(""); setFiltroOrdemInicio(""); setFiltroOrdemFim(""); }}>
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
              <div className="card table-desktop">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>OS #</th><th>Cliente</th><th>Data / Hora</th><th>Funcionário</th><th>Serviços</th><th>Total</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {ordensFiltradas.length === 0 && (
                        <tr><td colSpan={8} className="empty">Nenhuma ordem encontrada.</td></tr>
                      )}
                      {ordensFiltradas.map(o => {
                        const cli = clientes.find(c => c.id === o.clienteId);
                        const func = usuarios.find(u => u.id === o.funcionarioId);
                        return (
                          <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>
                            <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#5b3fa6" }}>#{o.numero}</td>
                            <td><strong>{cli?.nome} {cli?.sobrenome}</strong></td>
                            <td style={{ color: "#6b7280" }}>{fmtData(o.data)} · {o.hora}</td>
                            <td>{func?.nome}</td>
                            <td style={{ color: "#6b7280", fontSize: 13 }}>{o.servicos.map(s => s.nome).join(", ")}</td>
                            <td><strong>R$ {totalOrdem(o).toFixed(2)}</strong></td>
                            <td><Badge status={o.status} /></td>
                            <td style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                              {o.status !== "cancelada" ? <>
                                <button className="btn-sm" disabled style={{ background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e", opacity: 1, cursor: "default" }}>Agendado</button>
                                <button className="btn-sm" style={["realizada", "paga"].includes(o.status) ? { background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e" } : {}} onClick={() => abrirConfirmarStatus(o.id, "realizada")}>Realizado</button>
                                <button className="btn-sm" style={["agendamento_pago", "paga"].includes(o.status) ? { background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e" } : {}} onClick={() => abrirConfirmarStatus(o.id, "paga")}>Pago</button>
                              </> : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mobile-list">
                {ordensFiltradas.length === 0 && <p className="empty">Nenhuma ordem encontrada.</p>}
                {ordensFiltradas.map(o => {
                  const cli = clientes.find(c => c.id === o.clienteId);
                  const func = usuarios.find(u => u.id === o.funcionarioId);
                  return (
                    <div key={o.id} className="m-card" style={{ cursor: "pointer" }} onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>
                      <div className="m-card-row">
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#5b3fa6", fontFamily: "monospace", letterSpacing: ".5px" }}>OS #{o.numero}</span>
                          <div className="m-card-title" style={{ marginTop: 2 }}>{cli?.nome} {cli?.sobrenome}</div>
                        </div>
                        <strong>R$ {totalOrdem(o).toFixed(2)}</strong>
                      </div>
                      <div className="m-card-sub">{fmtData(o.data)} · {o.hora} · {func?.nome}</div>
                      <div className="m-card-sub" style={{ fontSize: 12, color: "#9ca3af" }}>{o.servicos.map(s => s.nome).join(", ")}</div>
                      <div style={{ marginTop: 8 }}><Badge status={o.status} /></div>
                      <div className="m-card-actions" onClick={e => e.stopPropagation()}>
                        {o.status !== "cancelada" ? <>
                          <button className="btn-sm" disabled style={{ background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e", opacity: 1, cursor: "default" }}>Agendado</button>
                          <button className="btn-sm" style={["realizada", "paga"].includes(o.status) ? { background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e" } : {}} onClick={() => abrirConfirmarStatus(o.id, "realizada")}>Realizado</button>
                          <button className="btn-sm" style={["agendamento_pago", "paga"].includes(o.status) ? { background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e" } : {}} onClick={() => abrirConfirmarStatus(o.id, "paga")}>Pago</button>
                        </> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>);
          })()}

          {/* AGENDA */}
          {aba === "agenda" && (<>
            <div className="page-header" style={{ marginBottom: 14 }}>
              <h1 className="page-title">Agenda</h1>
            </div>
            <div className="agenda-filter-bar">
              {/* Espaçador esquerdo (balanceia o grid no desktop) */}
              <div className="agenda-filter-spacer" />
              {/* Centro: botões de status */}
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                {[
                  { key: "agendado", label: "Agendado", bgOff: "#e8f3fc", colorOff: "#1a6fbb", bgOn: "#1a6fbb", colorOn: "#fff", shadow: "0 2px 8px rgba(26,111,187,.30)" },
                  { key: "realizado", label: "Realizado", bgOff: "#e6f4ec", colorOff: "#1f7a3e", bgOn: "#1f7a3e", colorOn: "#fff", shadow: "0 2px 8px rgba(31,122,62,.30)" },
                  { key: "pago", label: "Pago", bgOff: "#eeebfb", colorOff: "#5b3fa6", bgOn: "#5b3fa6", colorOn: "#fff", shadow: "0 2px 8px rgba(91,63,166,.30)" },
                ].map(({ key, label, bgOff, colorOff, bgOn, colorOn, shadow }) => {
                  const ativo = filtroStatusAgenda === key;
                  return (
                    <button key={key} onClick={() => { setFiltroStatusAgenda(p => p === key ? null : key); setAgendaPagina(0); }} style={{ padding: "8px 28px", borderRadius: 99, border: `2px solid ${ativo ? bgOn : bgOff}`, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: ".3px", transition: "all .18s", background: ativo ? bgOn : bgOff, color: ativo ? colorOn : colorOff, boxShadow: ativo ? shadow : "none", transform: ativo ? "translateY(-1px)" : "none" }}>{label}</button>
                  );
                })}
              </div>
              {/* Direita: filtros de funcionário e data (só admin) */}
              {user.perfil === "admin" ? (
                <div className="agenda-filter-right">
                  <select className="form-select" style={{ width: "auto" }} value={filtroFunc} onChange={e => { setFiltroFunc(e.target.value); setAgendaPagina(0); }}>
                    <option value="">Todos os funcionários</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                  <input type="date" className="form-input" style={{ width: "auto" }} value={filtroData} onChange={e => { setFiltroData(e.target.value); setAgendaPagina(0); }} />
                </div>
              ) : <div />}
            </div>
            {(() => {
              const todas = ordensFiltradas().sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
              const pagSize = 10;
              const totalPags = Math.ceil(todas.length / pagSize);
              const paginadas = todas.slice(agendaPagina * pagSize, (agendaPagina + 1) * pagSize);
              const grupos = {};
              paginadas.forEach(o => { if (!grupos[o.data]) grupos[o.data] = []; grupos[o.data].push(o); });
              return (<>
                {todas.length === 0 && <div className="empty">Nenhuma ordem encontrada.</div>}
                <div className="agenda-list">
                  {Object.entries(grupos).map(([data, ordensData]) => (
                    <React.Fragment key={data}>
                      <div className="agenda-day-sep">{fmtDataPorExtenso(data)}</div>
                      {ordensData.map(o => {
                        const cli = clientes.find(c => c.id === o.clienteId);
                        const func = usuarios.find(u => u.id === o.funcionarioId);
                        return (
                          <div key={o.id} className="agenda-card" onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>
                            <div className="agenda-card-top">
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#5b3fa6", fontFamily: "monospace", marginBottom: 4 }}>OS #{o.numero}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23", marginBottom: 6 }}><strong>Cliente: </strong>{cli?.nome} {cli?.sobrenome}</div>
                                <div style={{ fontSize: 13, lineHeight: 1.7, color: "#374151" }}>
                                  <div><strong>Data do Serviço: </strong>{fmtData(o.data)}</div>
                                  <div><strong>Hora: </strong>{o.hora}</div>
                                  <div><strong>Funcionário: </strong>{func?.nome}</div>
                                </div>
                                <div style={{ marginTop: 6 }}>
                                  {o.servicos.map((s, i) => (
                                    <div key={i} style={{ fontSize: 12, color: "#9ca3af" }}><strong style={{ color: "#9ca3af" }}>Serviço {i + 1}: </strong>{s.nome}</div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                  <div style={{ fontWeight: 700, fontSize: 16 }}>R$ {totalOrdem(o).toFixed(2)}</div>
                                  <Badge status={o.status} />
                                </div>
                                {user.perfil === "funcionario" && o.status !== "cancelada" && (
                                  <div onClick={e => e.stopPropagation()}>
                                    <button
                                      className="btn-sm"
                                      style={filtroStatusAgenda === "agendado"
                                        ? { background: "#1a6fbb", color: "#fff", borderColor: "#1a6fbb" }
                                        : { background: "#1f7a3e", color: "#fff", borderColor: "#1f7a3e" }}
                                      onClick={() => abrirConfirmarStatus(o.id, "realizada")}
                                    >
                                      Realizado
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                {totalPags > 1 && (
                  <div className="agenda-paginacao">
                    <button className="pag-btn" disabled={agendaPagina === 0} onClick={() => setAgendaPagina(p => p - 1)}>← Anterior</button>
                    <span className="pag-info">Página {agendaPagina + 1} de {totalPags}</span>
                    <button className="pag-btn" disabled={agendaPagina >= totalPags - 1} onClick={() => setAgendaPagina(p => p + 1)}>Próxima →</button>
                  </div>
                )}
              </>);
            })()}
          </>)}

          {/* RELATÓRIOS */}
          {aba === "relatorios" && (<>
            <div className="page-header"><h1 className="page-title">Relatórios</h1></div>
            <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>Filtros</div>
              <div className="rel-filter-grid">
                <FormGroup label="Mês início"><input type="month" className="form-input" value={relInicio} onChange={e => setRelInicio(e.target.value)} /></FormGroup>
                <FormGroup label="Mês fim"><input type="month" className="form-input" value={relFim} onChange={e => setRelFim(e.target.value)} /></FormGroup>
                <FormGroup label="Tipo de serviço">
                  <select className="form-select" value={relServico} onChange={e => setRelServico(e.target.value)}>
                    <option value="">Todos</option>
                    {servicos.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Funcionário">
                  <select className="form-select" value={relFunc} onChange={e => setRelFunc(e.target.value)}>
                    <option value="">Todos</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </FormGroup>
              </div>
              {(relServico || relFunc) && <button className="btn-sm" style={{ marginTop: 4 }} onClick={() => { setRelServico(""); setRelFunc(""); setRelInicio("2026-01"); setRelFim("2026-05"); }}>Limpar filtros</button>}
            </div>
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card green"><div className="stat-label">Faturamento</div><div className="stat-value">R$ {faturamentoTotal.toFixed(2)}</div></div>
              <div className="stat-card blue"><div className="stat-label">Ordens pagas</div><div className="stat-value">{ordensRelatorio.length}</div></div>
              <div className="stat-card purple"><div className="stat-label">Tipos serviço</div><div className="stat-value">{porServicoRel.length}</div></div>
            </div>
            <div className="rel-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="rel-card">
                <div className="section-sep" style={{ marginTop: 12 }}>Por serviço</div>
                {porServicoRel.length === 0 ? <div className="empty" style={{ padding: "20px 0" }}>Sem dados.</div>
                  : porServicoRel.map(([nome, val]) => (
                    <div key={nome} className="rel-row"><span style={{ color: "#374151" }}>{nome}</span><strong>R$ {val.toFixed(2)}</strong></div>
                  ))}
              </div>
              <div className="rel-card">
                <div className="section-sep" style={{ marginTop: 12 }}>Por mês</div>
                {porMesRel.length === 0 ? <div className="empty" style={{ padding: "20px 0" }}>Sem dados.</div>
                  : porMesRel.map(([mes, val]) => {
                    const max = Math.max(...porMesRel.map(([, v]) => v));
                    return (
                      <div key={mes} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: "#374151" }}>{fmtMes(mes)}</span>
                          <strong>R$ {val.toFixed(2)}</strong>
                        </div>
                        <div style={{ background: "#f0f2f5", borderRadius: 99, height: 6 }}>
                          <div style={{ width: `${max > 0 ? (val / max) * 100 : 0}%`, background: "#5b3fa6", borderRadius: 99, height: 6, transition: "width .3s" }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>)}
        </div>
      </div>

      {/* MODAL CLIENTE */}
      {modal === "cliente" && (
        <Modal title="Novo cliente" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarCliente}>Salvar cliente</button></>}>
          <div className="form-row cols2">
            <FInput label="Nome" required value={fCliente.nome} onChange={e => setFCliente(p => ({ ...p, nome: e.target.value }))} error={erros.nome} />
            <FInput label="Sobrenome" value={fCliente.sobrenome} onChange={e => setFCliente(p => ({ ...p, sobrenome: e.target.value }))} />
          </div>
          <div className="form-row cols2">
            <FInput label="CPF" required placeholder="000.000.000-00" value={fCliente.cpf} onChange={e => setFCliente(p => ({ ...p, cpf: fmtCPF(e.target.value) }))} error={erros.cpf} />
            <FInput label="Telefone" required placeholder="(65) 99999-0000" value={fCliente.telefone} onChange={e => setFCliente(p => ({ ...p, telefone: fmtTelefone(e.target.value) }))} error={erros.telefone} />
          </div>
          <FInput label="E-mail" type="email" placeholder="cliente@email.com" value={fCliente.email} onChange={e => setFCliente(p => ({ ...p, email: e.target.value }))} />
          <div className="section-sep">Endereço</div>
          <FInput label={<>CEP <span style={{ fontWeight: 400, fontSize: 11, color: "#9ca3af", letterSpacing: 0 }}>— Na versão final ao digitar o CEP puxa os dados de endereço</span></>} placeholder="00000-000" value={fCliente.cep} onChange={e => setFCliente(p => ({ ...p, cep: e.target.value }))} />
          <div className="form-row cols2">
            <FInput label="Rua" required value={fCliente.rua} onChange={e => setFCliente(p => ({ ...p, rua: e.target.value }))} error={erros.rua} />
            <FInput label="Número" required value={fCliente.numero} onChange={e => setFCliente(p => ({ ...p, numero: e.target.value }))} error={erros.numero} />
          </div>
          <FInput label="Complemento" placeholder="Apto 12, Bloco B, Casa dos fundos..." value={fCliente.complemento} onChange={e => setFCliente(p => ({ ...p, complemento: e.target.value }))} />
          <div className="form-row cols3">
            <FInput label="Bairro" required value={fCliente.bairro} onChange={e => setFCliente(p => ({ ...p, bairro: e.target.value }))} error={erros.bairro} />
            <FInput label="Cidade" required value={fCliente.cidade} onChange={e => setFCliente(p => ({ ...p, cidade: e.target.value }))} error={erros.cidade} />
            <FInput label="Estado" required placeholder="MT" value={fCliente.estado} onChange={e => setFCliente(p => ({ ...p, estado: e.target.value }))} error={erros.estado} />
          </div>
        </Modal>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {modal === "editarCliente" && (
        <Modal title="Editar cliente" onClose={closeModal} footer={<><button className="btn-cancel-red" onClick={closeModal}>Cancelar</button><button className="btn-success" onClick={salvarEdicaoCliente}>Salvar alterações</button></>}>
          <div className="form-row cols2-force">
            <FInput label="Nome" required value={fCliente.nome} onChange={e => setFCliente(p => ({ ...p, nome: e.target.value }))} error={erros.nome} />
            <FInput label="Sobrenome" value={fCliente.sobrenome} onChange={e => setFCliente(p => ({ ...p, sobrenome: e.target.value }))} />
          </div>
          <div className="form-row cols2-force">
            <FInput label="CPF" required placeholder="000.000.000-00" value={fCliente.cpf} onChange={e => setFCliente(p => ({ ...p, cpf: fmtCPF(e.target.value) }))} error={erros.cpf} />
            <FInput label="Telefone" required placeholder="(65) 99999-0000" value={fCliente.telefone} onChange={e => setFCliente(p => ({ ...p, telefone: fmtTelefone(e.target.value) }))} error={erros.telefone} />
          </div>
          <FInput label="E-mail" type="email" placeholder="cliente@email.com" value={fCliente.email} onChange={e => setFCliente(p => ({ ...p, email: e.target.value }))} />
          <div className="section-sep">Endereço</div>
          <FInput label={<>CEP <span style={{ fontWeight: 400, fontSize: 11, color: "#9ca3af", letterSpacing: 0 }}>— Na versão final ao digitar o CEP puxa os dados de endereço</span></>} placeholder="00000-000" value={fCliente.cep} onChange={e => setFCliente(p => ({ ...p, cep: e.target.value }))} />
          <div className="form-row cols2-force">
            <FInput label="Rua" required value={fCliente.rua} onChange={e => setFCliente(p => ({ ...p, rua: e.target.value }))} error={erros.rua} />
            <FInput label="Número" required value={fCliente.numero} onChange={e => setFCliente(p => ({ ...p, numero: e.target.value }))} error={erros.numero} />
          </div>
          <FInput label="Complemento" placeholder="Apto 12, Bloco B, Casa dos fundos..." value={fCliente.complemento} onChange={e => setFCliente(p => ({ ...p, complemento: e.target.value }))} />
          <div className="form-row cols3">
            <FInput label="Bairro" required value={fCliente.bairro} onChange={e => setFCliente(p => ({ ...p, bairro: e.target.value }))} error={erros.bairro} />
            <FInput label="Cidade" required value={fCliente.cidade} onChange={e => setFCliente(p => ({ ...p, cidade: e.target.value }))} error={erros.cidade} />
            <FInput label="Estado" required placeholder="MT" value={fCliente.estado} onChange={e => setFCliente(p => ({ ...p, estado: e.target.value }))} error={erros.estado} />
          </div>
        </Modal>
      )}



      {/* MODAL ORDEM */}
      {modal === "ordem" && (
        <Modal title="Nova ordem de serviço" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarOrdem}>Salvar ordem</button></>}>
          <div className="form-row cols2">
            <ClienteAutoComplete clienteId={fOrdem.clienteId} onSelect={id => setFOrdem(p => ({ ...p, clienteId: id }))} clientes={clientes} error={erros.clienteId} />
            <FSelect label="Funcionário" required error={erros.funcionarioId} value={fOrdem.funcionarioId} onChange={e => setFOrdem(p => ({ ...p, funcionarioId: e.target.value }))}>
              <option value="">Selecione...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </FSelect>
          </div>
          <div className="form-row cols2-force">
            <FInput label="Data" required type="date" value={fOrdem.data} onChange={e => setFOrdem(p => ({ ...p, data: e.target.value }))} error={erros.data} />
            <FInput label="Horário" required type="time" value={fOrdem.hora} min="08:00" max="18:00" onChange={e => setFOrdem(p => ({ ...p, hora: e.target.value }))} error={erros.hora} />
          </div>
          <div className="section-sep">Serviços</div>
          {fOrdem.servicos.map((sv, i) => (
            <div key={i} className="service-row">
              <div>
                <label className="svc-field-label">Serviço</label>
                <select className="form-select"
                  value={sv.servicoId || ""}
                  onChange={e => {
                    const pred = servicosAtivos.find(s => String(s.id) === e.target.value);
                    setOrdemSvcField(i, "servicoId", e.target.value);
                    if (pred) { setOrdemSvcField(i, "nome", pred.nome); setOrdemSvcField(i, "valor", ""); }
                    else { setOrdemSvcField(i, "nome", ""); setOrdemSvcField(i, "valor", ""); }
                  }}>
                  <option value="">Selecione um serviço...</option>
                  {servicosAtivos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="svc-field-label">Descrição do Objeto</label>
                <input className="form-input" placeholder="Ex: sofá cinza, tapete da sala..." value={sv.descricao || ""} onChange={e => setOrdemSvcField(i, "descricao", e.target.value)} />
              </div>
              <div className="service-row-bottom">
                <div>
                  <label className="svc-field-label">Quantidade</label>
                  <input className="form-input" type="number" min="1" placeholder="1" value={sv.qtd} onChange={e => setOrdemSvcField(i, "qtd", e.target.value)} />
                </div>
                <div>
                  <label className="svc-field-label">Valor (R$)</label>
                  <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0,00" value={sv.valor} onChange={e => setOrdemSvcField(i, "valor", e.target.value)} />
                </div>
                <button className="btn-rem" onClick={() => setFOrdem(p => ({ ...p, servicos: p.servicos.filter((_, j) => j !== i) }))}>×</button>
              </div>
            </div>
          ))}
          {erros.servicos && <p className="form-error" style={{ marginBottom: 8 }}>{erros.servicos}</p>}
          <button className="btn-add-svc" onClick={() => setFOrdem(p => ({ ...p, servicos: [...p.servicos, { servicoId: "", nome: "", qtd: 1, valor: "", descricao: "" }] }))}>+ Adicionar serviço</button>
          <div className="section-sep">Observações</div>
          <FormGroup label="Anotações sobre o serviço">
            <textarea className="form-input" rows="3" placeholder="Ex: Sofá com mancha no canto esquerdo, acesso pelo portão lateral, ligar 30min antes..." value={fOrdem.obs} onChange={e => setFOrdem(p => ({ ...p, obs: e.target.value }))} style={{ resize: "vertical", minHeight: 60 }} />
          </FormGroup>
          <div className="section-sep">Forma de Pagamento <span style={{ fontWeight: 400, fontSize: 11, color: "#9ca3af" }}>(opcional)</span></div>
          <div className="pagamento-options">
            {FORMAS_PAGAMENTO.map(f => (
              <button key={f} type="button" className={`pagamento-btn${fOrdem.formaPagamento === f ? " selected" : ""}`} onClick={() => setFOrdem(p => ({ ...p, formaPagamento: p.formaPagamento === f ? "" : f }))}>{f}</button>
            ))}
          </div>
        </Modal>
      )}

      {/* MODAL EDITAR ORDEM */}
      {modal === "editarOrdem" && (
        <Modal title="Editar ordem de serviço" onClose={closeModal} footer={<><button className="btn-cancel-red" onClick={closeModal}>Cancelar</button><button className="btn-success" onClick={salvarEdicaoOrdem}>Salvar edição</button></>}>
          <div className="form-row cols2">
            <ClienteAutoComplete clienteId={fOrdem.clienteId} onSelect={id => setFOrdem(p => ({ ...p, clienteId: id }))} clientes={clientes} error={erros.clienteId} />
            <FSelect label="Funcionário" required error={erros.funcionarioId} value={fOrdem.funcionarioId} onChange={e => setFOrdem(p => ({ ...p, funcionarioId: e.target.value }))}>
              <option value="">Selecione...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </FSelect>
          </div>
          <div className="form-row cols2-force">
            <FInput label="Data" required type="date" value={fOrdem.data} onChange={e => setFOrdem(p => ({ ...p, data: e.target.value }))} error={erros.data} />
            <FInput label="Horário" required type="time" value={fOrdem.hora} min="08:00" max="18:00" onChange={e => setFOrdem(p => ({ ...p, hora: e.target.value }))} error={erros.hora} />
          </div>
          <div className="section-sep">Serviços</div>
          {fOrdem.servicos.map((sv, i) => (
            <div key={i} className="service-row">
              <div>
                <label className="svc-field-label">Serviço</label>
                <select className="form-select"
                  value={sv.servicoId || ""}
                  onChange={e => {
                    const pred = servicosAtivos.find(s => String(s.id) === e.target.value);
                    setOrdemSvcField(i, "servicoId", e.target.value);
                    if (pred) { setOrdemSvcField(i, "nome", pred.nome); setOrdemSvcField(i, "valor", ""); }
                    else { setOrdemSvcField(i, "nome", ""); setOrdemSvcField(i, "valor", ""); }
                  }}>
                  <option value="">Selecione um serviço...</option>
                  {servicosAtivos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="svc-field-label">Descrição do Objeto</label>
                <input className="form-input" placeholder="Ex: sofá cinza, tapete da sala..." value={sv.descricao || ""} onChange={e => setOrdemSvcField(i, "descricao", e.target.value)} />
              </div>
              <div className="service-row-bottom">
                <div>
                  <label className="svc-field-label">Quantidade</label>
                  <input className="form-input" type="number" min="1" placeholder="1" value={sv.qtd} onChange={e => setOrdemSvcField(i, "qtd", e.target.value)} />
                </div>
                <div>
                  <label className="svc-field-label">Valor (R$)</label>
                  <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0,00" value={sv.valor} onChange={e => setOrdemSvcField(i, "valor", e.target.value)} />
                </div>
                <button className="btn-rem" onClick={() => setFOrdem(p => ({ ...p, servicos: p.servicos.filter((_, j) => j !== i) }))}>×</button>
              </div>
            </div>
          ))}
          {erros.servicos && <p className="form-error" style={{ marginBottom: 8 }}>{erros.servicos}</p>}
          <button className="btn-add-svc" onClick={() => setFOrdem(p => ({ ...p, servicos: [...p.servicos, { servicoId: "", nome: "", qtd: 1, valor: "", descricao: "" }] }))}>+ Adicionar serviço</button>
          <div className="section-sep">Observações</div>
          <FormGroup label="Anotações sobre o serviço">
            <textarea className="form-input" rows="3" placeholder="Ex: Sofá com mancha no canto esquerdo, acesso pelo portão lateral, ligar 30min antes..." value={fOrdem.obs} onChange={e => setFOrdem(p => ({ ...p, obs: e.target.value }))} style={{ resize: "vertical", minHeight: 60 }} />
          </FormGroup>
          <div className="section-sep">Forma de Pagamento <span style={{ fontWeight: 400, fontSize: 11, color: "#9ca3af" }}>(opcional)</span></div>
          <div className="pagamento-options">
            {FORMAS_PAGAMENTO.map(f => (
              <button key={f} type="button" className={`pagamento-btn${fOrdem.formaPagamento === f ? " selected" : ""}`} onClick={() => setFOrdem(p => ({ ...p, formaPagamento: p.formaPagamento === f ? "" : f }))}>{f}</button>
            ))}
          </div>
        </Modal>
      )}

      {/* MODAL DETALHE / EDIÇÃO */}
      {modal === "detalhe" && detalheOrdem && (() => {
        const o = ordens.find(x => x.id === detalheOrdem.id) || detalheOrdem;
        const cli = clientes.find(c => c.id === o.clienteId);
        const func = usuarios.find(u => u.id === o.funcionarioId);
        const footerView = (
          <>
            {o.status === "agendada" && (
              <button className="btn-cancel-red" style={{ marginRight: "auto" }} onClick={() => { confirmar("cancelarOrdem", o.id, `Tem certeza que deseja cancelar a OS #${o.numero}? Esta ação não pode ser desfeita.`); }}>
                Cancelar OS
              </button>
            )}
            {o.status === "cancelada" && (
              <button className="btn-advance btn-sm" style={{ marginRight: "auto" }} onClick={() => { reativarOrdem(o.id); closeModal(); }}>
                Reativar OS
              </button>
            )}
            {["agendada", "agendamento_pago"].includes(o.status) && (
              <button className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => entrarModoEdicaoDetalhe(o)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                Editar
              </button>
            )}
            <button className="btn-sm" onClick={closeModal}>Fechar</button>
          </>
        );
        const footerEdit = (
          <>
            <button className="btn-cancel-red" onClick={cancelarEdicaoDetalhe}>Cancelar Edição</button>
            <button className="btn-success" onClick={salvarEdicaoOrdem}>Salvar Edição</button>
          </>
        );
        return (
          <Modal
            title={detalheEditando ? `Editar OS #${o.numero}` : `Detalhes da OS #${o.numero}`}
            onClose={detalheEditando ? cancelarEdicaoDetalhe : closeModal}
            footer={detalheEditando ? footerEdit : footerView}
          >
            {!detalheEditando ? (
              <>
                <div className="detail-grid">
                  <div><div className="detail-label">Cliente</div><div className="detail-value">{cli?.nome} {cli?.sobrenome}</div></div>
                  <div><div className="detail-label">Telefone</div><div className="detail-value">{cli?.telefone}</div></div>
                  <div><div className="detail-label">Data / Hora</div><div className="detail-value">{fmtData(o.data)} às {o.hora}</div></div>
                  <div><div className="detail-label">Funcionário</div><div className="detail-value">{func?.nome}</div></div>
                  <div style={{ gridColumn: "1/-1" }}><div className="detail-label">Endereço</div><div className="detail-value">{o.endereco}</div><a className="btn-maps" href={mapsUrl(o.endereco, cli)} target="_blank" rel="noopener noreferrer"><MapsPinIcon />Ver no Google Maps</a></div>
                  <div><div className="detail-label">Status</div><div style={{ marginTop: 4 }}><Badge status={o.status} /></div></div>
                  {o.formaPagamento && <div><div className="detail-label">Forma de Pagamento</div><div className="detail-value">{o.formaPagamento}</div></div>}
                </div>
                {o.obs && <>
                  <div className="section-sep">Observações</div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #f0f2f5" }}>{o.obs}</p>
                </>}
                <div className="section-sep">Serviços</div>
                {o.servicos.map((s, i) => (
                  <div key={i} className="svc-list-row">
                    <div>
                      <div>{s.nome} <span style={{ color: "#9ca3af" }}>× {s.qtd}</span></div>
                      {s.descricao && <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 1 }}>{s.descricao}</div>}
                    </div>
                    <span style={{ flexShrink: 0, marginLeft: 12 }}>R$ {(s.qtd * s.valor).toFixed(2)}</span>
                  </div>
                ))}
                <div className="svc-total"><span>Total</span><span>R$ {totalOrdem(o).toFixed(2)}</span></div>
              </>
            ) : (
              <>
                <div className="form-row cols2">
                  <ClienteAutoComplete clienteId={fOrdem.clienteId} onSelect={id => setFOrdem(p => ({ ...p, clienteId: id }))} clientes={clientes} error={erros.clienteId} />
                  <FSelect label="Funcionário" required error={erros.funcionarioId} value={fOrdem.funcionarioId} onChange={e => setFOrdem(p => ({ ...p, funcionarioId: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </FSelect>
                </div>
                <div className="form-row cols2-force">
                  <FInput label="Data" required type="date" value={fOrdem.data} onChange={e => setFOrdem(p => ({ ...p, data: e.target.value }))} error={erros.data} />
                  <FInput label="Horário" required type="time" value={fOrdem.hora} min="08:00" max="18:00" onChange={e => setFOrdem(p => ({ ...p, hora: e.target.value }))} error={erros.hora} />
                </div>
                <div className="section-sep">Serviços</div>
                {fOrdem.servicos.map((sv, i) => (
                  <div key={i} className="service-row">
                    <div>
                      <label className="svc-field-label">Serviço</label>
                      <select className="form-select"
                        value={sv.servicoId || ""}
                        onChange={e => {
                          const pred = servicosAtivos.find(s => String(s.id) === e.target.value);
                          setOrdemSvcField(i, "servicoId", e.target.value);
                          if (pred) { setOrdemSvcField(i, "nome", pred.nome); setOrdemSvcField(i, "valor", ""); }
                          else { setOrdemSvcField(i, "nome", ""); setOrdemSvcField(i, "valor", ""); }
                        }}>
                        <option value="">Selecione um serviço...</option>
                        {servicosAtivos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="svc-field-label">Descrição do Objeto</label>
                      <input className="form-input" placeholder="Ex: sofá cinza, tapete da sala..." value={sv.descricao || ""} onChange={e => setOrdemSvcField(i, "descricao", e.target.value)} />
                    </div>
                    <div className="service-row-bottom">
                      <div>
                        <label className="svc-field-label">Quantidade</label>
                        <input className="form-input" type="number" min="1" placeholder="1" value={sv.qtd} onChange={e => setOrdemSvcField(i, "qtd", e.target.value)} />
                      </div>
                      <div>
                        <label className="svc-field-label">Valor (R$)</label>
                        <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0,00" value={sv.valor} onChange={e => setOrdemSvcField(i, "valor", e.target.value)} />
                      </div>
                      <button className="btn-rem" onClick={() => setFOrdem(p => ({ ...p, servicos: p.servicos.filter((_, j) => j !== i) }))}>×</button>
                    </div>
                  </div>
                ))}
                {erros.servicos && <p className="form-error" style={{ marginBottom: 8 }}>{erros.servicos}</p>}
                <button className="btn-add-svc" onClick={() => setFOrdem(p => ({ ...p, servicos: [...p.servicos, { servicoId: "", nome: "", qtd: 1, valor: "", descricao: "" }] }))}>+ Adicionar serviço</button>
                <div className="section-sep">Observações</div>
                <FormGroup label="Anotações sobre o serviço">
                  <textarea className="form-input" rows="3" placeholder="Ex: Sofá com mancha no canto esquerdo, acesso pelo portão lateral, ligar 30min antes..." value={fOrdem.obs} onChange={e => setFOrdem(p => ({ ...p, obs: e.target.value }))} style={{ resize: "vertical", minHeight: 60 }} />
                </FormGroup>
                <div className="section-sep">Forma de Pagamento <span style={{ fontWeight: 400, fontSize: 11, color: "#9ca3af" }}>(opcional)</span></div>
                <div className="pagamento-options">
                  {FORMAS_PAGAMENTO.map(f => (
                    <button key={f} type="button" className={`pagamento-btn${fOrdem.formaPagamento === f ? " selected" : ""}`} onClick={() => setFOrdem(p => ({ ...p, formaPagamento: p.formaPagamento === f ? "" : f }))}>{f}</button>
                  ))}
                </div>
              </>
            )}
          </Modal>
        );
      })()}

      {/* MODAL CONFIRMAÇÃO DE STATUS */}
      {modal === "confirmarAvanco" && ordemAvancando && (() => {
        const { id: avancId, targetStatus } = ordemAvancando;
        const o = ordens.find(x => x.id === avancId);
        if (!o) return null;
        const cli = clientes.find(c => c.id === o.clienteId);
        const func = usuarios.find(u => u.id === o.funcionarioId);
        const newStatus = calcularNovoStatus(o.status, targetStatus);
        const msgs = {
          "agendada>realizada": { titulo: "Marcar Serviço Realizado", msg: "Confirmar que o serviço desta OS foi realizado?", btn: "Marcar Realizado", cls: "btn-success" },
          "realizada>agendada": { titulo: "Desfazer Serviço Realizado", msg: "Desfazer 'Serviço Realizado'? A OS voltará para Agendada.", btn: "Sim, desfazer", cls: "btn-primary" },
          "agendamento_pago>paga": { titulo: "Marcar Serviço Realizado", msg: "O pagamento já foi recebido. Confirmar que o serviço foi realizado? A OS será finalizada.", btn: "Marcar Realizado", cls: "btn-success" },
          "paga>agendamento_pago": { titulo: "Desfazer Serviço Realizado", msg: "Desfazer 'Serviço Realizado'? A OS voltará para Agendamento Pago.", btn: "Sim, desfazer", cls: "btn-primary" },
          "agendada>agendamento_pago": { titulo: "Registrar Pagamento", msg: "Confirmar que o pagamento foi recebido? O serviço ainda não foi realizado.", btn: "Registrar Pagamento", cls: "btn-success" },
          "agendamento_pago>agendada": { titulo: "Desfazer Pagamento", msg: "Desfazer o recebimento do pagamento? A OS voltará para Agendada.", btn: "Sim, desfazer", cls: "btn-primary" },
          "realizada>paga": { titulo: "Registrar Pagamento", msg: "Confirmar que o pagamento desta OS foi recebido?", btn: "Registrar Pagamento", cls: "btn-success" },
          "paga>realizada": { titulo: "Desfazer Pagamento", msg: "Desfazer o recebimento do pagamento? A OS voltará para Serviço Realizado.", btn: "Sim, desfazer", cls: "btn-primary" },
        };
        const chave = `${o.status}>${newStatus}`;
        const isPaymentAction = ["agendada>agendamento_pago", "realizada>paga"].includes(chave);
        const { titulo, msg: msgAcao, btn: labelBtn, cls: btnClass } = msgs[chave] || { titulo: "Confirmar", msg: "", btn: "Confirmar", cls: "btn-success" };
        return (
          <Modal
            title={`OS #${o.numero} — ${titulo}`}
            onClose={closeModal}
            footer={<>
              <button className="btn-sm" onClick={closeModal}>Cancelar</button>
              <button className={btnClass} disabled={isPaymentAction && !confirmarFormaPagamento} style={isPaymentAction && !confirmarFormaPagamento ? { opacity: .45, cursor: "not-allowed" } : {}} onClick={() => { mudarStatus(avancId, newStatus, isPaymentAction ? confirmarFormaPagamento : null); closeModal(); }}>{labelBtn}</button>
            </>}
          >
            <p className="confirm-msg" style={{ marginBottom: 16 }}>{msgAcao}</p>
            <div className="detail-grid">
              <div><div className="detail-label">Cliente</div><div className="detail-value">{cli?.nome} {cli?.sobrenome}</div></div>
              <div><div className="detail-label">Telefone</div><div className="detail-value">{cli?.telefone}</div></div>
              <div><div className="detail-label">Data / Hora</div><div className="detail-value">{fmtData(o.data)} às {o.hora}</div></div>
              <div><div className="detail-label">Funcionário</div><div className="detail-value">{func?.nome}</div></div>
              <div style={{ gridColumn: "1/-1" }}><div className="detail-label">Endereço</div><div className="detail-value">{o.endereco}</div><a className="btn-maps" href={mapsUrl(o.endereco, cli)} target="_blank" rel="noopener noreferrer"><MapsPinIcon />Ver no Google Maps</a></div>
              <div><div className="detail-label">Status atual</div><div style={{ marginTop: 4 }}><Badge status={o.status} /></div></div>
            </div>
            {o.obs && <>
              <div className="section-sep">Observações</div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #f0f2f5" }}>{o.obs}</p>
            </>}
            <div className="section-sep">Serviços</div>
            {o.servicos.map((s, i) => (
              <div key={i} className="svc-list-row">
                <div>
                  <div>{s.nome} <span style={{ color: "#9ca3af" }}>× {s.qtd}</span></div>
                  {s.descricao && <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 1 }}>{s.descricao}</div>}
                </div>
                <span style={{ flexShrink: 0, marginLeft: 12 }}>R$ {(s.qtd * s.valor).toFixed(2)}</span>
              </div>
            ))}
            <div className="svc-total"><span>Total</span><span>R$ {totalOrdem(o).toFixed(2)}</span></div>
            {isPaymentAction && <>
              <div className="section-sep">
                Forma de Pagamento
                <span style={{ color: "#b83232", marginLeft: 4 }}>*</span>
                {!confirmarFormaPagamento && <span style={{ fontWeight: 400, fontSize: 11, color: "#b83232", marginLeft: 6 }}>obrigatório</span>}
              </div>
              <div className="pagamento-options">
                {FORMAS_PAGAMENTO.map(f => (
                  <button key={f} type="button" className={`pagamento-btn${confirmarFormaPagamento === f ? " selected" : ""}`} onClick={() => setConfirmarFormaPagamento(p => p === f ? "" : f)}>{f}</button>
                ))}
              </div>
            </>}
          </Modal>
        );
      })()}

      {/* MODAL NOVO USUÁRIO */}
      {modal === "novoUsuario" && (
        <Modal title="Novo usuário" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarNovoUsuario}>Cadastrar</button></>}>
          <div className="form-row cols2">
            <FormGroup label="Nome" required error={erros.uNome}>
              <input className="form-input" value={fNovoUsuario.nome} onChange={e => setFNovoUsuario(p => ({ ...p, nome: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Perfil" required>
              <select className="form-input" value={fNovoUsuario.perfil} onChange={e => setFNovoUsuario(p => ({ ...p, perfil: e.target.value }))}>
                <option value="funcionario">Funcionário</option>
                <option value="admin">Admin</option>
              </select>
            </FormGroup>
          </div>
          <FormGroup label="E-mail" required error={erros.uEmail}>
            <input className="form-input" type="email" value={fNovoUsuario.email} onChange={e => setFNovoUsuario(p => ({ ...p, email: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Senha" required error={erros.uSenha}>
            <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={fNovoUsuario.senha} onChange={e => setFNovoUsuario(p => ({ ...p, senha: e.target.value }))} />
          </FormGroup>
        </Modal>
      )}

      {/* MODAL OPÇÕES */}
      {modal === "opcoes" && (
        <Modal title="Opções" onClose={closeModal}>
          <div style={{ padding: "0 4px" }}>
            {user.perfil === "admin" && (
              <button className="opcoes-item" onClick={() => { setAba("funcionarios"); closeModal(); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Funcionários
              </button>
            )}
            <button className="opcoes-item" onClick={() => { setFResetSenha({ nova: "" }); setErros({}); setModal("resetSenhaPropria"); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              Reset de senha
            </button>
            <button className="opcoes-item opcoes-item-danger" onClick={() => setModal("confirmLogout")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sair
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL RESET SENHA PRÓPRIA */}
      {modal === "resetSenhaPropria" && (
        <Modal title="Redefinir minha senha" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarResetSenhaPropria}>Salvar nova senha</button></>}>
          <FormGroup label="Nova senha" required error={erros.resetNova}>
            <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={fResetSenha.nova} onChange={e => setFResetSenha({ nova: e.target.value })} />
          </FormGroup>
        </Modal>
      )}

      {/* MODAL DETALHE USUÁRIO */}
      {modal === "detalheUsuario" && usuarioDetalhe && (() => {
        const u = usuarios.find(x => x.id === usuarioDetalhe.id) || usuarioDetalhe;
        return (
          <Modal
            title={u.nome}
            onClose={closeModal}
            footer={<>
              {u.id !== user.id && (
                u.ativo
                  ? <button className="btn-cancel-red" style={{ marginRight: "auto" }} onClick={() => inativarUsuario(u.id)}>Inativar</button>
                  : <button className="btn-advance btn-sm" style={{ marginRight: "auto" }} onClick={() => reativarUsuario(u.id)}>Reativar</button>
              )}
              <button className="btn-sm btn-edit" onClick={() => { setFUsuario({ nome: u.nome, email: u.email }); setErros({}); setModal("editarUsuario"); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                Editar
              </button>
              <button className="btn-sm btn-advance" onClick={() => { setFResetSenha({ nova: "" }); setErros({}); setModal("resetarSenhaUsuario"); }}>Resetar Senha</button>
              <button className="btn-sm" onClick={closeModal}>Fechar</button>
            </>}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>Nome</span>
                <strong style={{ fontSize: 14 }}>{u.nome}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>E-mail</span>
                <span style={{ fontSize: 14 }}>{u.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>Perfil</span>
                <span className="badge" style={{ background: u.perfil === "admin" ? "#eeebfb" : "#e8f3fc", color: u.perfil === "admin" ? "#5b3fa6" : "#1a6fbb" }}>
                  {u.perfil === "admin" ? "Administrador" : "Funcionário"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>Status</span>
                <span className="badge" style={{ background: u.ativo ? "#e6f4ec" : "#fdeaea", color: u.ativo ? "#1f7a3e" : "#b83232" }}>{u.ativo ? "Ativo" : "Inativo"}</span>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL EDITAR USUÁRIO */}
      {modal === "editarUsuario" && usuarioDetalhe && (
        <Modal title="Editar usuário" onClose={() => { setModal("detalheUsuario"); setErros({}); }} footer={<>
          <button className="btn-sm" onClick={() => { setModal("detalheUsuario"); setErros({}); }}>Cancelar</button>
          <button className="btn-primary" onClick={salvarEdicaoUsuario}>Salvar alterações</button>
        </>}>
          <FormGroup label="Nome" required error={erros.uNome}>
            <input className="form-input" value={fUsuario.nome} onChange={e => setFUsuario(p => ({ ...p, nome: e.target.value }))} />
          </FormGroup>
          <FormGroup label="E-mail" required error={erros.uEmail}>
            <input className="form-input" type="email" value={fUsuario.email} onChange={e => setFUsuario(p => ({ ...p, email: e.target.value }))} />
          </FormGroup>
        </Modal>
      )}

      {/* MODAL RESETAR SENHA DE USUÁRIO */}
      {modal === "resetarSenhaUsuario" && usuarioDetalhe && (() => {
        const u = usuarios.find(x => x.id === usuarioDetalhe.id) || usuarioDetalhe;
        return (
          <Modal title={`Resetar senha — ${u.nome}`} onClose={() => { setModal("detalheUsuario"); setErros({}); setFResetSenha({ nova: "" }); }} footer={<>
            <button className="btn-sm" onClick={() => { setModal("detalheUsuario"); setErros({}); setFResetSenha({ nova: "" }); }}>Cancelar</button>
            <button className="btn-primary" onClick={salvarResetarSenhaUsuario}>Salvar nova senha</button>
          </>}>
            <FormGroup label="Nova senha" required error={erros.resetNova}>
              <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={fResetSenha.nova} onChange={e => setFResetSenha({ nova: e.target.value })} />
            </FormGroup>
          </Modal>
        );
      })()}

      {/* MODAL CONFIRMAÇÃO LOGOUT */}
      {modal === "confirmLogout" && (
        <Modal title="Sair do sistema" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" style={{ background: "#b83232" }} onClick={() => { setUser(null); closeModal(); }}>Sair</button></>}>
          <p className="confirm-msg">Deseja realmente sair do sistema?</p>
        </Modal>
      )}

      {/* MODAL HISTÓRICO DO CLIENTE */}
      {modal === "historicoCliente" && historicoClienteId && (() => {
        const cli = clientes.find(c => c.id === historicoClienteId);
        const historico = ordens
          .filter(o => o.clienteId === historicoClienteId)
          .sort((a, b) => b.data.localeCompare(a.data) || b.numero - a.numero);
        return (
          <Modal title={`Histórico — ${cli?.nome} ${cli?.sobrenome}`} onClose={closeModal} footer={<button className="btn-sm" onClick={closeModal}>Fechar</button>}>
            {historico.length === 0 ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Nenhuma ordem encontrada para este cliente.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {historico.map(o => (
                  <div key={o.id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#5b3fa6", fontSize: 13 }}>OS #{o.numero}</span>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>{fmtData(o.data)} · {o.hora}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge status={o.status} />
                        <strong style={{ fontSize: 14 }}>R$ {totalOrdem(o).toFixed(2).replace(".", ",")}</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#4b5563" }}>
                      {o.servicos.map((s, i) => (
                        <span key={i}>{s.nome} {s.qtd > 1 ? `(${s.qtd}x)` : ""}{i < o.servicos.length - 1 ? " · " : ""}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        );
      })()}

      {/* MODAL CONFIRMAÇÃO */}
      {modal === "confirm" && confirmData && (
        <Modal title="Confirmação" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Não, voltar</button><button className="btn-primary" style={{ background: "#b83232" }} onClick={executarConfirm}>Sim, confirmar</button></>}>
          <p className="confirm-msg">{confirmData.msg}</p>
        </Modal>
      )}
    </>
  );
}