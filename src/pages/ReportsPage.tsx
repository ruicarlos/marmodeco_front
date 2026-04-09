import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Budget } from '../types';
import { FileText, FileSpreadsheet, BarChart3, TrendingUp, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#10b981',
  PENDING: '#f59e0b',
  DRAFT: '#94a3b8',
  REJECTED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprovado', PENDING: 'Pendente', DRAFT: 'Rascunho', REJECTED: 'Rejeitado'
};

export default function ReportsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/budgets').then(r => setBudgets(r.data.data)).finally(() => setLoading(false));
  }, []);

  const totalRevenue = budgets.filter(b => b.status === 'APPROVED').reduce((s, b) => s + b.totalCost, 0);
  const totalArea = budgets.filter(b => b.status === 'APPROVED').reduce((s, b) => s + b.totalArea, 0);

  const statusGroups = budgets.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusGroups).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    color: STATUS_COLORS[status] ?? '#94a3b8',
  }));

  const approved = budgets.filter(b => b.status === 'APPROVED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Análise de orçamentos e exportações</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Orçamentos', value: budgets.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Aprovados', value: approved.length, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Receita Aprovada', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: BarChart3, color: 'text-navy-600 bg-navy-50' },
          { label: 'Área Aprovada', value: `${totalArea.toFixed(2)} m²`, icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{k.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Orçamentos por Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Nenhum dado</div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Exportar Relatórios</h2>
          <div className="space-y-3">
            {approved.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.project?.name} · R$ {b.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/api/reports/budgets/${b.id}/pdf`} target="_blank" rel="noopener" className="btn-ghost p-1.5 text-red-500 hover:text-red-700" title="Exportar PDF">
                    <FileText size={15} />
                  </a>
                  <a href={`/api/reports/budgets/${b.id}/excel`} target="_blank" rel="noopener" className="btn-ghost p-1.5 text-emerald-600 hover:text-emerald-700" title="Exportar Excel">
                    <FileSpreadsheet size={15} />
                  </a>
                </div>
              </div>
            ))}
            {approved.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhum orçamento aprovado para exportar
              </div>
            )}
            {approved.length > 5 && (
              <Link to="/orcamentos" className="btn-secondary w-full justify-center text-xs">
                <Download size={13} /> Ver todos os orçamentos
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Full budgets table */}
      {loading ? (
        <div className="flex items-center justify-center h-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Histórico de Orçamentos</h2>
          </div>
          {budgets.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">Nenhum orçamento gerado</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Orçamento</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Projeto</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Área</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {budgets.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{b.name}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{b.project?.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      R$ {b.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{b.totalArea.toFixed(2)} m²</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
                        style={{ backgroundColor: STATUS_COLORS[b.status] + '20', color: STATUS_COLORS[b.status] }}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {format(new Date(b.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <a href={`/api/reports/budgets/${b.id}/pdf`} target="_blank" rel="noopener" className="btn-ghost p-1.5 text-red-400">
                          <FileText size={13} />
                        </a>
                        <a href={`/api/reports/budgets/${b.id}/excel`} target="_blank" rel="noopener" className="btn-ghost p-1.5 text-emerald-500">
                          <FileSpreadsheet size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
