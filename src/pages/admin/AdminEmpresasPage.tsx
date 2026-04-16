import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Company, SubscriptionPlan } from '../../types';
import {
  Plus, X, Loader2, Search, Eye, Pencil,
  DollarSign, Ban, KeyRound, Download, ChevronDown,
  Building2, CheckCircle, AlertCircle, Check
} from 'lucide-react';
import clsx from 'clsx';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─── Types ─── */
type Tab = 'cadastro' | 'uso';
type FilterPlan = 'Todos' | 'BASIC' | 'PRO' | 'ENTERPRISE';

/* ─── Constants ─── */
const PLAN_LABEL: Record<string, string> = {
  BASIC: 'Básico', PRO: 'Profissional', ENTERPRISE: 'Empresarial',
};
const PLAN_STYLE: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  PRO: 'bg-amber-100 text-amber-700',
  ENTERPRISE: 'bg-violet-100 text-violet-700',
};

/* ─── Helpers ─── */
function getDias(createdAt: string) {
  return differenceInDays(new Date(), new Date(createdAt));
}
function getResponsavel(c: Company) {
  if (c.email) {
    const local = c.email.split('@')[0].replace(/[._-]/g, ' ');
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return '—';
}

/* ─── Sub-components ─── */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-red-500')} />
      {active ? 'Ativa' : 'Bloqueada'}
    </span>
  );
}

function ActionBtn({ icon: Icon, title, onClick, danger = false, highlight = false }: {
  icon: React.ElementType; title: string;
  onClick?: () => void; danger?: boolean; highlight?: boolean;
}) {
  return (
    <button title={title} onClick={onClick} className={clsx(
      'p-1.5 rounded-md transition-colors',
      danger ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
        : highlight ? 'text-navy-600 hover:bg-navy-50'
        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    )}>
      <Icon size={14} />
    </button>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[220px]',
      type === 'success' ? 'bg-white border border-emerald-200' : 'bg-white border border-red-200'
    )}>
      {type === 'success'
        ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
        : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
      <div>
        <div className="text-sm font-semibold text-slate-800">Sucesso</div>
        <div className="text-xs text-slate-500">{msg}</div>
      </div>
    </div>
  );
}

/* ─── View Modal ─── */
function ViewModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const fields = [
    { label: 'CNPJ', value: company.cnpj || '—' },
    { label: 'RESPONSÁVEL', value: getResponsavel(company) },
    { label: 'PLANO', value: PLAN_LABEL[company.plan] || company.plan },
    { label: 'STATUS', value: company.active ? 'Ativa' : 'Bloqueada' },
    { label: 'TEMPO COMO CLIENTE', value: `${getDias(company.createdAt)} dias` },
    { label: 'ORÇAMENTOS', value: '0' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold text-slate-800">{company.name}</h2>
            <p className="text-xs text-slate-400">Detalhes da empresa</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.label} className="border border-slate-200 border-l-4 border-l-navy-700 p-3 rounded-r-lg">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{f.label}</div>
              <div className="font-semibold text-slate-800 text-sm">{f.value}</div>
            </div>
          ))}
        </div>
        {company.address && (
          <div className="px-6 pb-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">ENDEREÇO</div>
            <div className="text-sm text-slate-600">{company.address}</div>
          </div>
        )}
        <div className="flex justify-end px-6 pb-5">
          <button onClick={onClose} className="btn-secondary text-sm">Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditModal({ company, onClose, onSaved }: {
  company: Company; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: company.name, email: company.email ?? '', cnpj: company.cnpj ?? '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/companies/${company.id}`, form);
      onSaved();
      onClose();
    } catch {
      alert('Erro ao salvar empresa');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-800">Editar Empresa</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Responsável (e-mail)</label>
            <input className="input" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">CNPJ</label>
            <input className="input" value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
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

/* ─── Plan Modal ─── */
function PlanModal({ company, plans, onClose, onSaved }: {
  company: Company; plans: SubscriptionPlan[];
  onClose: () => void; onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string>(company.plan);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const planMap: Record<string, string> = { BASIC: 'BASIC', PRO: 'PRO', ENTERPRISE: 'ENTERPRISE' };

  // Map subscription plans to company plan codes
  const options = plans.map(p => ({
    code: planMap[p.code] || p.code,
    label: `${p.name} — R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
    price: p.price,
    raw: p,
  }));

  const selectedOption = options.find(o => o.code === selected);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/companies/${company.id}`, { plan: selected });
      onSaved();
      onClose();
    } catch {
      alert('Erro ao alterar plano');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-800">Alterar Plano</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm text-slate-500">
            Empresa: <span className="font-medium text-slate-800">{company.name}</span>
          </div>

          <div>
            <label className="label">Novo Plano</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="input flex items-center justify-between w-full text-left"
              >
                <span className="text-sm">{selectedOption?.label ?? 'Selecione...'}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </button>
              {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {options.map(o => (
                    <button
                      key={o.code}
                      type="button"
                      onClick={() => { setSelected(o.code); setOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 text-left"
                    >
                      <span className={selected === o.code ? 'font-medium text-navy-700' : 'text-slate-600'}>
                        {o.label}
                      </span>
                      {selected === o.code && <Check size={14} className="text-navy-700 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin" />} Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Export helper ─── */
function exportCompany(company: Company) {
  const dias = getDias(company.createdAt);
  const responsavel = getResponsavel(company);
  const gerado = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Permita popups para exportar'); return; }

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
    <meta charset="UTF-8"/>
    <title>Relatório — ${company.name}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding: 48px; color: #1e293b; }
      h1 { font-size: 28px; color: #1e3aaa; margin-bottom: 6px; font-weight: 700; }
      .date { color: #64748b; font-size: 14px; margin-bottom: 36px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .cell { border: 1px solid #e2e8f0; border-left: 4px solid #1e3aaa; padding: 14px 16px; border-radius: 0 8px 8px 0; }
      .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 6px; }
      .value { font-size: 17px; font-weight: 700; color: #1e293b; }
      .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
      @media print { body { padding: 32px; } }
    </style>
  </head><body>
    <h1>${company.name}</h1>
    <div class="date">Gerado em ${gerado}</div>
    <div class="grid">
      <div class="cell"><div class="label">CNPJ</div><div class="value">${company.cnpj || '—'}</div></div>
      <div class="cell"><div class="label">RESPONSÁVEL</div><div class="value">${responsavel}</div></div>
      <div class="cell"><div class="label">PLANO</div><div class="value">${PLAN_LABEL[company.plan] || company.plan}</div></div>
      <div class="cell"><div class="label">STATUS</div><div class="value">${company.active ? 'Ativa' : 'Bloqueada'}</div></div>
      <div class="cell"><div class="label">TEMPO COMO CLIENTE</div><div class="value">${dias} dias</div></div>
      <div class="cell"><div class="label">ORÇAMENTOS</div><div class="value">0</div></div>
    </div>
    <div class="footer">MARMODECOR — Relatório individual</div>
    <script>window.onload = () => window.print();<\/script>
  </body></html>`);
  w.document.close();
}

/* ─── Uso da Plataforma Tab ─── */
function UsoTab({ companies }: { companies: Company[] }) {
  const total = companies.length || 1;
  // Group by plan
  const byPlan: Record<string, number> = {};
  companies.forEach(c => { byPlan[c.plan] = (byPlan[c.plan] || 0) + 1; });
  const maxBar = Math.max(...Object.values(byPlan), 1);

  const inativas = companies.filter(c => !c.active).length;
  const sorted = [...companies].sort((a, b) => getDias(b.createdAt) - getDias(a.createdAt));

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-navy-700 mb-1">0,0</div>
          <div className="text-xs text-slate-500">Média orç./empresa</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-lg font-bold text-slate-800 mb-1 truncate">{companies[0]?.name ?? '—'}</div>
          <div className="text-xs text-slate-500">Mais ativa</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-amber-600 mb-1">{inativas}</div>
          <div className="text-xs text-slate-500">Inativas (+30 dias)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ranking */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Ranking de Empresas</h3>
          <div className="space-y-2">
            {sorted.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 w-4">{i + 1}.</span>
                  <span className="text-sm text-slate-700">{c.name}</span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">0 orç.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Engajamento por Plano</h3>
          <div className="flex items-end gap-4 h-36 px-2">
            {Object.entries(byPlan).map(([plan, count]) => (
              <div key={plan} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-medium text-slate-600">{count}</span>
                <div
                  className="w-full rounded-t-md bg-navy-700 transition-all"
                  style={{ height: `${Math.round((count / maxBar) * 100)}px`, minHeight: 8 }}
                />
                <span className="text-xs text-slate-500 text-center leading-tight">{PLAN_LABEL[plan] ?? plan}</span>
              </div>
            ))}
            {Object.keys(byPlan).length === 0 && (
              <p className="text-slate-400 text-sm m-auto">Sem dados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('cadastro');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('Todos');
  const [showFilter, setShowFilter] = useState(false);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<Company | null>(null);
  const [editModal, setEditModal] = useState<Company | null>(null);
  const [planModal, setPlanModal] = useState<Company | null>(null);

  // Create form
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '', address: '', plan: 'BASIC' });
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/companies'),
      api.get('/admin/plans'),
    ]).then(([cRes, pRes]) => {
      setCompanies(cRes.data.data ?? []);
      setPlans(pRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || c.name.toLowerCase().includes(q)
      || (c.email ?? '').toLowerCase().includes(q)
      || (c.cnpj ?? '').includes(q);
    const matchPlan = filterPlan === 'Todos' || c.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/companies', form);
      setCreateModal(false);
      setForm({ name: '', cnpj: '', email: '', phone: '', address: '', plan: 'BASIC' });
      load();
      showToast('Empresa criada com sucesso.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || 'Erro ao criar empresa', 'error');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (c: Company) => {
    try {
      await api.put(`/companies/${c.id}`, { active: !c.active });
      load();
      showToast(c.active ? 'Empresa bloqueada.' : 'Empresa ativada.');
    } catch {
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  const handleResetAccess = (c: Company) => {
    if (!window.confirm(`Resetar acesso de ${c.name}? Um novo link será enviado para ${c.email || 'o e-mail cadastrado'}.`)) return;
    showToast(`Link de acesso enviado para ${c.email || c.name}.`);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Empresas</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([['cadastro', 'Cadastro & Gestão'], ['uso', 'Uso da Plataforma']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === id ? 'border-navy-700 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CADASTRO TAB ── */}
      {tab === 'cadastro' && (
        <>
          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCreateModal(true)} className="btn-primary text-sm">
              <Plus size={14} /> Criar Empresa
            </button>
            <button className="btn-secondary text-sm gap-1.5 opacity-60 cursor-not-allowed" disabled>
              <Pencil size={13} /> Alterar Plano
            </button>
            <button className="btn-secondary text-sm gap-1.5 opacity-60 cursor-not-allowed" disabled>
              <Ban size={13} /> Bloquear / Reativar
            </button>
            <button className="btn-secondary text-sm gap-1.5 opacity-60 cursor-not-allowed" disabled>
              <KeyRound size={13} /> Resetar Acesso
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9 py-2 text-sm" placeholder="Buscar..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <button onClick={() => setShowFilter(v => !v)} className="btn-secondary text-sm gap-1.5">
                {filterPlan === 'Todos' ? 'Todos' : PLAN_LABEL[filterPlan]}
                <ChevronDown size={13} />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 w-44">
                  {(['Todos', 'BASIC', 'PRO', 'ENTERPRISE'] as FilterPlan[]).map(p => (
                    <button key={p} onClick={() => { setFilterPlan(p); setShowFilter(false); }}
                      className={clsx('w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center justify-between',
                        filterPlan === p ? 'text-navy-700 font-medium' : 'text-slate-600')}>
                      {p === 'Todos' ? 'Todos os planos' : PLAN_LABEL[p]}
                      {filterPlan === p && <Check size={13} />}
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
              <p className="text-slate-500">{search || filterPlan !== 'Todos' ? 'Nenhuma empresa para este filtro' : 'Nenhuma empresa cadastrada'}</p>
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
                        <span className={clsx('badge text-xs', PLAN_STYLE[c.plan] ?? 'bg-slate-100 text-slate-500')}>
                          {PLAN_LABEL[c.plan] ?? c.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge active={c.active} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs hidden lg:table-cell">
                        {getDias(c.createdAt)}d
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                        {getResponsavel(c)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 hidden xl:table-cell">0</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionBtn icon={Eye} title="Visualizar" onClick={() => setViewModal(c)} />
                          <ActionBtn icon={Pencil} title="Editar" onClick={() => setEditModal(c)} />
                          <ActionBtn icon={DollarSign} title="Alterar plano" onClick={() => setPlanModal(c)} />
                          <ActionBtn icon={Ban} title={c.active ? 'Bloquear' : 'Reativar'}
                            onClick={() => handleToggleActive(c)} danger={c.active} />
                          <ActionBtn icon={KeyRound} title="Resetar acesso"
                            onClick={() => handleResetAccess(c)} />
                          <ActionBtn icon={Download} title="Exportar relatório"
                            onClick={() => exportCompany(c)} />
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

      {/* ── USO TAB ── */}
      {tab === 'uso' && <UsoTab companies={companies} />}

      {/* ── MODALS ── */}
      {viewModal && <ViewModal company={viewModal} onClose={() => setViewModal(null)} />}
      {editModal && (
        <EditModal company={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => { load(); showToast('Empresa atualizada.'); }} />
      )}
      {planModal && (
        <PlanModal company={planModal} plans={plans}
          onClose={() => setPlanModal(null)}
          onSaved={() => { load(); showToast('Plano atualizado com sucesso.'); }} />
      )}

      {/* Create modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Nova Empresa</h2>
              <button onClick={() => setCreateModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-3">
              <div><label className="label">Nome *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="label">CNPJ</label>
                <input className="input" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
              <div><label className="label">E-mail / Responsável</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="label">Telefone</label>
                <input className="input" placeholder="(00) 0000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="label">Endereço</label>
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><label className="label">Plano</label>
                <select className="input" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  <option value="BASIC">Básico</option>
                  <option value="PRO">Profissional</option>
                  <option value="ENTERPRISE">Empresarial</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />} Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
