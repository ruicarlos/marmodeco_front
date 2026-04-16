import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { Company } from '../../types';
import { AlertTriangle, Activity, Search, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

/* ─── Types ─── */
interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    company?: { id: string; name: string } | null;
  } | null;
}

/* ─── Helpers ─── */
const ENTITY_LABEL: Record<string, string> = {
  Company: 'Empresa',
  company: 'Empresa',
  Budget: 'Orçamento',
  budget: 'Orçamento',
  Project: 'Projeto',
  project: 'Projeto',
  User: 'Usuário',
  user: 'Usuário',
  Material: 'Material',
  material: 'Material',
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'criada',
  create: 'criada',
  UPDATE: 'atualizada',
  update: 'atualizada',
  DELETE: 'removida',
  delete: 'removida',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

function formatAction(log: AuditLog): string {
  const entity = ENTITY_LABEL[log.entity] ?? log.entity;

  // Status transitions stored directly as action (e.g., "em_analise", "aprovado")
  const knownActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'create', 'update', 'delete', 'login', 'logout'];
  if (!knownActions.includes(log.action)) {
    return `${entity} ${log.action}`;
  }

  // Budget UPDATE may carry status in details
  if (['UPDATE', 'update'].includes(log.action) && log.entity?.toLowerCase() === 'budget' && log.details) {
    try {
      const d = JSON.parse(log.details);
      const status = d.status ?? d.newStatus ?? d.toStatus;
      if (status) return `Orçamento ${status}`;
    } catch { /* ignore */ }
  }

  const action = ACTION_LABEL[log.action] ?? log.action;
  return `${entity} ${action}`;
}

function getEntityColor(entity: string): string {
  switch (entity?.toLowerCase()) {
    case 'company':  return 'bg-blue-500';
    case 'budget':   return 'bg-emerald-500';
    case 'project':  return 'bg-violet-500';
    case 'user':     return 'bg-amber-500';
    default:         return 'bg-slate-400';
  }
}

function getCompanyName(log: AuditLog, companyMap: Record<string, string>): string {
  // If the entity itself is a company, look up by entityId
  if (log.entity?.toLowerCase() === 'company' && log.entityId) {
    const name = companyMap[log.entityId];
    if (name) return name;
    // Try details
    if (log.details) {
      try {
        const d = JSON.parse(log.details);
        if (d.name) return d.name;
      } catch { /* ignore */ }
    }
  }
  // Otherwise use user's company
  return log.user?.company?.name ?? log.user?.name ?? '—';
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

/* ─── Filter options ─── */
const FILTER_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Empresas', value: 'company' },
  { label: 'Orçamentos', value: 'budget' },
  { label: 'Projetos', value: 'project' },
  { label: 'Usuários', value: 'user' },
];

/* ─── Main Page ─── */
export default function AdminOperacoesPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [alerts, setAlerts] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/audit-logs?limit=200'),
      api.get('/companies'),
      api.get('/admin/alerts'),
    ]).then(([logsRes, companiesRes, alertsRes]) => {
      setLogs(logsRes.data.data ?? []);
      setCompanies(companiesRes.data.data ?? []);
      setAlerts(alertsRes.data.data ?? []);
    }).catch(() => {
      // alerts endpoint may not exist yet — fallback: compute from companies
      Promise.all([
        api.get('/admin/audit-logs?limit=200'),
        api.get('/companies'),
      ]).then(([logsRes, companiesRes]) => {
        setLogs(logsRes.data.data ?? []);
        const comps: Company[] = companiesRes.data.data ?? [];
        setCompanies(comps);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        setAlerts(comps.filter(c => c.active && new Date(c.updatedAt ?? c.createdAt).getTime() < thirtyDaysAgo));
      });
    }).finally(() => setLoading(false));
  }, []);

  /* Company id → name map */
  const companyMap = useMemo(() => {
    const m: Record<string, string> = {};
    companies.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [companies]);

  /* Enriched logs */
  const enrichedLogs = useMemo(() => logs.map(log => ({
    ...log,
    _label: formatAction(log),
    _company: getCompanyName(log, companyMap),
    _color: getEntityColor(log.entity),
  })), [logs, companyMap]);

  /* Filtered timeline */
  const filtered = useMemo(() => enrichedLogs.filter(log => {
    const matchEntity = filterEntity ? log.entity?.toLowerCase() === filterEntity : true;
    const matchSearch = search
      ? log._label.toLowerCase().includes(search.toLowerCase()) ||
        log._company.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchEntity && matchSearch;
  }), [enrichedLogs, filterEntity, search]);

  const filterLabel = FILTER_OPTIONS.find(o => o.value === filterEntity)?.label ?? 'Todos';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Operações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Central de saúde da plataforma</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : (
        <>
          {/* ── Painel de Alertas ── */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="font-semibold text-slate-800 text-sm">Painel de Alertas</span>
              </div>
              {alerts.length > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {alerts.length}
                </span>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Nenhum alerta no momento
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {alerts.map(company => (
                  <div key={company.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Empresa inativa há +{daysSince(company.updatedAt ?? company.createdAt)} dias
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{company.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Linha do Tempo ── */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Activity size={16} className="text-blue-500" />
              <span className="font-semibold text-slate-800 text-sm">Linha do Tempo</span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent"
                  placeholder="Filtrar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Entity filter dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors min-w-[110px] justify-between"
                  onClick={() => setDropdownOpen(o => !o)}
                >
                  <span>{filterLabel}</span>
                  <ChevronDown size={14} className={clsx('transition-transform', dropdownOpen && 'rotate-180')} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                    {FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                          filterEntity === opt.value ? 'text-navy-700 font-medium' : 'text-slate-700'
                        )}
                        onClick={() => { setFilterEntity(opt.value); setDropdownOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline list */}
            {filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">
                Nenhum evento encontrado
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map(log => (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors">
                    <span className={clsx('w-2 h-2 rounded-full shrink-0', log._color)} />
                    <span className="text-sm text-slate-700 flex-1">{log._label}</span>
                    <span className="text-sm text-slate-500 text-right max-w-[180px] truncate">
                      {log._company}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                      {fmtDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
