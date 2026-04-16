import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { SubscriptionPlan, Company } from '../../types';
import { Plus, Pencil, Trash2, CreditCard, DollarSign, Trophy, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

/* ─── Helpers ─── */
function fmtBRL(v: number) {
  if (v === 0) return 'Grátis';
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDuration(days: number): string {
  if (days <= 0) return '—';
  if (days < 30) return `${days} dias`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

function formatLimit(n: number): string {
  return n === -1 ? 'ilimitado' : String(n);
}

/* ─── Toggle component ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        checked ? 'bg-navy-700' : 'bg-slate-300'
      )}
    >
      <span className={clsx(
        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </button>
  );
}

/* ─── Modal: Novo / Editar Plano ─── */
interface PlanForm {
  name: string;
  price: string;
  durationDays: string;
  budgetLimit: string;
  active: boolean;
}

function PlanModal({
  plan, onClose, onSaved,
}: {
  plan?: SubscriptionPlan;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!plan;
  const [form, setForm] = useState<PlanForm>({
    name: plan?.name ?? '',
    price: plan ? String(plan.price) : '0',
    durationDays: plan ? String(plan.maxStorage) : '7',
    budgetLimit: plan ? (plan.maxProjects === -1 ? '' : String(plan.maxProjects)) : '',
    active: plan?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.name.trim().toUpperCase().replace(/\s+/g, '_'),
        price: parseFloat(form.price) || 0,
        maxStorage: parseInt(form.durationDays) || 30,  // duration in days
        maxProjects: form.budgetLimit.trim() === '' ? -1 : parseInt(form.budgetLimit),
        maxUsers: -1,
        features: '[]',
        active: form.active,
      };
      if (isEdit) {
        await api.put(`/admin/plans/${plan!.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar plano');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">{isEdit ? 'Editar Plano' : 'Novo Plano'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Preencha os dados do plano abaixo.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Valor Mensal (R$)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Duração (dias)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.durationDays}
              onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Limite de Orçamentos <span className="text-slate-400 font-normal">(vazio = ilimitado)</span></label>
            <input
              className="input"
              placeholder="Ilimitado"
              value={form.budgetLimit}
              onChange={e => setForm(f => ({ ...f, budgetLimit: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <Toggle checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
            <span className="text-sm text-slate-700">Ativo</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin" />} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminPlanosPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | SubscriptionPlan | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/plans'),
      api.get('/companies'),
    ]).then(([pRes, cRes]) => {
      setPlans(pRes.data.data ?? []);
      setCompanies(cRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /* Companies per plan code */
  const companiesByPlan = useMemo(() => {
    const m: Record<string, number> = {};
    companies.forEach(c => { m[c.plan] = (m[c.plan] || 0) + 1; });
    return m;
  }, [companies]);

  /* KPI metrics */
  const activePlans = plans.filter(p => p.active);
  const totalMRR = useMemo(() => {
    return plans.reduce((sum, p) => {
      if (!p.active) return sum;
      const count = companiesByPlan[p.code] ?? 0;
      return sum + p.price * count;
    }, 0);
  }, [plans, companiesByPlan]);

  const maisVendido = useMemo(() => {
    let best: { name: string; count: number } = { name: '—', count: 0 };
    plans.forEach(p => {
      const count = companiesByPlan[p.code] ?? 0;
      if (count > best.count) best = { name: p.name, count };
    });
    return best.count > 0 ? best.name : (activePlans[0]?.name ?? '—');
  }, [plans, companiesByPlan, activePlans]);

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Desativar o plano "${plan.name}"?`)) return;
    try {
      await api.delete(`/admin/plans/${plan.id}`);
      load();
    } catch {
      alert('Erro ao desativar plano');
    }
  };

  /* Split active / inactive */
  const sortedPlans = [
    ...plans.filter(p => p.active).sort((a, b) => a.price - b.price),
    ...plans.filter(p => !p.active).sort((a, b) => a.price - b.price),
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Planos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configuração e performance</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary text-sm">
          <Plus size={14} /> Novo Plano
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CreditCard size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{activePlans.length}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">Planos Ativos</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {totalMRR === 0 ? 'R$ 0' : `R$ ${Math.round(totalMRR).toLocaleString('pt-BR')}`}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">Receita por Plano</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Trophy size={18} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 truncate">{maisVendido}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">Mais Vendido</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Valor Mensal</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Duração</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Limite Orç.</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Empresas</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Receita</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPlans.map(p => {
                const count = companiesByPlan[p.code] ?? 0;
                const receita = p.price * count;
                return (
                  <tr key={p.id} className={clsx('hover:bg-slate-50 transition-colors', !p.active && 'opacity-60')}>
                    <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-700">{fmtBRL(p.price)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDuration(p.maxStorage)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatLimit(p.maxProjects)}</td>
                    <td className="px-4 py-3 text-slate-600">{count}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {receita === 0 ? 'R$ 0' : `R$ ${Math.round(receita).toLocaleString('pt-BR')}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        p.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      )}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Editar"
                          onClick={() => setModal(p)}
                          className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-md transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {p.active && (
                          <button
                            title="Desativar"
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedPlans.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">Nenhum plano cadastrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <PlanModal
          plan={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
