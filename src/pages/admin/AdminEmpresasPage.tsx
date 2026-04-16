import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Company } from '../../types';
import {
  Plus, X, Loader2, Search, Eye, Pencil,
  DollarSign, Ban, KeyRound, Download, ChevronDown,
  Building2
} from 'lucide-react';
import clsx from 'clsx';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'cadastro' | 'uso';
type FilterPlan = 'Todos' | 'BASIC' | 'PRO' | 'ENTERPRISE';

const PLAN_LABEL: Record<string, string> = {
  BASIC: 'Básico',
  PRO: 'Profissional',
  ENTERPRISE: 'Empresarial',
};

const PLAN_STYLE: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  PRO: 'bg-amber-100 text-amber-700',
  ENTERPRISE: 'bg-violet-100 text-violet-700',
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-red-500')} />
      {active ? 'Ativa' : 'Inativa'}
    </span>
  );
}

function ActionButton({ icon: Icon, title, onClick, danger = false }: {
  icon: React.ElementType;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={clsx(
        'p-1.5 rounded-md transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
      )}
    >
      <Icon size={14} />
    </button>
  );
}

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('cadastro');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('Todos');
  const [showFilter, setShowFilter] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '', address: '', plan: 'BASIC' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/companies').then(r => setCompanies(r.data.data ?? [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = companies.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj ?? '').includes(search);
    const matchPlan = filterPlan === 'Todos' || c.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/companies', form);
      setModal(false);
      setForm({ name: '', cnpj: '', email: '', phone: '', address: '', plan: 'BASIC' });
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar empresa');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    if (!window.confirm(`${active ? 'Bloquear' : 'Reativar'} esta empresa?`)) return;
    await api.put(`/companies/${id}`, { active: !active });
    load();
  };

  const getDias = (createdAt: string) => {
    return differenceInDays(new Date(), new Date(createdAt));
  };

  const getResponsavel = (c: Company) => {
    if (c.email) {
      const local = c.email.split('@')[0];
      return local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]/g, ' ');
    }
    return '—';
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Empresas</h1>
        <p className="text-slate-500 text-sm mt-0.5">{companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'cadastro' as Tab, label: 'Cadastro & Gestão' },
          { id: 'uso' as Tab, label: 'Uso da Plataforma' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-navy-700 text-navy-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cadastro' && (
        <>
          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModal(true)} className="btn-primary text-sm">
              <Plus size={14} /> Criar Empresa
            </button>
            <button className="btn-secondary text-sm gap-1.5">
              <Pencil size={13} /> Alterar Plano
            </button>
            <button className="btn-secondary text-sm gap-1.5">
              <Ban size={13} /> Bloquear / Reativar
            </button>
            <button className="btn-secondary text-sm gap-1.5">
              <KeyRound size={13} /> Resetar Acesso
            </button>
          </div>

          {/* Search & filter */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 py-2 text-sm"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(v => !v)}
                className="btn-secondary text-sm gap-1.5"
              >
                {filterPlan === 'Todos' ? 'Todos' : PLAN_LABEL[filterPlan]}
                <ChevronDown size={13} />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 w-40">
                  {(['Todos', 'BASIC', 'PRO', 'ENTERPRISE'] as FilterPlan[]).map(p => (
                    <button
                      key={p}
                      onClick={() => { setFilterPlan(p); setShowFilter(false); }}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50',
                        filterPlan === p ? 'text-navy-700 font-medium' : 'text-slate-600'
                      )}
                    >
                      {p === 'Todos' ? 'Todos' : PLAN_LABEL[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">{search || filterPlan !== 'Todos' ? 'Nenhuma empresa encontrada para este filtro' : 'Nenhuma empresa cadastrada'}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Plano</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Entrada</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Dias</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Responsável</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide hidden xl:table-cell">Orçamentos</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.name}</div>
                        {c.cnpj && <div className="text-xs text-slate-400 mt-0.5">{c.cnpj}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {c.plan
                          ? <span className={clsx('badge text-xs', PLAN_STYLE[c.plan])}>{PLAN_LABEL[c.plan]}</span>
                          : <span className="text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={c.active} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs hidden lg:table-cell">
                        {getDias(c.createdAt)}d
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm hidden lg:table-cell">
                        {getResponsavel(c)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 hidden xl:table-cell">
                        0
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionButton icon={Eye} title="Visualizar" />
                          <ActionButton icon={Pencil} title="Editar" />
                          <ActionButton icon={DollarSign} title="Alterar plano" />
                          <ActionButton icon={Ban} title={c.active ? 'Bloquear' : 'Reativar'} onClick={() => handleToggle(c.id, c.active)} danger={c.active} />
                          <ActionButton icon={KeyRound} title="Resetar acesso" />
                          <ActionButton icon={Download} title="Exportar dados" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'uso' && (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-semibold text-slate-700 mb-1">Uso da Plataforma</h3>
          <p className="text-slate-400 text-sm">Métricas de uso por empresa — disponível em breve</p>
        </div>
      )}

      {/* Modal Criar Empresa */}
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
                <label className="label">Endereço</label>
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
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
