import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Company } from '../../types';
import { Plus, X, Loader2, Building2 } from 'lucide-react';
import clsx from 'clsx';

const PLAN_MAP: Record<string, string> = { BASIC: 'Básico', PRO: 'Profissional', ENTERPRISE: 'Empresarial' };

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '', plan: 'BASIC' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/companies').then(r => setCompanies(r.data.data ?? [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/companies', form);
      setModal(false);
      setForm({ name: '', cnpj: '', email: '', phone: '', plan: 'BASIC' });
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar empresa');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerenciamento de empresas clientes da plataforma</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm">
          <Plus size={15} /> Nova Empresa
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : companies.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Nenhuma empresa cadastrada</p>
          <button onClick={() => setModal(true)} className="btn-primary text-sm mt-4">
            <Plus size={15} /> Cadastrar Empresa
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{companies.length} empresa(s) cadastrada(s)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map(c => (
              <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center">
                    <Building2 size={18} className="text-navy-600" />
                  </div>
                  <span className={clsx(
                    'badge text-xs',
                    c.plan === 'ENTERPRISE' ? 'bg-violet-100 text-violet-700'
                      : c.plan === 'PRO' ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  )}>
                    {PLAN_MAP[c.plan] ?? c.plan}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{c.name}</h3>
                {c.cnpj && <p className="text-xs text-slate-500">CNPJ: {c.cnpj}</p>}
                {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Nova Empresa</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-3">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">CNPJ</label>
                <input className="input" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" placeholder="(00) 0000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Plano</label>
                <select className="input" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  <option value="BASIC">Básico</option>
                  <option value="PRO">Profissional</option>
                  <option value="ENTERPRISE">Empresarial</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />} Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
