import { useEffect, useState } from 'react';
import api from '../services/api';
import { User, AuditLog, SubscriptionPlan, Company } from '../types';
import { Users, Building2, Shield, CreditCard, Loader2, Plus, X, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

type Tab = 'users' | 'companies' | 'plans' | 'logs';

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'GESTOR' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/users').then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      setModal(false);
      setForm({ name: '', email: '', password: '', role: 'GESTOR' });
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await api.put(`/users/${id}`, { active: !active });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{users.length} usuário(s)</p>
        <button onClick={() => setModal(true)} className="btn-primary text-xs"><Plus size={13} /> Novo Usuário</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Email</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Perfil</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={u.role === 'ADMIN' ? 'badge bg-purple-100 text-purple-700' : 'badge-gray'}>
                    {u.role === 'ADMIN' ? 'Admin' : 'Gestor'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={u.active ? 'badge-green' : 'badge-red'}>{u.active ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleToggle(u.id, u.active)} className="text-xs text-slate-500 hover:text-slate-700 underline">
                    {u.active ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Novo Usuário</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="label">Senha *</label><input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
              <div>
                <label className="label">Perfil</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="GESTOR">Gestor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
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

function CompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '', plan: 'BASIC' });
  const [saving, setSaving] = useState(false);

  const load = () => { api.get('/companies').then(r => setCompanies(r.data.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/companies', form);
      setModal(false);
      load();
    } finally { setSaving(false); }
  };

  const PLAN_MAP: Record<string, string> = { BASIC: 'Básico', PRO: 'Profissional', ENTERPRISE: 'Empresarial' };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-slate-500">{companies.length} empresa(s)</p>
        <button onClick={() => setModal(true)} className="btn-primary text-xs"><Plus size={13} /> Nova Empresa</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map(c => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{c.name}</h3>
                {c.cnpj && <p className="text-xs text-slate-500">CNPJ: {c.cnpj}</p>}
                {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
              </div>
              <span className={clsx('badge', c.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' : c.plan === 'PRO' ? 'bg-amber-100 text-amber-700' : 'badge-gray')}>
                {PLAN_MAP[c.plan]}
              </span>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold">Nova Empresa</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-3">
              <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="label">CNPJ</label><input className="input" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
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
                <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 size={13} className="animate-spin" />} Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/admin/plans').then(r => setPlans(r.data.data)).finally(() => setLoading(false)); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/admin/plans/${editing.id}`, editing);
      setEditing(null);
      api.get('/admin/plans').then(r => setPlans(r.data.data));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map(p => (
        <div key={p.id} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-slate-800">{p.name}</h3>
            <button onClick={() => setEditing(p)} className="btn-ghost p-1"><Pencil size={14} /></button>
          </div>
          <div className="text-2xl font-bold text-navy-800 mb-3">
            R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-sm font-normal text-slate-500">/mês</span>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>👥 {p.maxUsers === -1 ? 'Usuários ilimitados' : `Até ${p.maxUsers} usuários`}</li>
            <li>📁 {p.maxProjects === -1 ? 'Projetos ilimitados' : `Até ${p.maxProjects} projetos`}</li>
            <li>💾 {p.maxStorage} GB de armazenamento</li>
            {JSON.parse(p.features || '[]').slice(0, 3).map((f: string, i: number) => (
              <li key={i}>✓ {f}</li>
            ))}
          </ul>
        </div>
      ))}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold">Editar Plano: {editing.name}</h2>
              <button onClick={() => setEditing(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-3">
              <div><label className="label">Preço (R$/mês)</label><input className="input" type="number" step="0.01" value={editing.price} onChange={e => setEditing(f => f ? { ...f, price: parseFloat(e.target.value) } : null)} /></div>
              <div><label className="label">Máx. Usuários (-1 = ilimitado)</label><input className="input" type="number" value={editing.maxUsers} onChange={e => setEditing(f => f ? { ...f, maxUsers: parseInt(e.target.value) } : null)} /></div>
              <div><label className="label">Máx. Projetos (-1 = ilimitado)</label><input className="input" type="number" value={editing.maxProjects} onChange={e => setEditing(f => f ? { ...f, maxProjects: parseInt(e.target.value) } : null)} /></div>
              <div><label className="label">Armazenamento (GB)</label><input className="input" type="number" value={editing.maxStorage} onChange={e => setEditing(f => f ? { ...f, maxStorage: parseInt(e.target.value) } : null)} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 size={13} className="animate-spin" />} Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin/audit-logs').then(r => setLogs(r.data.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" /></div>;

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3 font-medium text-slate-600">Usuário</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Ação</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Entidade</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Data/Hora</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map(l => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="px-5 py-2.5 text-slate-700">{l.user?.name ?? 'Sistema'}</td>
              <td className="px-4 py-2.5">
                <span className="badge bg-blue-50 text-blue-700 text-xs">{l.action}</span>
              </td>
              <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{l.entity}</td>
              <td className="px-4 py-2.5 text-slate-400 hidden lg:table-cell text-xs">
                {format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">Nenhum log registrado</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');

  const tabs = [
    { id: 'users' as Tab, label: 'Usuários', icon: Users },
    { id: 'companies' as Tab, label: 'Empresas', icon: Building2 },
    { id: 'plans' as Tab, label: 'Planos SaaS', icon: CreditCard },
    { id: 'logs' as Tab, label: 'Logs de Auditoria', icon: Shield },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Administração</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerenciamento global da plataforma MarmoDecor</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
              tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'companies' && <CompaniesTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}
