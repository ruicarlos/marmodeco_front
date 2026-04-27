import { useEffect, useState } from 'react';
import api from '../services/api';
import { Seller } from '../types';
import {
  Plus, Pencil, Trash2, X, Save, Loader2,
  UserCheck, CheckCircle, AlertCircle, Phone, Mail, Percent,
} from 'lucide-react';
import clsx from 'clsx';

type Form = { name: string; email: string; phone: string; commission: string };
const empty: Form = { name: '', email: '', phone: '', commission: '0' };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[220px] bg-white',
      type === 'success' ? 'border border-emerald-200' : 'border border-red-200'
    )}>
      {type === 'success'
        ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
        : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
      <p className="text-sm text-slate-700">{msg}</p>
    </div>
  );
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);

  const [showForm,   setShowForm  ] = useState(false);
  const [editId,     setEditId    ] = useState<string | null>(null);
  const [form,       setForm      ] = useState<Form>(empty);
  const [toast,      setToast     ] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/sellers').then(r => setSellers(r.data.data ?? [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit   = (s: Seller) => {
    setForm({ name: s.name, email: s.email ?? '', phone: s.phone ?? '', commission: String(s.commission) });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/sellers/${editId}`, form);
        setToast({ msg: 'Vendedor atualizado.', type: 'success' });
      } else {
        await api.post('/sellers', form);
        setToast({ msg: 'Vendedor cadastrado.', type: 'success' });
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ msg: msg || 'Erro ao salvar', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o vendedor "${name}"?`)) return;
    try {
      await api.delete(`/sellers/${id}`);
      setToast({ msg: 'Vendedor excluído.', type: 'success' });
      load();
    } catch {
      setToast({ msg: 'Erro ao excluir vendedor.', type: 'error' });
    }
  };

  const handleToggleActive = async (s: Seller) => {
    await api.put(`/sellers/${s.id}`, { active: !s.active });
    load();
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendedores</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {sellers.filter(s => s.active).length} ativo{sellers.filter(s => s.active).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} /> Novo Vendedor
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">
              {editId ? 'Editar Vendedor' : 'Novo Vendedor'}
            </h3>
            <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="label">Nome *</label>
              <input className="input" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <label className="label">Comissão (%)</label>
              <div className="relative">
                <input className="input pr-8" type="number" step="0.1" min="0" max="100"
                  value={form.commission}
                  onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} />
                <Percent size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editId ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="card p-12 text-center">
          <UserCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum vendedor cadastrado</p>
          <p className="text-slate-400 text-sm mt-1">Clique em "Novo Vendedor" para começar</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Vendedor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Contato</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Comissão</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map(s => (
                <tr key={s.id} className={clsx('hover:bg-slate-50 transition-colors', !s.active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.name}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail size={11} /> {s.email}
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone size={11} /> {s.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-navy-700">
                      {s.commission > 0 ? `${s.commission}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleActive(s)}
                      className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                        s.active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      )}>
                      <span className={clsx('w-1.5 h-1.5 rounded-full', s.active ? 'bg-emerald-500' : 'bg-slate-400')} />
                      {s.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
