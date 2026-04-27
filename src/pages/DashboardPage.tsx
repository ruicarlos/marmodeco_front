import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DashboardStats } from '../types';
import {
  FolderOpen, FileText, Package, TrendingUp,
  AreaChart, Clock, CheckCircle2, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: '#94a3b8' },
  PENDING: { label: 'Pendente', color: '#f59e0b' },
  APPROVED: { label: 'Aprovado', color: '#10b981' },
  REJECTED: { label: 'Rejeitado', color: '#ef4444' },
};

const PROJECT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Rascunho', cls: 'badge-gray' },
  IN_PROGRESS: { label: 'Em andamento', cls: 'badge-blue' },
  COMPLETED: { label: 'Concluído', cls: 'badge-green' },
  CANCELLED: { label: 'Cancelado', cls: 'badge-red' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" />
    </div>
  );

  const kpis = [
    { label: 'Projetos', value: stats?.totalProjects ?? 0, icon: FolderOpen, color: 'bg-blue-50 text-blue-600', to: '/projetos' },
    { label: 'Orçamentos', value: stats?.totalBudgets ?? 0, icon: FileText, color: 'bg-navy-50 text-navy-600', to: '/orcamentos' },
    { label: 'Materiais', value: stats?.totalMaterials ?? 0, icon: Package, color: 'bg-emerald-50 text-emerald-600', to: '/materiais' },
    {
      label: 'Receita Total',
      value: `R$ ${(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      to: '/orcamentos'
    },
  ];

  const chartData = (stats?.statusCounts ?? []).map((s) => ({
    name: STATUS_MAP[s.status]?.label ?? s.status,
    value: s._count,
    fill: STATUS_MAP[s.status]?.color ?? '#94a3b8',
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão geral da plataforma MarmoDecor</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className="card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</p>
              </div>
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', kpi.color)}>
                <kpi.icon size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AreaChart size={18} className="text-navy-600" />
            <h2 className="font-semibold text-slate-800">Orçamentos por Status</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Orçamentos']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Nenhum orçamento ainda
            </div>
          )}
        </div>

        {/* Area stats */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Métricas Gerais</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Área total orçada</span>
              <span className="font-semibold text-slate-800">{(stats?.totalArea ?? 0).toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Ticket médio</span>
              <span className="font-semibold text-slate-800">
                R$ {(stats?.avgBudget ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-600">Materiais disponíveis</span>
              <span className="font-semibold text-slate-800">{stats?.totalMaterials ?? 0} itens</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Projetos Recentes</h2>
            </div>
            <Link to="/projetos" className="text-xs text-navy-700 hover:text-navy-800 flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recentProjects.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum projeto criado</div>
            ) : (
              stats?.recentProjects.map((p) => (
                <Link key={p.id} to={`/projetos/${p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.clientName || 'Sem cliente'} · {format(new Date(p.createdAt), 'dd MMM yyyy', { locale: ptBR })}</div>
                  </div>
                  <span className={PROJECT_STATUS_MAP[p.status]?.cls ?? 'badge-gray'}>
                    {PROJECT_STATUS_MAP[p.status]?.label ?? p.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Budgets */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Orçamentos Recentes</h2>
            </div>
            <Link to="/orcamentos" className="text-xs text-navy-700 hover:text-navy-800 flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recentBudgets.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum orçamento criado</div>
            ) : (
              stats?.recentBudgets.map((b) => (
                <Link key={b.id} to={`/orcamentos/${b.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{b.name}</div>
                    <div className="text-xs text-slate-400">
                      {b.project?.name} · {format(new Date(b.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      R$ {b.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={clsx('text-xs', {
                      'text-emerald-600': b.status === 'APPROVED',
                      'text-amber-600': b.status === 'PENDING',
                      'text-slate-500': b.status === 'DRAFT',
                      'text-red-500': b.status === 'REJECTED',
                    })}>
                      {STATUS_MAP[b.status]?.label ?? b.status}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
