import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { Company, SubscriptionPlan } from '../../types';
import { DollarSign, TrendingUp, Users, Gift, BarChart3, CreditCard } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─── helpers ─── */
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ─── Área / Line Chart ─── */
function AreaChart({ data, color = '#1e3aaa' }: { data: { label: string; value: number }[]; color?: string }) {
  const W = 520, H = 160, PAD = { top: 16, right: 16, bottom: 28, left: 48 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map(d => d.value), 1);
  const step = iW / (data.length - 1 || 1);

  const pts = data.map((d, i) => ({
    x: PAD.left + i * step,
    y: PAD.top + iH - (d.value / max) * iH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = [
    `M${pts[0].x},${PAD.top + iH}`,
    ...pts.map(p => `L${p.x},${p.y}`),
    `L${pts[pts.length - 1].x},${PAD.top + iH}`,
    'Z',
  ].join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: PAD.top + iH - t * iH,
    label: fmtBRL(t * max),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H * 2 }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{t.label}</text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={PAD.left + i * step} y={H - 6} textAnchor="middle" fontSize="10" fill="#64748b">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

/* ─── Bar Chart ─── */
function BarChart({ data, color = '#1e3aaa' }: {
  data: { label: string; value: number; colorOverride?: string }[];
  color?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barColors = ['#b45309', '#1e3aaa', '#7c3aed', '#0f766e'];

  return (
    <div className="flex items-end gap-3 h-40 px-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-xs font-semibold text-slate-600">{fmtBRL(d.value)}</span>
          <div className="w-full rounded-t-md transition-all" style={{
            height: `${Math.max(Math.round((d.value / max) * 120), d.value > 0 ? 6 : 0)}px`,
            backgroundColor: d.colorOverride ?? barColors[i % barColors.length],
          }} />
          <span className="text-xs text-slate-500 text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Pie / Donut Chart ─── */
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumPct = 0;

  const slices = data.map(d => {
    const pct = d.value / total;
    const start = cumPct;
    cumPct += pct;
    return { ...d, pct, startDeg: start * 360, endDeg: cumPct * 360 };
  });

  // Build conic-gradient stops
  const stops = slices.map(s => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`).join(', ');

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <div
          className="w-full h-full rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
        />
        <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-600">{total} total</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <div>
              <span className="text-sm text-slate-700">{s.label}: </span>
              <span className="text-sm font-semibold text-slate-800">{s.value}</span>
              <span className="text-xs text-slate-400 ml-1">({Math.round(s.pct * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminFinanceiroPage() {
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

  /* ─── Computed metrics ─── */
  const planPriceMap = useMemo(() => {
    const m: Record<string, number> = {};
    plans.forEach(p => { m[p.code] = p.price; });
    return m;
  }, [plans]);

  const metrics = useMemo(() => {
    const activeCompanies = companies.filter(c => c.active);
    const mrr = activeCompanies.reduce((sum, c) => sum + (planPriceMap[c.plan] ?? 0), 0);
    const pagantes = activeCompanies.filter(c => (planPriceMap[c.plan] ?? 0) > 0).length;
    const gratuitas = activeCompanies.filter(c => (planPriceMap[c.plan] ?? 0) === 0).length;
    const ticketMedio = pagantes > 0 ? mrr / pagantes : 0;
    const ltv = ticketMedio * 12;

    // Receita acumulada: sum from each company's start date
    const receitaAcumulada = companies.reduce((sum, c) => {
      const monthsActive = Math.max(1,
        Math.ceil((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
      return sum + (planPriceMap[c.plan] ?? 0) * monthsActive;
    }, 0);

    return { mrr, pagantes, gratuitas, ticketMedio, ltv, receitaAcumulada };
  }, [companies, planPriceMap]);

  /* ─── Monthly revenue evolution (last 6 months) ─── */
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return {
        label: format(d, 'MMM', { locale: ptBR }).charAt(0).toUpperCase() + format(d, 'MMM', { locale: ptBR }).slice(1),
        start: startOfMonth(d),
        end: endOfMonth(d),
        value: 0,
      };
    });

    months.forEach(m => {
      companies.forEach(c => {
        const created = new Date(c.createdAt);
        if (!isAfter(created, m.end)) {
          m.value += planPriceMap[c.plan] ?? 0;
        }
      });
    });

    return months;
  }, [companies, planPriceMap]);

  /* ─── Revenue by plan ─── */
  const revenueByPlan = useMemo(() => {
    const PLAN_COLORS: Record<string, string> = {
      BASIC: '#f59e0b',
      PRO: '#1e3aaa',
      ENTERPRISE: '#7c3aed',
    };
    const grouped: Record<string, { label: string; value: number; color: string }> = {};
    companies.filter(c => c.active).forEach(c => {
      const price = planPriceMap[c.plan] ?? 0;
      const label = c.plan === 'BASIC' ? 'Básico' : c.plan === 'PRO' ? 'Profissional' : 'Empresarial';
      if (!grouped[c.plan]) grouped[c.plan] = { label, value: 0, color: PLAN_COLORS[c.plan] ?? '#94a3b8' };
      grouped[c.plan].value += price;
    });
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [companies, planPriceMap]);

  /* ─── Plan distribution (count) ─── */
  const planDistribution = useMemo(() => {
    const COLORS: Record<string, string> = {
      BASIC: '#f59e0b',
      PRO: '#1e3aaa',
      ENTERPRISE: '#7c3aed',
    };
    const grouped: Record<string, { label: string; value: number; color: string }> = {};
    companies.filter(c => c.active).forEach(c => {
      const label = c.plan === 'BASIC' ? 'Básico' : c.plan === 'PRO' ? 'Profissional' : 'Empresarial';
      if (!grouped[c.plan]) grouped[c.plan] = { label, value: 0, color: COLORS[c.plan] ?? '#94a3b8' };
      grouped[c.plan].value++;
    });
    return Object.values(grouped);
  }, [companies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
      </div>
    );
  }

  const kpis = [
    { label: 'MRR Atual', value: fmtBRL(metrics.mrr), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Receita Acumulada', value: fmtBRL(metrics.receitaAcumulada), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ticket Médio', value: fmtBRL(metrics.ticketMedio), icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Pagantes', value: String(metrics.pagantes), icon: Users, color: 'text-navy-700', bg: 'bg-navy-50' },
    { label: 'Gratuitas', value: String(metrics.gratuitas), icon: Gift, color: 'text-slate-500', bg: 'bg-slate-100' },
    { label: 'LTV Estimado', value: fmtBRL(metrics.ltv), icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão de monetização do SaaS</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon size={16} className={k.color} />
            </div>
            <div className="text-lg font-bold text-slate-800 leading-tight">{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Evolução de Receita</h2>
          {monthlyData.every(m => m.value === 0) ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Sem dados suficientes</div>
          ) : (
            <AreaChart data={monthlyData} color="#1e3aaa" />
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Receita por Plano</h2>
          {revenueByPlan.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
          ) : (
            <BarChart
              data={revenueByPlan.map(d => ({ label: d.label, value: d.value, colorOverride: d.color }))}
            />
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-5">Distribuição por Plano</h2>
          {planDistribution.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
          ) : (
            <PieChart data={planDistribution} />
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Resumo Financeiro</h2>
          <div className="space-y-3">
            {[
              { label: 'MRR (Receita Recorrente Mensal)', value: fmtBRL(metrics.mrr), highlight: true },
              { label: 'ARR (Projeção Anual)', value: fmtBRL(metrics.mrr * 12) },
              { label: 'Receita Acumulada', value: fmtBRL(metrics.receitaAcumulada) },
              { label: 'Ticket Médio por Empresa', value: fmtBRL(metrics.ticketMedio) },
              { label: 'LTV Estimado (12 meses)', value: fmtBRL(metrics.ltv) },
              { label: 'Total de Empresas Ativas', value: `${companies.filter(c => c.active).length}` },
            ].map(item => (
              <div key={item.label} className={`flex justify-between items-center py-2 border-b border-slate-50 last:border-0 ${item.highlight ? 'bg-navy-50 -mx-2 px-2 rounded-lg' : ''}`}>
                <span className={`text-sm ${item.highlight ? 'font-semibold text-navy-800' : 'text-slate-600'}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-bold ${item.highlight ? 'text-navy-700' : 'text-slate-800'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
