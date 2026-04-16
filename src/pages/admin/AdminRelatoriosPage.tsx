import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Company, SubscriptionPlan } from '../../types';
import { DollarSign, BarChart3, Building2, FileText, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─── Helpers ─── */
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function today() {
  return format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}
function getDias(createdAt: string) {
  return differenceInDays(new Date(), new Date(createdAt));
}

const PLAN_LABEL: Record<string, string> = {
  BASIC: 'Básico', PRO: 'Profissional', ENTERPRISE: 'Empresarial',
};

/* ─── Print window helper ─── */
function printWindow(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { alert('Permita popups para gerar PDF'); return; }
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
    <meta charset="UTF-8"/>
    <title>${title}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:48px; color:#1e293b; font-size:13px; }
      h1 { font-size:24px; color:#1e3aaa; font-weight:700; margin-bottom:4px; }
      .subtitle { color:#64748b; font-size:13px; margin-bottom:8px; }
      .date { color:#94a3b8; font-size:12px; margin-bottom:32px; }
      .section { margin-bottom:28px; }
      .section-title { font-size:14px; font-weight:700; color:#1e293b; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #1e3aaa; }
      .kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
      .kpi { border:1px solid #e2e8f0; border-left:4px solid #1e3aaa; padding:12px 16px; border-radius:0 8px 8px 0; }
      .kpi-label { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:4px; }
      .kpi-value { font-size:20px; font-weight:700; color:#1e293b; }
      table { width:100%; border-collapse:collapse; }
      th { text-align:left; padding:8px 12px; background:#f8fafc; border-bottom:2px solid #e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#64748b; font-weight:600; }
      td { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#334155; }
      tr:last-child td { border-bottom:none; }
      .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:500; }
      .badge-green { background:#dcfce7; color:#166534; }
      .badge-gray { background:#f1f5f9; color:#475569; }
      .badge-amber { background:#fef3c7; color:#92400e; }
      .badge-violet { background:#ede9fe; color:#5b21b6; }
      .footer { margin-top:48px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; display:flex; justify-content:space-between; }
      @media print { body { padding:28px; } button { display:none; } }
    </style>
  </head><body>
    ${bodyHtml}
    <div class="footer">
      <span>MARMODECOR — Plataforma SaaS</span>
      <span>Gerado em ${today()}</span>
    </div>
    <script>window.onload = () => { setTimeout(() => window.print(), 300); }<\/script>
  </body></html>`);
  w.document.close();
}

/* ─── Report generators ─── */
function gerarRelatorioFinanceiro(companies: Company[], plans: SubscriptionPlan[]) {
  const priceMap: Record<string, number> = {};
  plans.forEach(p => { priceMap[p.code] = p.price; });

  const active = companies.filter(c => c.active);
  const mrr = active.reduce((s, c) => s + (priceMap[c.plan] ?? 0), 0);
  const pagantes = active.filter(c => (priceMap[c.plan] ?? 0) > 0).length;
  const ticketMedio = pagantes > 0 ? mrr / pagantes : 0;
  const receitaAcumulada = companies.reduce((s, c) => {
    const months = Math.max(1, Math.ceil(getDias(c.createdAt) / 30));
    return s + (priceMap[c.plan] ?? 0) * months;
  }, 0);
  const ltv = ticketMedio * 12;

  const planRows = plans.filter(p => p.active).map(p => {
    const count = companies.filter(c => c.active && c.plan === p.code).length;
    return `<tr>
      <td>${p.name}</td>
      <td>${fmtBRL(p.price)}/mês</td>
      <td>${count}</td>
      <td>${fmtBRL(p.price * count)}</td>
    </tr>`;
  }).join('');

  printWindow('Relatório Financeiro — MarmoDecor', `
    <h1>Relatório Financeiro</h1>
    <div class="subtitle">MRR, ticket médio, receita acumulada</div>
    <div class="date">Gerado em ${today()}</div>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">MRR Atual</div><div class="kpi-value">${fmtBRL(mrr)}</div></div>
      <div class="kpi"><div class="kpi-label">ARR (Projeção Anual)</div><div class="kpi-value">${fmtBRL(mrr * 12)}</div></div>
      <div class="kpi"><div class="kpi-label">Receita Acumulada</div><div class="kpi-value">${fmtBRL(receitaAcumulada)}</div></div>
      <div class="kpi"><div class="kpi-label">Ticket Médio</div><div class="kpi-value">${fmtBRL(ticketMedio)}</div></div>
      <div class="kpi"><div class="kpi-label">Empresas Pagantes</div><div class="kpi-value">${pagantes}</div></div>
      <div class="kpi"><div class="kpi-label">LTV Estimado (12m)</div><div class="kpi-value">${fmtBRL(ltv)}</div></div>
    </div>

    <div class="section">
      <div class="section-title">Receita por Plano</div>
      <table>
        <thead><tr><th>Plano</th><th>Valor Mensal</th><th>Empresas</th><th>Receita</th></tr></thead>
        <tbody>${planRows}</tbody>
      </table>
    </div>
  `);
}

function gerarRelatorioUso(companies: Company[], plans: SubscriptionPlan[]) {
  const priceMap: Record<string, number> = {};
  plans.forEach(p => { priceMap[p.code] = p.price; });

  const byPlan: Record<string, number> = {};
  companies.forEach(c => { byPlan[c.plan] = (byPlan[c.plan] || 0) + 1; });

  const planRows = Object.entries(byPlan).map(([code, count]) => {
    const pct = Math.round((count / companies.length) * 100);
    const styleMap: Record<string, string> = { BASIC:'badge-amber', PRO:'badge-violet', ENTERPRISE:'badge-green' };
    return `<tr>
      <td><span class="badge ${styleMap[code] || 'badge-gray'}">${PLAN_LABEL[code] ?? code}</span></td>
      <td>${count}</td>
      <td>${pct}%</td>
      <td>${fmtBRL((priceMap[code] ?? 0) * count)}/mês</td>
    </tr>`;
  }).join('');

  const companyRows = [...companies]
    .sort((a, b) => getDias(b.createdAt) - getDias(a.createdAt))
    .slice(0, 10)
    .map(c => `<tr>
      <td>${c.name}</td>
      <td><span class="badge badge-amber">${PLAN_LABEL[c.plan] ?? c.plan}</span></td>
      <td>${getDias(c.createdAt)} dias</td>
      <td><span class="badge ${c.active ? 'badge-green' : 'badge-gray'}">${c.active ? 'Ativa' : 'Inativa'}</span></td>
    </tr>`).join('');

  printWindow('Relatório de Uso — MarmoDecor', `
    <h1>Relatório de Uso</h1>
    <div class="subtitle">Empresas, orçamentos, engajamento</div>
    <div class="date">Gerado em ${today()}</div>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Total de Empresas</div><div class="kpi-value">${companies.length}</div></div>
      <div class="kpi"><div class="kpi-label">Empresas Ativas</div><div class="kpi-value">${companies.filter(c => c.active).length}</div></div>
      <div class="kpi"><div class="kpi-label">Planos Distintos</div><div class="kpi-value">${Object.keys(byPlan).length}</div></div>
    </div>

    <div class="section">
      <div class="section-title">Engajamento por Plano</div>
      <table>
        <thead><tr><th>Plano</th><th>Empresas</th><th>% do Total</th><th>Receita Gerada</th></tr></thead>
        <tbody>${planRows}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Empresas mais recentes</div>
      <table>
        <thead><tr><th>Empresa</th><th>Plano</th><th>Dias como cliente</th><th>Status</th></tr></thead>
        <tbody>${companyRows}</tbody>
      </table>
    </div>
  `);
}

function gerarRelatorioEmpresas(companies: Company[]) {
  const rows = [...companies]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => {
      const styleMap: Record<string, string> = { BASIC:'badge-amber', PRO:'badge-violet', ENTERPRISE:'badge-green' };
      return `<tr>
        <td><strong>${c.name}</strong>${c.cnpj ? `<br><small style="color:#94a3b8">${c.cnpj}</small>` : ''}</td>
        <td><span class="badge ${styleMap[c.plan] || 'badge-gray'}">${PLAN_LABEL[c.plan] ?? c.plan}</span></td>
        <td>${c.email ?? '—'}</td>
        <td>${getDias(c.createdAt)} dias</td>
        <td><span class="badge ${c.active ? 'badge-green' : 'badge-gray'}">${c.active ? 'Ativa' : 'Inativa'}</span></td>
      </tr>`;
    }).join('');

  const byPlan: Record<string, number> = {};
  companies.forEach(c => { byPlan[c.plan] = (byPlan[c.plan] || 0) + 1; });
  const distRows = Object.entries(byPlan).map(([code, count]) =>
    `<tr><td>${PLAN_LABEL[code] ?? code}</td><td>${count}</td><td>${Math.round(count/companies.length*100)}%</td></tr>`
  ).join('');

  printWindow('Relatório de Empresas — MarmoDecor', `
    <h1>Relatório de Empresas</h1>
    <div class="subtitle">Distribuição por plano, status</div>
    <div class="date">Gerado em ${today()}</div>

    <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="kpi"><div class="kpi-label">Total de Empresas</div><div class="kpi-value">${companies.length}</div></div>
      <div class="kpi"><div class="kpi-label">Empresas Ativas</div><div class="kpi-value">${companies.filter(c=>c.active).length}</div></div>
    </div>

    <div class="section">
      <div class="section-title">Distribuição por Plano</div>
      <table>
        <thead><tr><th>Plano</th><th>Quantidade</th><th>Percentual</th></tr></thead>
        <tbody>${distRows}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Lista de Empresas (${companies.length})</div>
      <table>
        <thead><tr><th>Empresa</th><th>Plano</th><th>Contato</th><th>Tempo</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `);
}

function gerarRelatorioGeral(companies: Company[], plans: SubscriptionPlan[]) {
  const priceMap: Record<string, number> = {};
  plans.forEach(p => { priceMap[p.code] = p.price; });
  const active = companies.filter(c => c.active);
  const mrr = active.reduce((s, c) => s + (priceMap[c.plan] ?? 0), 0);
  const pagantes = active.filter(c => (priceMap[c.plan] ?? 0) > 0).length;
  const byPlan: Record<string, number> = {};
  companies.forEach(c => { byPlan[c.plan] = (byPlan[c.plan] || 0) + 1; });

  const planRows = Object.entries(byPlan).map(([code, count]) => {
    const price = priceMap[code] ?? 0;
    return `<tr>
      <td>${PLAN_LABEL[code] ?? code}</td>
      <td>${count}</td>
      <td>${fmtBRL(price)}/mês</td>
      <td>${fmtBRL(price * count)}/mês</td>
    </tr>`;
  }).join('');

  printWindow('Relatório Geral — MarmoDecor', `
    <h1>Relatório Geral</h1>
    <div class="subtitle">Visão completa da plataforma</div>
    <div class="date">Gerado em ${today()}</div>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Total Empresas</div><div class="kpi-value">${companies.length}</div></div>
      <div class="kpi"><div class="kpi-label">Empresas Ativas</div><div class="kpi-value">${active.length}</div></div>
      <div class="kpi"><div class="kpi-label">Empresas Pagantes</div><div class="kpi-value">${pagantes}</div></div>
      <div class="kpi"><div class="kpi-label">MRR Atual</div><div class="kpi-value">${fmtBRL(mrr)}</div></div>
      <div class="kpi"><div class="kpi-label">ARR Projetado</div><div class="kpi-value">${fmtBRL(mrr*12)}</div></div>
      <div class="kpi"><div class="kpi-label">Planos Ativos</div><div class="kpi-value">${plans.filter(p=>p.active).length}</div></div>
    </div>

    <div class="section">
      <div class="section-title">Resumo por Plano</div>
      <table>
        <thead><tr><th>Plano</th><th>Empresas</th><th>Valor</th><th>Receita Mensal</th></tr></thead>
        <tbody>${planRows}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Planos Disponíveis (${plans.filter(p=>p.active).length} ativos)</div>
      <table>
        <thead><tr><th>Nome</th><th>Código</th><th>Preço</th><th>Status</th></tr></thead>
        <tbody>${plans.map(p => `<tr>
          <td>${p.name}</td>
          <td>${p.code}</td>
          <td>${fmtBRL(p.price)}/mês</td>
          <td><span class="badge ${p.active?'badge-green':'badge-gray'}">${p.active?'Ativo':'Inativo'}</span></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  `);
}

/* ─── Report Card ─── */
interface ReportCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onGenerate: () => void;
  loading?: boolean;
}

function ReportCard({ icon: Icon, title, description, onGenerate, loading = false }: ReportCardProps) {
  return (
    <div className="card p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Icon size={22} className="text-slate-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="btn-secondary text-sm shrink-0 gap-2"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Gerar PDF
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminRelatoriosPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/companies'),
      api.get('/admin/plans'),
    ]).then(([cRes, pRes]) => {
      setCompanies(cRes.data.data ?? []);
      setPlans(pRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const reports = [
    {
      icon: DollarSign,
      title: 'Relatório Financeiro',
      description: 'MRR, ticket médio, receita acumulada',
      onGenerate: () => gerarRelatorioFinanceiro(companies, plans),
    },
    {
      icon: BarChart3,
      title: 'Relatório de Uso',
      description: 'Empresas, orçamentos, engajamento',
      onGenerate: () => gerarRelatorioUso(companies, plans),
    },
    {
      icon: Building2,
      title: 'Relatório de Empresas',
      description: 'Distribuição por plano, status',
      onGenerate: () => gerarRelatorioEmpresas(companies),
    },
    {
      icon: FileText,
      title: 'Relatório Geral',
      description: 'Visão completa da plataforma',
      onGenerate: () => gerarRelatorioGeral(companies, plans),
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Exportação de relatórios do SaaS</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(r => (
            <ReportCard key={r.title} {...r} />
          ))}
        </div>
      )}
    </div>
  );
}
