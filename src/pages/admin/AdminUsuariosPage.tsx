import { useEffect, useState } from 'react';
import api from '../../services/api';
import { User } from '../../types';
import { Plus, X, Loader2, Users } from 'lucide-react';

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'GESTOR' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data.data ?? [])).finally(() => setLoading(false));
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
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar usuário');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await api.put(`/users/${id}`, { active: !active });
    load();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerenciamento de usuários da plataforma</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm">
          <Plus size={15} /> Novo Usuário
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{users.length} usuário(s)</p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">E-mail</th>
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
                      <span className={u.role === 'ADMIN'
                        ? 'badge bg-violet-100 text-violet-700'
                        : 'badge bg-slate-100 text-slate-600'}>
                        {u.role === 'ADMIN' ? 'Admin' : 'Gestor'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={u.active ? 'badge-green' : 'badge-red'}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggle(u.id, u.active)}
                        className="text-xs text-slate-400 hover:text-slate-700 underline"
                      >
                        {u.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Novo Usuário</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Senha *</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label className="label">Perfil</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="GESTOR">Gestor (cliente)</option>
                  <option value="ADMIN">Administrador SaaS</option>
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
