import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building2, Users, CreditCard, TrendingUp, Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface Stats {
  totalCompanies: number;
  totalUsers: number;
  activeUsers: number;
  planCounts: { BASIC: number; PRO: number; ENTERPRISE: number };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/companies'),
      api.get('/users'),
    ]).then(([companiesRes, usersRes]) => {
      const companies = companiesRes.data.data ?? [];
      const users = usersRes.data.data ?? [];
      const planCounts = { BASIC: 0, PRO: 0, ENTERPRISE: 0 };
      companies.forEach((c: { plan: string }) => {
        if (c.plan === 'BASIC') planCounts.BASIC++;
        else if (c.plan === 'PRO') planCounts.PRO++;
        else if (c.plan === 'ENTERPRISE') planCounts.ENTERPRISE++;
      });
      setStats({
        totalCompanies: companies.length,
        totalUsers: users.length,
        activeUsers: users.filter((u: { active: boolean }) => u.active).length,
        planCounts,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Empresas Cadastradas',
      value: stats?.totalCompanies ?? 0,
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Usuários Totais',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'bg-violet-50 text-violet-600',
      border: 'border-violet-100',
    },
    {
      label: 'Usuários Ativos',
      value: stats?.activeUsers ?? 0,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: 'Planos PRO / Enterprise',
      value: (stats?.planCounts.PRO ?? 0) + (stats?.planCounts.ENTERPRISE ?? 0),
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
  ];

  const planData = [
    { name: 'Básico', count: stats?.planCounts.BASIC ?? 0, color: 'bg-slate-400' },
    { name: 'Profissional', count: stats?.planCounts.PRO ?? 0, color: 'bg-amber-500' },
    { name: 'Empresarial', count: stats?.planCounts.ENTERPRISE ?? 0, color: 'bg-violet-500' },
  ];

  const total = stats?.totalCompanies || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard SaaS</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão geral da plataforma MarmoDecor</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`card p-5 border ${kpi.border}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800">Distribuição de Planos</h2>
          </div>
          <div className="space-y-4">
            {planData.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{p.name}</span>
                  <span className="font-medium text-slate-800">{p.count} empresa{p.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.color} transition-all`}
                    style={{ width: `${Math.round((p.count / total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Status */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800">Status da Plataforma</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'API Backend', ok: true },
              { label: 'Banco de Dados PostgreSQL', ok: true },
              { label: 'Autenticação JWT', ok: true },
              { label: 'Processamento de Arquivos CAD', ok: false, note: 'Em desenvolvimento' },
              { label: 'Módulo de IA', ok: false, note: 'Em desenvolvimento' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {item.ok
                    ? <><CheckCircle size={13} /> Operacional</>
                    : <><AlertCircle size={13} /> {item.note}</>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
