import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Project } from '../types';
import { Plus, Search, FolderOpen, Trash2, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Rascunho', cls: 'badge-gray' },
  IN_PROGRESS: { label: 'Em andamento', cls: 'badge-blue' },
  COMPLETED: { label: 'Concluído', cls: 'badge-green' },
  CANCELLED: { label: 'Cancelado', cls: 'badge-red' },
};

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function NewProjectModal({ open, onClose, onSaved }: ProjectModalProps) {
  const [form, setForm] = useState({ name: '', description: '', clientName: '', clientEmail: '', clientPhone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/projects', form);
      onSaved();
      onClose();
      setForm({ name: '', description: '', clientName: '', clientEmail: '', clientPhone: '' });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Novo Projeto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div>
            <label className="label">Nome do Projeto *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Residencial Vila Verde - Cozinha" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome do Cliente</label>
              <input className="input" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="(85) 9 9999-9999" />
            </div>
          </div>
          <div>
            <label className="label">E-mail do Cliente</label>
            <input className="input" type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="cliente@email.com" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/projects').then(res => setProjects(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este projeto? Todos os arquivos e orçamentos serão removidos.')) return;
    setDeleting(id);
    await api.delete(`/projects/${id}`).catch(console.error);
    setDeleting(null);
    load();
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.clientName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projetos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{projects.length} projeto(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome ou cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-navy-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum projeto encontrado</p>
          <p className="text-slate-400 text-sm mt-1">Crie seu primeiro projeto para começar</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">
            <Plus size={15} /> Criar Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{project.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{project.clientName || 'Sem cliente'}</p>
                </div>
                <span className={clsx('ml-2 shrink-0', STATUS_MAP[project.status]?.cls ?? 'badge-gray')}>
                  {STATUS_MAP[project.status]?.label}
                </span>
              </div>

              {project.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-3 mt-3">
                <span>{project._count?.files ?? 0} arquivo(s)</span>
                <span>·</span>
                <span>{project._count?.rooms ?? 0} ambiente(s)</span>
                <span>·</span>
                <span>{project._count?.budgets ?? 0} orçamento(s)</span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400">
                  {format(new Date(project.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                    disabled={deleting === project.id}
                  >
                    {deleting === project.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                  <Link to={`/projetos/${project.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                    <Eye size={13} /> Abrir
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}
