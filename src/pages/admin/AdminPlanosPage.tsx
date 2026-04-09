import { useEffect, useState } from 'react';
import api from '../../services/api';
import { SubscriptionPlan } from '../../types';
import { Pencil, X, Loader2, CreditCard, Check } from 'lucide-react';

export default function AdminPlanosPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/admin/plans').then(r => setPlans(r.data.data ?? [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/admin/plans/${editing.id}`, editing);
      setEditing(null);
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar plano');
    } finally { setSaving(false); }
  };

  const planStyles: Record<string, { accent: string; badge: string; border: string }> = {
    BASIC: { accent: 'bg-slate-600', badge: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
    PRO: { accent: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
    ENTERPRISE: { accent: 'bg-violet-600', badge: 'bg-violet-100 text-violet-700', border: 'border-violet-200' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Planos SaaS</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configuração dos planos de assinatura da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(p => {
          const style = planStyles[p.name] ?? planStyles.BASIC;
          const features: string[] = JSON.parse(p.features || '[]');
          return (
            <div key={p.id} className={`card overflow-hidden border ${style.border}`}>
              <div className={`h-1.5 ${style.accent}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`badge text-xs mb-2 ${style.badge}`}>{p.name}</span>
                    <div className="text-2xl font-bold text-slate-800">
                      R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <span className="text-sm font-normal text-slate-500">/mês</span>
                    </div>
                  </div>
                  <button onClick={() => setEditing(p)} className="btn-ghost p-1.5 rounded-lg">
                    <Pencil size={15} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard size={14} className="text-slate-400" />
                    {p.maxUsers === -1 ? 'Usuários ilimitados' : `Até ${p.maxUsers} usuários`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard size={14} className="text-slate-400" />
                    {p.maxProjects === -1 ? 'Projetos ilimitados' : `Até ${p.maxProjects} projetos`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard size={14} className="text-slate-400" />
                    {p.maxStorage} GB de armazenamento
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <Check size={12} className="text-emerald-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Editar Plano: {editing.name}</h2>
              <button onClick={() => setEditing(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-3">
              <div>
                <label className="label">Preço (R$/mês)</label>
                <input className="input" type="number" step="0.01" value={editing.price}
                  onChange={e => setEditing(f => f ? { ...f, price: parseFloat(e.target.value) } : null)} />
              </div>
              <div>
                <label className="label">Máx. Usuários <span className="text-slate-400 font-normal">(-1 = ilimitado)</span></label>
                <input className="input" type="number" value={editing.maxUsers}
                  onChange={e => setEditing(f => f ? { ...f, maxUsers: parseInt(e.target.value) } : null)} />
              </div>
              <div>
                <label className="label">Máx. Projetos <span className="text-slate-400 font-normal">(-1 = ilimitado)</span></label>
                <input className="input" type="number" value={editing.maxProjects}
                  onChange={e => setEditing(f => f ? { ...f, maxProjects: parseInt(e.target.value) } : null)} />
              </div>
              <div>
                <label className="label">Armazenamento (GB)</label>
                <input className="input" type="number" value={editing.maxStorage}
                  onChange={e => setEditing(f => f ? { ...f, maxStorage: parseInt(e.target.value) } : null)} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />} Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
