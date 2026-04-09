import { useEffect, useState } from 'react';
import api from '../../services/api';
import { BarChart3, Building2, Users, TrendingUp } from 'lucide-react';

interface ReportData {
  totalCompanies: number;
  totalUsers: number;
  activeUsers: number;
  planBreakdown: Array<{ plan: string; count: number }>;
}

export default function AdminRelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/companies'),
      api.get('/users'),
    ]).then(([companiesRes, usersRes]) => {
      const companies = companiesRes.data.data ?? [];
      const users = usersRes.data.data ?? [];

      const planCounts: Record<string, number> = {};
      companies.forEach((c: { plan: string }) => {
        planCounts[c.plan] = (planCounts[c.plan] || 0) + 1;
      });

      setData({
        totalCompanies: companies.length,
        totalUsers: users.length,
        activeUsers: users.filter((u: { active: boolean }) => u.active).length,
        planBreakdown: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
      });
    }).finally(() => setLoading(false));
  }, []);

  const PLAN_LABELS: Record<string, string> = {
    BASIC: 'Básico',
    PRO: 'Profissional',
    ENTERPRISE: 'Empresarial',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Métricas e análises da plataforma MarmoDecor</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Total de Empresas</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{data?.totalCompanies ?? 0}</div>
        </div>

        <div className="card p-5 border border-violet-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users size={18} className="text-violet-600" />
            </div>
            <span className="text-sm text-slate-500">Total de Usuários</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{data?.totalUsers ?? 0}</div>
          <div className="text-xs text-emerald-600 mt-1">{data?.activeUsers ?? 0} ativos</div>
        </div>

        <div className="card p-5 border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Taxa de Ativação</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {data && data.totalUsers > 0
              ? Math.round((data.activeUsers / data.totalUsers) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Plan breakdown */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800">Empresas por Plano</h2>
        </div>

        {data?.planBreakdown.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Nenhum dado disponível</p>
        ) : (
          <div className="space-y-4">
            {data?.planBreakdown.map(item => (
              <div key={item.plan}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-700 font-medium">{PLAN_LABELS[item.plan] ?? item.plan}</span>
                  <span className="text-slate-500">{item.count} empresa{item.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-navy-600 transition-all"
                    style={{ width: `${Math.round((item.count / (data?.totalCompanies || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5 border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500 text-center">
          📊 Relatórios avançados com dados de orçamentos, projetos e uso de IA serão disponibilizados nas próximas versões.
        </p>
      </div>
    </div>
  );
}
