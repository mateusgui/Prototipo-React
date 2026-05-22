import React, { useState, useMemo } from "react";

const USERS = [
  { id: 1, email: "admin@lavanderia.com", senha: "admin123", nome: "Admin", perfil: "admin" },
  { id: 2, email: "joao@lavanderia.com", senha: "func123", nome: "João Silva", perfil: "funcionario" },
  { id: 3, email: "maria@lavanderia.com", senha: "func123", nome: "Maria Souza", perfil: "funcionario" },
];

const STATUS_CONFIG = {
  agendada:  { label: "Agendada",           color: "#1a6fbb", bg: "#e8f3fc" },
  realizada: { label: "Serviço Realizado",  color: "#1f7a3e", bg: "#e6f4ec" },
  paga:      { label: "Pagamento Recebido", color: "#5b3fa6", bg: "#eeebfb" },
  cancelada: { label: "Cancelada",          color: "#b83232", bg: "#fdeaea" },
};

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

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;color:#1a1d23}
.app{min-height:100vh;background:#f4f6f9}
.topbar{background:#fff;border-bottom:1px solid #e2e5ea;padding:0 28px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.topbar-brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px;color:#1a1d23}
.topbar-nav{display:flex;gap:2px}
.nav-btn{background:none;border:none;cursor:pointer;padding:6px 14px;border-radius:6px;font-size:14px;color:#6b7280;transition:all .15s}
.nav-btn:hover{background:#f4f6f9;color:#1a1d23}
.nav-btn.active{background:#eeebfb;color:#5b3fa6;font-weight:500}
.topbar-right{display:flex;align-items:center;gap:10px}
.user-chip{font-size:13px;color:#6b7280;background:#f4f6f9;padding:4px 10px;border-radius:99px;border:1px solid #e2e5ea}
.btn-logout{background:none;border:1px solid #e2e5ea;cursor:pointer;padding:5px 12px;border-radius:6px;font-size:13px;color:#6b7280}
.btn-logout:hover{border-color:#c0c8d4;color:#1a1d23}
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
.card{background:#fff;border-radius:12px;border:1px solid #e2e5ea;overflow:hidden}
.table{width:100%;border-collapse:collapse;font-size:14px}
.table th{text-align:left;padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;background:#f9fafb;border-bottom:1px solid #e2e5ea}
.table td{padding:13px 16px;border-bottom:1px solid #f0f2f5;color:#374151;vertical-align:middle}
.table tr:last-child td{border-bottom:none}
.table tr:hover td{background:#fafbfc}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:500}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border:1px solid #e2e5ea;border-radius:12px;padding:20px 22px}
.stat-label{font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.stat-value{font-size:26px;font-weight:700;color:#1a1d23}
.stat-card.purple .stat-value{color:#5b3fa6}
.stat-card.green .stat-value{color:#1f7a3e}
.stat-card.blue .stat-value{color:#1a6fbb}
.agenda-card{background:#fff;border:1px solid #e2e5ea;border-radius:12px;padding:16px 20px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all .15s}
.agenda-card:hover{border-color:#c0c8d4;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.agenda-card-name{font-size:15px;font-weight:600;color:#1a1d23;margin-bottom:3px}
.agenda-card-sub{font-size:13px;color:#6b7280}
.filter-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end}
.filter-group{display:flex;flex-direction:column;gap:4px}
.filter-label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.4px}
.filter-bar select,.filter-bar input{border:1px solid #e2e5ea;border-radius:8px;padding:7px 12px;font-size:13px;background:#fff;color:#374151;outline:none;height:36px}
.filter-bar select:focus,.filter-bar input:focus{border-color:#a78bda}
.modal-overlay{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#fff;border-radius:14px;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18)}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #e2e5ea;position:sticky;top:0;background:#fff;z-index:1}
.modal-title{font-size:16px;font-weight:600;color:#1a1d23}
.modal-close{background:none;border:none;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#6b7280;line-height:1}
.modal-close:hover{background:#f4f6f9;color:#1a1d23}
.modal-body{padding:24px}
.modal-footer{padding:16px 24px;border-top:1px solid #e2e5ea;display:flex;justify-content:flex-end;gap:10px;background:#f9fafb;border-radius:0 0 14px 14px}
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
.service-row{display:grid;grid-template-columns:1fr 68px 96px 32px;gap:8px;align-items:start;margin-bottom:8px}
.btn-add-svc{background:none;border:1px dashed #d1d5db;color:#6b7280;border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer;transition:all .15s;width:100%;margin-top:4px}
.btn-add-svc:hover{border-color:#a78bda;color:#5b3fa6;background:#f5f0ff}
.btn-rem{background:none;border:none;cursor:pointer;color:#b83232;font-size:18px;padding:8px 6px;border-radius:6px;line-height:1}
.btn-rem:hover{background:#fdeaea}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:18px}
.detail-label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
.detail-value{font-size:14px;color:#1a1d23;font-weight:500}
.svc-list-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f0f2f5;font-size:14px}
.svc-list-row:last-child{border-bottom:none}
.svc-total{display:flex;justify-content:space-between;padding:10px 0 0;font-weight:700;font-size:15px}
.confirm-msg{font-size:14px;color:#374151;line-height:1.6;margin-bottom:8px}
.login-wrap{min-height:100vh;background:#f4f6f9;display:flex;align-items:center;justify-content:center}
.login-card{background:#fff;border-radius:16px;border:1px solid #e2e5ea;padding:36px 36px 28px;width:360px;box-shadow:0 4px 24px rgba(0,0,0,.07)}
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
.chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.chip{padding:5px 14px;border-radius:99px;font-size:13px;border:1px solid #e2e5ea;background:#fff;cursor:pointer;color:#6b7280;transition:all .15s}
.chip:hover{border-color:#a78bda;color:#5b3fa6}
.chip.active{background:#eeebfb;border-color:#a78bda;color:#5b3fa6;font-weight:500}
`;

function Badge({ status }) {
  const s = STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f4f6f9" };
  return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
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

  const [servicos, setServicos] = useState([
    { id: 1, nome: "Limpeza/Higienização de Sofá", valor: 250, ativo: true },
    { id: 2, nome: "Impermeabilização", valor: 300, ativo: true },
    { id: 3, nome: "Lavagem de Tapete", valor: 180, ativo: true },
  ]);

  const [clientes, setClientes] = useState([
    { id: 1, nome: "Ana", sobrenome: "Lima", cpf: "529.982.247-25", telefone: "(65) 99999-1111", rua: "Rua das Flores", numero: "10", bairro: "Centro", cidade: "Rondonópolis", estado: "MT", cep: "78700-000", ativo: true },
    { id: 2, nome: "Carlos", sobrenome: "Pereira", cpf: "871.688.760-60", telefone: "(65) 98888-2222", rua: "Av. Brasil", numero: "200", bairro: "Jardim", cidade: "Rondonópolis", estado: "MT", cep: "78710-000", ativo: true },
  ]);

  const [ordens, setOrdens] = useState([
    { id: 1, clienteId: 1, funcionarioId: 2, data: "2026-05-28", hora: "09:00", status: "agendada", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 1, valor: 250 }], endereco: "Rua das Flores, 10 - Centro" },
    { id: 2, clienteId: 2, funcionarioId: 3, data: "2026-05-29", hora: "14:00", status: "realizada", servicos: [{ nome: "Impermeabilização", qtd: 2, valor: 300 }], endereco: "Av. Brasil, 200 - Jardim" },
    { id: 3, clienteId: 1, funcionarioId: 2, data: "2026-05-25", hora: "10:00", status: "paga", servicos: [{ nome: "Lavagem de Tapete", qtd: 3, valor: 180 }], endereco: "Rua das Flores, 10 - Centro" },
    { id: 4, clienteId: 2, funcionarioId: 3, data: "2026-04-15", hora: "11:00", status: "paga", servicos: [{ nome: "Impermeabilização", qtd: 1, valor: 300 }, { nome: "Lavagem de Tapete", qtd: 2, valor: 180 }], endereco: "Av. Brasil, 200 - Jardim" },
    { id: 5, clienteId: 1, funcionarioId: 2, data: "2026-03-10", hora: "14:00", status: "paga", servicos: [{ nome: "Limpeza/Higienização de Sofá", qtd: 2, valor: 250 }], endereco: "Rua das Flores, 10 - Centro" },
  ]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [detalheOrdem, setDetalheOrdem] = useState(null);
  const [erros, setErros] = useState({});
  const [filtroFunc, setFiltroFunc] = useState("");
  const [filtroData, setFiltroData] = useState("");

  // relatório
  const [relInicio, setRelInicio] = useState("2026-01");
  const [relFim, setRelFim] = useState("2026-05");
  const [relServico, setRelServico] = useState("");
  const [relFunc, setRelFunc] = useState("");

  // serviços
  const [fServico, setFServico] = useState({ nome: "", valor: "" });
  const [editServico, setEditServico] = useState(null);

  const [fCliente, setFCliente] = useState({ nome: "", sobrenome: "", cpf: "", telefone: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" });
  const [fOrdem, setFOrdem] = useState({ clienteId: "", funcionarioId: "", data: "", hora: "", servicos: [{ servicoId: "", nome: "", qtd: 1, valor: "" }] });

  const funcionarios = USERS.filter(u => u.perfil === "funcionario");

  function login() {
    const u = USERS.find(u => u.email === loginEmail && u.senha === loginSenha);
    if (u) { setUser(u); setAba(u.perfil === "admin" ? "dashboard" : "agenda"); }
    else setLoginErro("E-mail ou senha inválidos.");
  }

  function totalOrdem(o) { return o.servicos.reduce((s, sv) => s + sv.qtd * Number(sv.valor), 0); }
  function openModal(tipo) { setModal(tipo); setErros({}); }
  function closeModal() { setModal(null); setErros({}); setEditServico(null); }

  // ---- salvar cliente ----
  function salvarCliente() {
    const e = {};
    if (!fCliente.nome) e.nome = "Obrigatório";
    if (!fCliente.sobrenome) e.sobrenome = "Obrigatório";
    if (!fCliente.cpf) e.cpf = "CPF é obrigatório";
    else if (!validarCPF(fCliente.cpf)) e.cpf = "CPF inválido. Verifique os dígitos.";
    else if (clientes.find(c => c.cpf === fCliente.cpf)) e.cpf = "Este CPF já está registrado.";
    if (!fCliente.telefone) e.telefone = "Obrigatório";
    if (!fCliente.rua) e.rua = "Obrigatório";
    if (!fCliente.numero) e.numero = "Obrigatório";
    if (!fCliente.bairro) e.bairro = "Obrigatório";
    if (!fCliente.cidade) e.cidade = "Obrigatório";
    if (!fCliente.estado) e.estado = "Obrigatório";
    if (!fCliente.cep) e.cep = "Obrigatório";
    if (Object.keys(e).length) { setErros(e); return; }
    setClientes(p => [...p, { ...fCliente, id: Date.now(), ativo: true }]);
    setFCliente({ nome: "", sobrenome: "", cpf: "", telefone: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" });
    closeModal();
  }

  // ---- salvar ordem ----
  function salvarOrdem() {
    const e = {};
    if (!fOrdem.clienteId) e.clienteId = "Obrigatório";
    if (!fOrdem.funcionarioId) e.funcionarioId = "Obrigatório";
    if (!fOrdem.data) e.data = "Obrigatório";
    else if (fOrdem.data <= "2026-05-22") e.data = "Escolha uma data futura.";
    if (!fOrdem.hora) e.hora = "Obrigatório";
    else if (fOrdem.hora < "08:00" || fOrdem.hora > "18:00") e.hora = "Entre 08:00 e 18:00";
    const svs = fOrdem.servicos.filter(s => s.nome && Number(s.valor) > 0);
    if (!svs.length) e.servicos = "Adicione pelo menos um serviço com valor.";
    if (Object.keys(e).length) { setErros(e); return; }
    const cli = clientes.find(c => c.id === parseInt(fOrdem.clienteId));
    setOrdens(p => [...p, {
      id: Date.now(), clienteId: parseInt(fOrdem.clienteId), funcionarioId: parseInt(fOrdem.funcionarioId),
      data: fOrdem.data, hora: fOrdem.hora, status: "agendada",
      servicos: svs.map(s => ({ nome: s.nome, qtd: parseInt(s.qtd) || 1, valor: parseFloat(s.valor) })),
      endereco: `${cli.rua}, ${cli.numero} - ${cli.bairro}`
    }]);
    setFOrdem({ clienteId: "", funcionarioId: "", data: "", hora: "", servicos: [{ servicoId: "", nome: "", qtd: 1, valor: "" }] });
    closeModal();
  }

  // ---- salvar serviço ----
  function salvarServico() {
    const e = {};
    if (!fServico.nome.trim()) e.nome = "Nome é obrigatório";
    if (!fServico.valor || Number(fServico.valor) <= 0) e.valor = "Valor deve ser maior que zero";
    if (Object.keys(e).length) { setErros(e); return; }
    if (editServico) {
      setServicos(p => p.map(s => s.id === editServico.id ? { ...s, nome: fServico.nome, valor: parseFloat(fServico.valor) } : s));
    } else {
      setServicos(p => [...p, { id: Date.now(), nome: fServico.nome, valor: parseFloat(fServico.valor), ativo: true }]);
    }
    setFServico({ nome: "", valor: "" });
    closeModal();
  }

  function abrirEditServico(sv) {
    setEditServico(sv);
    setFServico({ nome: sv.nome, valor: sv.valor });
    openModal("servico");
  }

  function avancarStatus(id) {
    const map = { agendada: "realizada", realizada: "paga" };
    setOrdens(p => p.map(o => o.id === id && map[o.status] ? { ...o, status: map[o.status] } : o));
  }

  function confirmar(tipo, id, msg) { setConfirmData({ tipo, id, msg }); setModal("confirm"); }

  function executarConfirm() {
    if (!confirmData) return;
    if (confirmData.tipo === "cancelarOrdem") setOrdens(p => p.map(o => o.id === confirmData.id ? { ...o, status: "cancelada" } : o));
    if (confirmData.tipo === "inativarCliente") setClientes(p => p.map(c => c.id === confirmData.id ? { ...c, ativo: false } : c));
    if (confirmData.tipo === "inativarServico") setServicos(p => p.map(s => s.id === confirmData.id ? { ...s, ativo: false } : s));
    closeModal();
  }

  function ordensFiltradas() {
    return ordens.filter(o => {
      if (user?.perfil === "funcionario" && o.funcionarioId !== user.id) return false;
      if (filtroFunc && o.funcionarioId !== parseInt(filtroFunc)) return false;
      if (filtroData && o.data !== filtroData) return false;
      return true;
    });
  }

  // ---- relatório ----
  const ordensRelatorio = useMemo(() => {
    return ordens.filter(o => {
      if (o.status !== "paga") return false;
      const mes = o.data.slice(0, 7);
      if (relInicio && mes < relInicio) return false;
      if (relFim && mes > relFim) return false;
      if (relFunc && o.funcionarioId !== parseInt(relFunc)) return false;
      if (relServico) {
        const tem = o.servicos.some(s => s.nome === relServico);
        if (!tem) return false;
      }
      return true;
    });
  }, [ordens, relInicio, relFim, relFunc, relServico]);

  const faturamentoTotal = useMemo(() => {
    if (!relServico) return ordensRelatorio.reduce((s, o) => s + totalOrdem(o), 0);
    return ordensRelatorio.reduce((s, o) => {
      return s + o.servicos.filter(sv => sv.nome === relServico).reduce((a, sv) => a + sv.qtd * sv.valor, 0);
    }, 0);
  }, [ordensRelatorio, relServico]);

  const porServicoRel = useMemo(() => {
    const map = {};
    ordensRelatorio.forEach(o =>
      o.servicos.forEach(s => {
        if (!relServico || s.nome === relServico)
          map[s.nome] = (map[s.nome] || 0) + s.qtd * s.valor;
      })
    );
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
  const pendentes = ordens.filter(o => ["agendada", "realizada"].includes(o.status)).length;

  const servicosAtivos = servicos.filter(s => s.ativo);

  function setOrdemSvcField(i, field, val) {
    setFOrdem(p => {
      const s = [...p.servicos];
      s[i] = { ...s[i], [field]: val };
      return { ...p, servicos: s };
    });
  }

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

  const abas = user.perfil === "admin"
    ? [["dashboard","Dashboard"],["clientes","Clientes"],["servicos","Serviços"],["ordens","Ordens"],["agenda","Agenda"],["relatorios","Relatórios"]]
    : [["agenda","Minha Agenda"]];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="topbar">
          <div className="topbar-brand"><span>🧺</span> Lavanderia</div>
          <div className="topbar-nav">
            {abas.map(([id, label]) => (
              <button key={id} className={`nav-btn${aba === id ? " active" : ""}`} onClick={() => setAba(id)}>{label}</button>
            ))}
          </div>
          <div className="topbar-right">
            <span className="user-chip">{user.nome}</span>
            <button className="btn-logout" onClick={() => setUser(null)}>Sair</button>
          </div>
        </div>

        <div className="page">

          {/* DASHBOARD */}
          {aba === "dashboard" && (
            <>
              <div className="page-header"><h1 className="page-title">Visão geral</h1></div>
              <div className="stat-grid">
                <div className="stat-card blue"><div className="stat-label">Ordens agendadas</div><div className="stat-value">{ordens.filter(o => o.status === "agendada").length}</div></div>
                <div className="stat-card"><div className="stat-label">Pendentes de pagamento</div><div className="stat-value">{pendentes}</div></div>
                <div className="stat-card green"><div className="stat-label">Faturamento total</div><div className="stat-value">R$ {totalFaturado.toFixed(2)}</div></div>
              </div>
              <div className="card">
                <table className="table">
                  <thead><tr><th>Cliente</th><th>Data / Hora</th><th>Funcionário</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {ordens.slice(0, 6).map(o => {
                      const cli = clientes.find(c => c.id === o.clienteId);
                      const func = USERS.find(u => u.id === o.funcionarioId);
                      return (
                        <tr key={o.id}>
                          <td><strong>{cli?.nome} {cli?.sobrenome}</strong></td>
                          <td style={{ color: "#6b7280" }}>{o.data} · {o.hora}</td>
                          <td>{func?.nome}</td>
                          <td><strong>R$ {totalOrdem(o).toFixed(2)}</strong></td>
                          <td><Badge status={o.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CLIENTES */}
          {aba === "clientes" && (
            <>
              <div className="page-header">
                <h1 className="page-title">Clientes</h1>
                <button className="btn-primary" onClick={() => openModal("cliente")}>+ Novo cliente</button>
              </div>
              <div className="card">
                <table className="table">
                  <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Cidade</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.id} style={{ opacity: c.ativo ? 1 : .5 }}>
                        <td><strong>{c.nome} {c.sobrenome}</strong></td>
                        <td style={{ color: "#6b7280", fontFamily: "monospace" }}>{c.cpf}</td>
                        <td>{c.telefone}</td>
                        <td>{c.cidade} / {c.estado}</td>
                        <td><span className="badge" style={{ background: c.ativo ? "#e6f4ec" : "#fdeaea", color: c.ativo ? "#1f7a3e" : "#b83232" }}>{c.ativo ? "Ativo" : "Inativo"}</span></td>
                        <td>{c.ativo && <button className="btn-sm btn-danger" onClick={() => confirmar("inativarCliente", c.id, "Ao inativar este cliente, todas suas ordens de serviço serão mantidas no histórico. Deseja continuar?")}>Inativar</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SERVIÇOS */}
          {aba === "servicos" && (
            <>
              <div className="page-header">
                <h1 className="page-title">Serviços</h1>
                <button className="btn-primary" onClick={() => { setFServico({ nome: "", valor: "" }); setEditServico(null); openModal("servico"); }}>+ Novo serviço</button>
              </div>
              <div className="card">
                <table className="table">
                  <thead><tr><th>Nome do serviço</th><th>Valor padrão</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {servicos.map(sv => (
                      <tr key={sv.id} style={{ opacity: sv.ativo ? 1 : .5 }}>
                        <td><strong>{sv.nome}</strong></td>
                        <td>R$ {Number(sv.valor).toFixed(2)}</td>
                        <td><span className="badge" style={{ background: sv.ativo ? "#e6f4ec" : "#fdeaea", color: sv.ativo ? "#1f7a3e" : "#b83232" }}>{sv.ativo ? "Ativo" : "Inativo"}</span></td>
                        <td style={{ display: "flex", gap: 8 }}>
                          {sv.ativo && <>
                            <button className="btn-sm" onClick={() => abrirEditServico(sv)}>Editar</button>
                            <button className="btn-sm btn-danger" onClick={() => confirmar("inativarServico", sv.id, `Deseja inativar o serviço "${sv.nome}"? Ele não aparecerá nas novas ordens.`)}>Inativar</button>
                          </>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ORDENS */}
          {aba === "ordens" && (
            <>
              <div className="page-header">
                <h1 className="page-title">Ordens de serviço</h1>
                <button className="btn-primary" onClick={() => openModal("ordem")}>+ Nova ordem</button>
              </div>
              <div className="card">
                <table className="table">
                  <thead><tr><th>Cliente</th><th>Data / Hora</th><th>Funcionário</th><th>Serviços</th><th>Total</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {ordens.map(o => {
                      const cli = clientes.find(c => c.id === o.clienteId);
                      const func = USERS.find(u => u.id === o.funcionarioId);
                      return (
                        <tr key={o.id}>
                          <td><strong>{cli?.nome} {cli?.sobrenome}</strong></td>
                          <td style={{ color: "#6b7280" }}>{o.data} · {o.hora}</td>
                          <td>{func?.nome}</td>
                          <td style={{ color: "#6b7280", fontSize: 13 }}>{o.servicos.map(s => s.nome).join(", ")}</td>
                          <td><strong>R$ {totalOrdem(o).toFixed(2)}</strong></td>
                          <td><Badge status={o.status} /></td>
                          <td style={{ display: "flex", gap: 6 }}>
                            <button className="btn-sm" onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>Ver</button>
                            {o.status === "agendada" && <button className="btn-sm btn-advance" onClick={() => avancarStatus(o.id)}>→ Realizado</button>}
                            {o.status === "realizada" && <button className="btn-sm btn-advance" onClick={() => avancarStatus(o.id)}>→ Pago</button>}
                            {o.status === "agendada" && <button className="btn-sm btn-danger" onClick={() => confirmar("cancelarOrdem", o.id, "Tem certeza que deseja cancelar esta ordem? Esta ação não pode ser desfeita.")}>Cancelar</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* AGENDA */}
          {aba === "agenda" && (
            <>
              <div className="page-header">
                <h1 className="page-title">Agenda</h1>
                {user.perfil === "admin" && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <select className="form-select" style={{ width: "auto" }} value={filtroFunc} onChange={e => setFiltroFunc(e.target.value)}>
                      <option value="">Todos os funcionários</option>
                      {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                    <input type="date" className="form-input" style={{ width: "auto" }} value={filtroData} onChange={e => setFiltroData(e.target.value)} />
                    {(filtroFunc || filtroData) && <button className="btn-sm" onClick={() => { setFiltroFunc(""); setFiltroData(""); }}>Limpar</button>}
                  </div>
                )}
              </div>
              {ordensFiltradas().length === 0 && <div className="empty">Nenhuma ordem encontrada.</div>}
              {ordensFiltradas().map(o => {
                const cli = clientes.find(c => c.id === o.clienteId);
                const func = USERS.find(u => u.id === o.funcionarioId);
                return (
                  <div key={o.id} className="agenda-card" onClick={() => { setDetalheOrdem(o); openModal("detalhe"); }}>
                    <div>
                      <div className="agenda-card-name">{cli?.nome} {cli?.sobrenome}</div>
                      <div className="agenda-card-sub">{o.data} às {o.hora} · {func?.nome}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{o.servicos.map(s => s.nome).join(", ")}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>R$ {totalOrdem(o).toFixed(2)}</div>
                      <Badge status={o.status} />
                      {user.perfil === "funcionario" && o.status === "agendada" && (
                        <div style={{ marginTop: 8 }}>
                          <button className="btn-sm btn-advance" onClick={e => { e.stopPropagation(); avancarStatus(o.id); }}>Marcar realizado</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* RELATÓRIOS */}
          {aba === "relatorios" && (
            <>
              <div className="page-header"><h1 className="page-title">Relatórios</h1></div>

              {/* Filtros */}
              <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>Filtros</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, alignItems: "end" }}>
                  <FormGroup label="Mês início">
                    <input type="month" className="form-input" value={relInicio} onChange={e => setRelInicio(e.target.value)} />
                  </FormGroup>
                  <FormGroup label="Mês fim">
                    <input type="month" className="form-input" value={relFim} onChange={e => setRelFim(e.target.value)} />
                  </FormGroup>
                  <FormGroup label="Tipo de serviço">
                    <select className="form-select" value={relServico} onChange={e => setRelServico(e.target.value)}>
                      <option value="">Todos os serviços</option>
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
                {(relServico || relFunc) && (
                  <div style={{ marginTop: 10 }}>
                    <button className="btn-sm" onClick={() => { setRelServico(""); setRelFunc(""); setRelInicio("2026-01"); setRelFim("2026-05"); }}>Limpar filtros</button>
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card green"><div className="stat-label">Faturamento do período</div><div className="stat-value">R$ {faturamentoTotal.toFixed(2)}</div></div>
                <div className="stat-card blue"><div className="stat-label">Ordens pagas</div><div className="stat-value">{ordensRelatorio.length}</div></div>
                <div className="stat-card purple"><div className="stat-label">Tipos de serviço</div><div className="stat-value">{porServicoRel.length}</div></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Por serviço */}
                <div className="rel-card">
                  <div className="section-sep" style={{ marginTop: 12 }}>Faturamento por serviço</div>
                  {porServicoRel.length === 0
                    ? <div className="empty" style={{ padding: "20px 0" }}>Sem dados para o período.</div>
                    : porServicoRel.map(([nome, val]) => (
                      <div key={nome} className="rel-row">
                        <span style={{ color: "#374151" }}>{nome}</span>
                        <strong>R$ {val.toFixed(2)}</strong>
                      </div>
                    ))
                  }
                </div>

                {/* Por mês */}
                <div className="rel-card">
                  <div className="section-sep" style={{ marginTop: 12 }}>Faturamento por mês</div>
                  {porMesRel.length === 0
                    ? <div className="empty" style={{ padding: "20px 0" }}>Sem dados para o período.</div>
                    : porMesRel.map(([mes, val]) => {
                      const max = Math.max(...porMesRel.map(([, v]) => v));
                      const pct = max > 0 ? (val / max) * 100 : 0;
                      return (
                        <div key={mes} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: "#374151" }}>{mes}</span>
                            <strong>R$ {val.toFixed(2)}</strong>
                          </div>
                          <div style={{ background: "#f0f2f5", borderRadius: 99, height: 6 }}>
                            <div style={{ width: `${pct}%`, background: "#5b3fa6", borderRadius: 99, height: 6, transition: "width .3s" }} />
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL CLIENTE */}
      {modal === "cliente" && (
        <Modal title="Novo cliente" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarCliente}>Salvar cliente</button></>}>
          <div className="form-row cols2">
            <FInput label="Nome" required value={fCliente.nome} onChange={e => setFCliente(p => ({ ...p, nome: e.target.value }))} error={erros.nome} />
            <FInput label="Sobrenome" required value={fCliente.sobrenome} onChange={e => setFCliente(p => ({ ...p, sobrenome: e.target.value }))} error={erros.sobrenome} />
          </div>
          <div className="form-row cols2">
            <FInput label="CPF" required placeholder="000.000.000-00" value={fCliente.cpf} onChange={e => setFCliente(p => ({ ...p, cpf: fmtCPF(e.target.value) }))} error={erros.cpf} />
            <FInput label="Telefone" required placeholder="(65) 99999-0000" value={fCliente.telefone} onChange={e => setFCliente(p => ({ ...p, telefone: e.target.value }))} error={erros.telefone} />
          </div>
          <div className="section-sep">Endereço</div>
          <div className="form-row cols2">
            <FInput label="Rua" required value={fCliente.rua} onChange={e => setFCliente(p => ({ ...p, rua: e.target.value }))} error={erros.rua} />
            <FInput label="Número" required value={fCliente.numero} onChange={e => setFCliente(p => ({ ...p, numero: e.target.value }))} error={erros.numero} />
          </div>
          <div className="form-row cols3">
            <FInput label="Bairro" required value={fCliente.bairro} onChange={e => setFCliente(p => ({ ...p, bairro: e.target.value }))} error={erros.bairro} />
            <FInput label="Cidade" required value={fCliente.cidade} onChange={e => setFCliente(p => ({ ...p, cidade: e.target.value }))} error={erros.cidade} />
            <FInput label="Estado" required placeholder="MT" value={fCliente.estado} onChange={e => setFCliente(p => ({ ...p, estado: e.target.value }))} error={erros.estado} />
          </div>
          <FInput label="CEP" required value={fCliente.cep} onChange={e => setFCliente(p => ({ ...p, cep: e.target.value }))} error={erros.cep} />
        </Modal>
      )}

      {/* MODAL SERVIÇO */}
      {modal === "servico" && (
        <Modal title={editServico ? "Editar serviço" : "Novo serviço"} onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarServico}>{editServico ? "Salvar alterações" : "Cadastrar serviço"}</button></>}>
          <FInput label="Nome do serviço" required placeholder="Ex: Limpeza de sofá 3 lugares" value={fServico.nome} onChange={e => setFServico(p => ({ ...p, nome: e.target.value }))} error={erros.nome} />
          <FInput label="Valor padrão (R$)" required type="number" min="0.01" step="0.01" placeholder="0,00" value={fServico.valor} onChange={e => setFServico(p => ({ ...p, valor: e.target.value }))} error={erros.valor} />
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: -8 }}>O valor padrão pode ser ajustado individualmente em cada ordem de serviço.</p>
        </Modal>
      )}

      {/* MODAL ORDEM */}
      {modal === "ordem" && (
        <Modal title="Nova ordem de serviço" onClose={closeModal} footer={<><button className="btn-sm" onClick={closeModal}>Cancelar</button><button className="btn-primary" onClick={salvarOrdem}>Salvar ordem</button></>}>
          <div className="form-row cols2">
            <FSelect label="Cliente" required error={erros.clienteId} value={fOrdem.clienteId} onChange={e => setFOrdem(p => ({ ...p, clienteId: e.target.value }))}>
              <option value="">Selecione...</option>
              {clientes.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome} {c.sobrenome}</option>)}
            </FSelect>
            <FSelect label="Funcionário responsável" required error={erros.funcionarioId} value={fOrdem.funcionarioId} onChange={e => setFOrdem(p => ({ ...p, funcionarioId: e.target.value }))}>
              <option value="">Selecione...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </FSelect>
          </div>
          <div className="form-row cols2">
            <FInput label="Data" required type="date" value={fOrdem.data} onChange={e => setFOrdem(p => ({ ...p, data: e.target.value }))} error={erros.data} />
            <FInput label="Horário" required type="time" value={fOrdem.hora} min="08:00" max="18:00" onChange={e => setFOrdem(p => ({ ...p, hora: e.target.value }))} error={erros.hora} />
          </div>
          <div className="section-sep">Serviços</div>
          {fOrdem.servicos.map((sv, i) => (
            <div key={i} className="service-row">
              <div>
                <select className="form-select" style={{ marginBottom: 6 }}
                  value={sv.servicoId || "__livre"}
                  onChange={e => {
                    const pred = servicosAtivos.find(s => String(s.id) === e.target.value);
                    setOrdemSvcField(i, "servicoId", e.target.value);
                    if (pred) {
                      setOrdemSvcField(i, "nome", pred.nome);
                      setOrdemSvcField(i, "valor", pred.valor);
                    } else {
                      setOrdemSvcField(i, "nome", "");
                      setOrdemSvcField(i, "valor", "");
                    }
                  }}>
                  <option value="__livre">Serviço personalizado...</option>
                  {servicosAtivos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
                {(!sv.servicoId || sv.servicoId === "__livre") && (
                  <input className="form-input" placeholder="Descreva o serviço" value={sv.nome}
                    onChange={e => setOrdemSvcField(i, "nome", e.target.value)} />
                )}
              </div>
              <input className="form-input" type="number" min="1" placeholder="Qtd" value={sv.qtd}
                onChange={e => setOrdemSvcField(i, "qtd", e.target.value)} />
              <input className="form-input" type="number" min="0.01" step="0.01" placeholder="R$ valor" value={sv.valor}
                onChange={e => setOrdemSvcField(i, "valor", e.target.value)} />
              <button className="btn-rem" onClick={() => setFOrdem(p => ({ ...p, servicos: p.servicos.filter((_, j) => j !== i) }))}>×</button>
            </div>
          ))}
          {erros.servicos && <p className="form-error" style={{ marginBottom: 8 }}>{erros.servicos}</p>}
          <button className="btn-add-svc" onClick={() => setFOrdem(p => ({ ...p, servicos: [...p.servicos, { servicoId: "", nome: "", qtd: 1, valor: "" }] }))}>+ Adicionar serviço</button>
        </Modal>
      )}

      {/* MODAL DETALHE */}
      {modal === "detalhe" && detalheOrdem && (() => {
        const o = ordens.find(x => x.id === detalheOrdem.id) || detalheOrdem;
        const cli = clientes.find(c => c.id === o.clienteId);
        const func = USERS.find(u => u.id === o.funcionarioId);
        return (
          <Modal title="Detalhes da ordem" onClose={closeModal} footer={<button className="btn-sm" onClick={closeModal}>Fechar</button>}>
            <div className="detail-grid">
              <div><div className="detail-label">Cliente</div><div className="detail-value">{cli?.nome} {cli?.sobrenome}</div></div>
              <div><div className="detail-label">Telefone</div><div className="detail-value">{cli?.telefone}</div></div>
              <div><div className="detail-label">Data / Hora</div><div className="detail-value">{o.data} às {o.hora}</div></div>
              <div><div className="detail-label">Funcionário</div><div className="detail-value">{func?.nome}</div></div>
              <div style={{ gridColumn: "1/-1" }}><div className="detail-label">Endereço</div><div className="detail-value">{o.endereco}</div></div>
              <div><div className="detail-label">Status</div><div style={{ marginTop: 4 }}><Badge status={o.status} /></div></div>
            </div>
            <div className="section-sep">Serviços</div>
            {o.servicos.map((s, i) => (
              <div key={i} className="svc-list-row">
                <span>{s.nome} <span style={{ color: "#9ca3af" }}>× {s.qtd}</span></span>
                <span>R$ {(s.qtd * s.valor).toFixed(2)}</span>
              </div>
            ))}
            <div className="svc-total"><span>Total</span><span>R$ {totalOrdem(o).toFixed(2)}</span></div>
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