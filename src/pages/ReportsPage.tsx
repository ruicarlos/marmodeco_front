import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Sale, FinancialEntry } from '../types';
import {
  BarChart3, TrendingUp, FileText, CheckCircle2, Clock,
  Users, DollarSign, CreditCard, Banknote, Smartphone,
  Plus, Pencil, Trash2, X, Save, Loader2, AlertCircle,
  ChevronUp, ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── helpers ──────────────────────────────────────────────────────────────────
function brl(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
function fmtMonth(m: string) {
  const [y, mo] = m.split('-');
  return format(new Date(Number(y), Number(mo) - 1, 1), 'MMM/yy', { locale: ptBR });
}

// ── constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',   label: 'Visão Geral'  },
  { key: 'clients',    label: 'Por Cliente'  },
  { key: 'pipeline',   label: 'Pipeline'     },
  { key: 'abc',        label: 'Curva ABC'    },
  { key: 'financial',  label: 'Financeiro'   },
] as const;
type Tab = typeof TABS[number]['key'];

const PAY_LABEL: Record<string, string> = {
  CARD: 'Cartão', PIX: 'Pix', CASH: 'Dinheiro', MIXED: 'Misto',
};
const PAY_ICON: Record<string, React.ReactNode> = {
  CARD: <CreditCard size={12} />, PIX: <Smartphone size={12} />,
  CASH: <Banknote size={12} />,   MIXED: <DollarSign size={12} />,
};
const SALE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', PAID: 'Pago', PARTIAL: 'Parcial', CANCELLED: 'Cancelado',
};
const SALE_STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID:    'bg-emerald-50 text-emerald-700',
  PARTIAL: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};
const PIPELINE_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444',
};
const PIPELINE_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
};
const ABC_COLORS: Record<string, string> = {
  A: '#1a2e5a', B: '#b8935a', C: '#94a3b8',
};

// ── small toast ───────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-white border',
      type === 'success' ? 'border-emerald-200' : 'border-red-200'
    )}>
      {type === 'success'
        ? <CheckCircle2 size={16} className="text-emerald-500" />
        : <AlertCircle  size={16} className="text-red-500" />}
      <p className="text-sm text-slate-700">{msg}</p>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-xl font-bold text-slate-800 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2', color)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('overview');

  // data
  const [sales, setSales]           = useState<Sale[]>([]);
  const [financial, setFinancial]   = useState<FinancialEntry[]>([]);
  const [pipeline, setPipeline]     = useState<{ status: string; count: number; total: number }[]>([]);
  const [abcData, setAbcData]       = useState<{ name: string; type: string; revenue: number; revenuePct: number; cumPct: number; curve: string; area: number }[]>([]);
  const [loading, setLoading]       = useState(true);

  // financial entry form
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryForm, setEntryForm] = useState({ type: 'PAYABLE', description: '', amount: '', dueDate: '', category: '' });
  const [savingEntry, setSavingEntry] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/sales').then(r => setSales(r.data.data)),
      api.get('/financial').then(r => setFinancial(r.data.data)),
      api.get('/reports/sales/pipeline').then(r => setPipeline(r.data.data)),
      api.get('/reports/sales/abc').then(r => setAbcData(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── derived stats ────────────────────────────────────────────────────────
  const approvedSales   = sales.filter(s => s.status !== 'CANCELLED');
  const totalRevenue    = approvedSales.reduce((s, x) => s + x.totalAmount, 0);
  const paidRevenue     = sales.filter(s => s.status === 'PAID').reduce((s, x) => s + x.totalAmount, 0);
  const pendingRevenue  = sales.filter(s => s.status === 'PENDING').reduce((s, x) => s + x.totalAmount, 0);

  const totalReceivable = financial.filter(f => f.type === 'RECEIVABLE').reduce((s, x) => s + x.amount, 0);
  const totalPayable    = financial.filter(f => f.type === 'PAYABLE').reduce((s, x) => s + x.amount, 0);

  // group by client
  type ClientRow = { name: string; count: number; total: number; paid: number; pending: number };
  const byClient: ClientRow[] = Object.values(
    approvedSales.reduce<Record<string, ClientRow>>((acc, s) => {
      const name = s.clientName || s.budget?.project?.clientName || 'Não informado';
      if (!acc[name]) acc[name] = { name, count: 0, total: 0, paid: 0, pending: 0 };
      acc[name].count++;
      acc[name].total += s.totalAmount;
      if (s.status === 'PAID')    acc[name].paid    += s.totalAmount;
      else                        acc[name].pending += s.totalAmount;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  // monthly revenue from sales
  const monthlyMap: Record<string, number> = {};
  for (const s of approvedSales) {
    const key = s.createdAt.substring(0, 7); // YYYY-MM
    monthlyMap[key] = (monthlyMap[key] || 0) + s.totalAmount;
  }
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month: fmtMonth(month), total }));

  // ── financial entry handlers ─────────────────────────────────────────────
  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEntry(true);
    try {
      await api.post('/financial', {
        type:        entryForm.type,
        description: entryForm.description,
        amount:      entryForm.amount,
        dueDate:     entryForm.dueDate || undefined,
        category:    entryForm.category || undefined,
      });
      setToast({ msg: 'Lançamento adicionado.', type: 'success' });
      setShowEntryForm(false);
      setEntryForm({ type: 'PAYABLE', description: '', amount: '', dueDate: '', category: '' });
      loadAll();
    } catch {
      setToast({ msg: 'Erro ao salvar lançamento.', type: 'error' });
    } finally { setSavingEntry(false); }
  };

  const markPaid = async (entry: FinancialEntry) => {
    try {
      await api.put(`/financial/${entry.id}`, { status: 'PAID' });
      setToast({ msg: 'Marcado como pago.', type: 'success' });
      loadAll();
    } catch { setToast({ msg: 'Erro.', type: 'error' }); }
  };

  const deleteEntry = async (entry: FinancialEntry) => {
    if (!confirm(`Excluir "${entry.description}"?`)) return;
    try {
      await api.delete(`/financial/${entry.id}`);
      setToast({ msg: 'Lançamento excluído.', type: 'success' });
      loadAll();
    } catch { setToast({ msg: 'Erro ao excluir.', type: 'error' }); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" />
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Análise comercial e financeira</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              tab === t.key ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total em Vendas"     value={brl(totalRevenue)}   sub={`${approvedSales.length} vendas`}     icon={TrendingUp}  color="text-navy-600 bg-navy-50" />
            <KPICard label="Receita Recebida"    value={brl(paidRevenue)}    sub="status: pago"                          icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
            <KPICard label="Aguardando Pgto"     value={brl(pendingRevenue)} sub={`${sales.filter(s=>s.status==='PENDING').length} pendentes`} icon={Clock} color="text-amber-600 bg-amber-50" />
            <KPICard label="Orçamentos Enviados" value={pipeline.find(p=>p.status==='PENDING')?.count ?? 0} sub="aguardando aprovação" icon={FileText} color="text-purple-600 bg-purple-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Monthly revenue */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Receita Mensal</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => 'R$' + (v/1000).toFixed(0) + 'k'} width={50} />
                    <Tooltip formatter={(v: number) => [brl(v), 'Receita']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" fill="#1a2e5a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Nenhuma venda ainda</div>
              )}
            </div>

            {/* Sales by payment method */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Formas de Pagamento</h3>
              {(() => {
                const byMethod: Record<string, number> = {};
                for (const s of approvedSales) {
                  byMethod[s.paymentMethod] = (byMethod[s.paymentMethod] || 0) + s.totalAmount;
                }
                const pieData = Object.entries(byMethod).map(([k, v]) => ({ name: PAY_LABEL[k] || k, value: v }));
                const COLORS  = ['#1a2e5a','#b8935a','#10b981','#f59e0b'];
                return pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [brl(v)]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend iconType="circle" iconSize={10} formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Nenhuma venda ainda</div>
                );
              })()}
            </div>
          </div>

          {/* Recent sales */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Vendas Recentes</h3>
            </div>
            {sales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Nenhuma venda registrada</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Orçamento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Pagamento</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Valor</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.slice(0, 10).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        <Link to={`/orcamentos/${s.budgetId}`} className="hover:text-navy-700 flex items-center gap-1">
                          {s.budget?.name || s.budgetId.substring(0, 8)}
                          <ArrowRight size={12} className="text-slate-400" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {s.clientName || s.budget?.project?.clientName || '—'}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {PAY_ICON[s.paymentMethod]} {PAY_LABEL[s.paymentMethod]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{brl(s.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs px-2.5 py-0.5 rounded-full font-medium', SALE_STATUS_CLS[s.status])}>
                          {SALE_STATUS_LABEL[s.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                        {format(new Date(s.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── BY CLIENT ── */}
      {tab === 'clients' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard label="Total de Clientes" value={byClient.length}          sub="com vendas"           icon={Users}      color="text-navy-600 bg-navy-50" />
            <KPICard label="Maior Cliente"      value={byClient[0]?.name || '—'} sub={byClient[0] ? brl(byClient[0].total) : ''} icon={TrendingUp} color="text-emerald-600 bg-emerald-50" />
            <KPICard label="Ticket Médio"       value={approvedSales.length > 0 ? brl(totalRevenue / approvedSales.length) : '—'} icon={DollarSign} color="text-amber-600 bg-amber-50" />
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Vendas por Cliente</h3>
            </div>
            {byClient.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Nenhuma venda registrada</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Cliente</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Vendas</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Recebido</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Pendente</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {byClient.map(c => (
                    <tr key={c.name} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{c.count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{brl(c.total)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 hidden sm:table-cell">{brl(c.paid)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 hidden sm:table-cell">{brl(c.pending)}</td>
                      <td className="px-5 py-3">
                        {/* progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: c.total > 0 ? `${(c.paid / c.total) * 100}%` : '0%' }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── PIPELINE ── */}
      {tab === 'pipeline' && (
        <div className="space-y-5">
          {/* Funnel bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipeline.map(p => (
              <div key={p.status} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: PIPELINE_COLORS[p.status] }}>
                    {PIPELINE_LABELS[p.status]}
                  </span>
                  <span className="text-2xl font-bold text-slate-800">{p.count}</span>
                </div>
                <p className="text-sm font-medium text-slate-600">{brl(p.total)}</p>
                <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: PIPELINE_COLORS[p.status] + '30' }}>
                  <div className="h-1 rounded-full" style={{
                    backgroundColor: PIPELINE_COLORS[p.status],
                    width: `${pipeline[0]?.count > 0 ? (p.count / pipeline[0].count) * 100 : 0}%`
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Funnel chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Distribuição do Pipeline</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pipeline.map(p => ({ name: PIPELINE_LABELS[p.status], value: p.total, count: p.count, fill: PIPELINE_COLORS[p.status] }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => 'R$' + (v/1000).toFixed(0) + 'k'} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(v: number) => [brl(v), 'Valor']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {pipeline.map(p => (
                    <Cell key={p.status} fill={PIPELINE_COLORS[p.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion rate */}
          {(() => {
            const total    = pipeline.reduce((s, p) => s + p.count, 0);
            const approved = pipeline.find(p => p.status === 'APPROVED')?.count || 0;
            const rate     = total > 0 ? (approved / total) * 100 : 0;
            return (
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Taxa de Conversão</h3>
                    <p className="text-sm text-slate-500 mt-1">Orçamentos aprovados / total criados</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-navy-700">{rate.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400">{approved} de {total}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-slate-100 rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── ABC CURVE ── */}
      {tab === 'abc' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['A','B','C'] as const).map(curve => {
              const items = abcData.filter(m => m.curve === curve);
              const total = items.reduce((s, m) => s + m.revenue, 0);
              return (
                <div key={curve} className="card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: ABC_COLORS[curve] }}>
                      {curve}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{items.length} material{items.length !== 1 ? 'is' : ''}</p>
                      <p className="text-xs text-slate-500">{curve === 'A' ? 'Top 80% receita' : curve === 'B' ? '80–95% receita' : 'Cauda longa'}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{brl(total)}</p>
                </div>
              );
            })}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Materiais por Receita</h3>
            </div>
            {abcData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Sem dados — aprove orçamentos para ver a curva ABC
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 w-12">Curva</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Material</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Tipo</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Receita</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">% Receita</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">% Acum.</th>
                    <th className="px-4 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {abcData.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs text-white"
                          style={{ backgroundColor: ABC_COLORS[m.curve] }}>
                          {m.curve}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">{m.type}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{brl(m.revenue)}</td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{m.revenuePct.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{m.cumPct.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${m.revenuePct}%`, backgroundColor: ABC_COLORS[m.curve] }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── FINANCIAL ── */}
      {tab === 'financial' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Contas a Receber"  value={brl(totalReceivable - financial.filter(f=>f.type==='RECEIVABLE'&&f.status==='PAID').reduce((s,x)=>s+x.amount,0))} sub="saldo pendente" icon={ChevronUp}  color="text-emerald-600 bg-emerald-50" />
            <KPICard label="Contas a Pagar"    value={brl(totalPayable    - financial.filter(f=>f.type==='PAYABLE'   &&f.status==='PAID').reduce((s,x)=>s+x.amount,0))} sub="saldo pendente" icon={DollarSign} color="text-red-600 bg-red-50" />
            <KPICard label="Total Recebido"    value={brl(financial.filter(f=>f.type==='RECEIVABLE'&&f.status==='PAID').reduce((s,x)=>s+x.amount,0))} icon={CheckCircle2} color="text-navy-600 bg-navy-50" />
            <KPICard label="Total Pago"        value={brl(financial.filter(f=>f.type==='PAYABLE'&&f.status==='PAID').reduce((s,x)=>s+x.amount,0))} icon={Banknote} color="text-slate-600 bg-slate-100" />
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button onClick={() => setShowEntryForm(v => !v)} className="btn-primary text-sm">
              <Plus size={14} /> Novo Lançamento
            </button>
          </div>

          {/* Entry form */}
          {showEntryForm && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Novo Lançamento Manual</h3>
                <button onClick={() => setShowEntryForm(false)} className="btn-ghost p-1.5"><X size={16} /></button>
              </div>
              <form onSubmit={saveEntry} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" required value={entryForm.type}
                    onChange={e => setEntryForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="PAYABLE">Conta a Pagar</option>
                    <option value="RECEIVABLE">Conta a Receber</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Descrição *</label>
                  <input className="input" required placeholder="Ex: Aluguel, Fornecedor…"
                    value={entryForm.description}
                    onChange={e => setEntryForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor (R$) *</label>
                  <input className="input" type="number" step="0.01" min="0" required
                    value={entryForm.amount}
                    onChange={e => setEntryForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input className="input" type="date" value={entryForm.dueDate}
                    onChange={e => setEntryForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="col-span-2 flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowEntryForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={savingEntry}>
                    {savingEntry ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Receivable */}
          <FinancialTable
            title="Contas a Receber"
            entries={financial.filter(f => f.type === 'RECEIVABLE')}
            onMarkPaid={markPaid}
            onDelete={deleteEntry}
            accent="emerald"
          />

          {/* Payable */}
          <FinancialTable
            title="Contas a Pagar"
            entries={financial.filter(f => f.type === 'PAYABLE')}
            onMarkPaid={markPaid}
            onDelete={deleteEntry}
            accent="red"
          />
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── FinancialTable sub-component ──────────────────────────────────────────────
function FinancialTable({ title, entries, onMarkPaid, onDelete, accent }: {
  title: string;
  entries: FinancialEntry[];
  onMarkPaid: (e: FinancialEntry) => void;
  onDelete:   (e: FinancialEntry) => void;
  accent: 'emerald' | 'red';
}) {
  const FIN_STATUS: Record<string, string> = {
    PENDING:  'bg-amber-50 text-amber-700',
    PAID:     'bg-emerald-50 text-emerald-700',
    OVERDUE:  'bg-red-50 text-red-700',
    CANCELLED:'bg-slate-100 text-slate-500',
  };
  const FIN_LABEL: Record<string, string> = {
    PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Vencido', CANCELLED: 'Cancelado',
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          accent === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        )}>
          {entries.length} lançamento{entries.length !== 1 ? 's' : ''}
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">Nenhum lançamento</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Categoria</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Valor</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Vencimento</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map(e => {
              const isOverdue = e.status === 'PENDING' && e.dueDate && new Date(e.dueDate) < new Date();
              const status    = isOverdue ? 'OVERDUE' : e.status;
              return (
                <tr key={e.id} className={clsx('hover:bg-slate-50', e.status === 'PAID' && 'opacity-60')}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{e.description}</div>
                    {e.sale?.budget?.project?.name && (
                      <div className="text-xs text-slate-400">Venda: {e.sale.budget.project.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{e.category || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500 hidden sm:table-cell">
                    {e.dueDate ? format(new Date(e.dueDate), 'dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx('text-xs px-2.5 py-0.5 rounded-full font-medium', FIN_STATUS[status])}>
                      {FIN_LABEL[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {e.status === 'PENDING' && (
                        <button onClick={() => onMarkPaid(e)} title="Marcar como pago"
                          className="p-1.5 rounded text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50">
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      {!e.saleId && (
                        <button onClick={() => onDelete(e)} title="Excluir"
                          className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
