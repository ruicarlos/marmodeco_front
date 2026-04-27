import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Project, Room } from '../types';
import {
  ArrowLeft, Upload, Plus, Trash2, Edit2, Save, X,
  FileText, Layers, DollarSign, Loader2, File, CheckCircle2, Download, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PROJECT_TYPE_OPTIONS = [
  { value: 'RESIDENCIAL', label: 'Residencial' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'OUTRO', label: 'Outro' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [exportingDXF, setExportingDXF] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ projectType: '', deadline: '' });
  const [generatingBudget, setGeneratingBudget] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', area: '', perimeter: '', notes: '' });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/projects/${id}`).then(res => {
      const p = res.data.data;
      setProject(p);
      setNewStatus(p.status);
      setDetailsForm({
        projectType: p.projectType || '',
        deadline: p.deadline ? p.deadline.substring(0, 10) : '',
      });
    }).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(`/projects/${id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadMessage(res.data.message || 'Arquivo enviado com sucesso');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleStatusSave = async () => {
    await api.put(`/projects/${id}`, { status: newStatus });
    setEditingStatus(false);
    load();
  };

  const handleAutoBudget = async () => {
    setGeneratingBudget(true);
    try {
      const res = await api.post(`/projects/${id}/auto-budget`);
      navigate(`/orcamentos/${res.data.data.id}`);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao gerar orçamento');
    } finally {
      setGeneratingBudget(false);
    }
  };

  const handleDetailsSave = async () => {
    await api.put(`/projects/${id}`, {
      projectType: detailsForm.projectType || null,
      deadline: detailsForm.deadline ? new Date(detailsForm.deadline).toISOString() : null,
    });
    setEditingDetails(false);
    load();
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRoom(true);
    try {
      await api.post(`/projects/${id}/rooms`, {
        name: roomForm.name,
        area: parseFloat(roomForm.area) || 0,
        perimeter: parseFloat(roomForm.perimeter) || 0,
        notes: roomForm.notes,
      });
      setRoomForm({ name: '', area: '', perimeter: '', notes: '' });
      setAddingRoom(false);
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar ambiente');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setSavingRoom(true);
    try {
      await api.put(`/projects/${id}/rooms/${editingRoom.id}`, {
        name: editingRoom.name,
        area: editingRoom.area,
        perimeter: editingRoom.perimeter,
        notes: editingRoom.notes,
      });
      setEditingRoom(null);
      load();
    } finally {
      setSavingRoom(false);
    }
  };

  const handleExportDXF = async () => {
    if (!id) return;
    setExportingDXF(true);
    try {
      const res = await api.get(`/reports/projects/${id}/dxf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projeto-${project?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') ?? id}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar DXF');
    } finally {
      setExportingDXF(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Excluir este ambiente?')) return;
    await api.delete(`/projects/${id}/rooms/${roomId}`);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" /></div>;
  if (!project) return <div className="text-center py-20 text-slate-500">Projeto não encontrado</div>;

  const totalArea = (project.rooms ?? []).reduce((acc, r) => acc + r.area, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/projetos" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
          <p className="text-slate-500 text-sm">{project.clientName || 'Sem cliente'}</p>
        </div>
        <div className="flex items-center gap-2">
          {editingStatus ? (
            <>
              <select className="input w-auto text-sm" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={handleStatusSave} className="btn-primary py-1.5 px-3 text-xs"><Save size={13} /> Salvar</button>
              <button onClick={() => setEditingStatus(false)} className="btn-ghost p-1.5"><X size={14} /></button>
            </>
          ) : (
            <button onClick={() => setEditingStatus(true)} className="btn-secondary text-xs">
              <Edit2 size={13} /> Status
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Files */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 text-sm">Informações</h3>
              {!editingDetails && (
                <button onClick={() => setEditingDetails(true)} className="btn-ghost p-1 text-slate-400 hover:text-slate-700"><Edit2 size={13} /></button>
              )}
            </div>

            {editingDetails ? (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Tipo do projeto</label>
                  <select className="input text-sm" value={detailsForm.projectType} onChange={e => setDetailsForm(f => ({ ...f, projectType: e.target.value }))}>
                    <option value="">— Selecione —</option>
                    {PROJECT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Prazo de entrega</label>
                  <input className="input text-sm" type="date" value={detailsForm.deadline} onChange={e => setDetailsForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleDetailsSave} className="btn-primary text-xs py-1.5 px-3"><Save size={12} /> Salvar</button>
                  <button onClick={() => setEditingDetails(false)} className="btn-secondary text-xs py-1.5 px-3"><X size={12} /> Cancelar</button>
                </div>
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium text-slate-800">{STATUS_OPTIONS.find(s => s.value === project.status)?.label}</dd>
                </div>
                {project.projectType && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tipo</dt>
                    <dd className="font-medium text-slate-800">{PROJECT_TYPE_OPTIONS.find(t => t.value === project.projectType)?.label}</dd>
                  </div>
                )}
                {project.deadline && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Prazo</dt>
                    <dd className="font-medium text-slate-800">{new Date(project.deadline).toLocaleDateString('pt-BR')}</dd>
                  </div>
                )}
                {project.clientEmail && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">E-mail</dt>
                    <dd className="font-medium text-slate-800 truncate max-w-[140px]">{project.clientEmail}</dd>
                  </div>
                )}
                {project.clientPhone && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Telefone</dt>
                    <dd className="font-medium text-slate-800">{project.clientPhone}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Ambientes</dt>
                  <dd className="font-medium text-slate-800">{project.rooms?.length ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Área total</dt>
                  <dd className="font-medium text-slate-800">{totalArea.toFixed(2)} m²</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Files */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 text-sm">Arquivos CAD/2D</h3>
              <label className={clsx('btn-primary text-xs cursor-pointer px-3 py-1.5', uploading && 'opacity-50 cursor-not-allowed')}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? 'Enviando...' : 'Importar'}
                <input type="file" className="hidden" accept=".dxf" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            {uploadSuccess && (
              <div className="mb-3 flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 p-2 rounded">
                <CheckCircle2 size={13} /> {uploadMessage}
              </div>
            )}
            {(project.rooms?.length ?? 0) > 0 && (
              <button
                onClick={handleExportDXF}
                disabled={exportingDXF}
                className="btn-secondary text-xs w-full justify-center mb-3"
              >
                {exportingDXF ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {exportingDXF ? 'Exportando...' : 'Exportar DXF'}
              </button>
            )}
            {project.files?.length === 0 ? (
              <div className="text-center py-6">
                <File size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhum arquivo importado</p>
                <p className="text-xs text-slate-400">Aceita: DXF</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.files?.map(f => (
                  <div key={f.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <FileText size={14} className="text-navy-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{f.originalName}</p>
                      <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {f.processed && <CheckCircle2 size={13} className="text-emerald-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget link */}
          {project.budgets && project.budgets.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-2">Orçamentos</h3>
              <div className="space-y-2">
                {project.budgets.map(b => (
                  <Link key={b.id} to={`/orcamentos/${b.id}`} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-sm">
                    <span className="text-slate-700">{b.name}</span>
                    <span className="text-navy-700 font-medium">R$ {b.totalCost.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
              <Link to={`/orcamentos?projeto=${project.id}`} className="btn-primary w-full justify-center mt-3 text-xs">
                <Plus size={13} /> Novo Orçamento
              </Link>
            </div>
          )}
          {(!project.budgets || project.budgets.length === 0) && (
            <Link to={`/orcamentos?projeto=${project.id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 bg-navy-50 rounded-lg flex items-center justify-center">
                <DollarSign size={18} className="text-navy-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Criar Orçamento</p>
                <p className="text-xs text-slate-500">Gerar orçamento automático</p>
              </div>
            </Link>
          )}
        </div>

        {/* Right: Rooms */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800">Ambientes</h2>
                <span className="badge-gray">{project.rooms?.length ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                {(project.rooms?.length ?? 0) > 0 && (
                  <button
                    onClick={handleAutoBudget}
                    disabled={generatingBudget}
                    className="btn-secondary text-xs px-3 py-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {generatingBudget ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {generatingBudget ? 'Gerando...' : 'Gerar Orçamento'}
                  </button>
                )}
                <button onClick={() => setAddingRoom(true)} className="btn-primary text-xs px-3 py-1.5">
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            </div>

            {/* Add Room Form */}
            {addingRoom && (
              <form onSubmit={handleAddRoom} className="p-5 border-b border-slate-100 bg-navy-50">
                <p className="text-xs font-medium text-slate-600 mb-3">Novo Ambiente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input className="input text-sm" placeholder="Nome do ambiente *" value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <input className="input text-sm" type="number" step="0.01" placeholder="Área (m²)" value={roomForm.area} onChange={e => setRoomForm(f => ({ ...f, area: e.target.value }))} />
                  </div>
                  <div>
                    <input className="input text-sm" type="number" step="0.01" placeholder="Perímetro (m)" value={roomForm.perimeter} onChange={e => setRoomForm(f => ({ ...f, perimeter: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <input className="input text-sm" placeholder="Observações (opcional)" value={roomForm.notes} onChange={e => setRoomForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="submit" className="btn-primary text-xs" disabled={savingRoom}>
                    {savingRoom && <Loader2 size={12} className="animate-spin" />} Salvar
                  </button>
                  <button type="button" onClick={() => setAddingRoom(false)} className="btn-secondary text-xs">Cancelar</button>
                </div>
              </form>
            )}

            {/* Rooms list */}
            {project.rooms?.length === 0 && !addingRoom ? (
              <div className="py-12 text-center">
                <Layers size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">Nenhum ambiente cadastrado</p>
                <p className="text-slate-400 text-xs mt-1">Importe um arquivo CAD ou adicione manualmente</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {project.rooms?.map(room => (
                  <div key={room.id} className="p-4">
                    {editingRoom?.id === room.id ? (
                      <form onSubmit={handleEditRoom} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input className="input text-sm col-span-2" value={editingRoom.name} onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })} required />
                          <input className="input text-sm" type="number" step="0.01" placeholder="Área (m²)" value={editingRoom.area} onChange={e => setEditingRoom({ ...editingRoom, area: parseFloat(e.target.value) || 0 })} />
                          <input className="input text-sm" type="number" step="0.01" placeholder="Perímetro (m)" value={editingRoom.perimeter} onChange={e => setEditingRoom({ ...editingRoom, perimeter: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary text-xs" disabled={savingRoom}><Save size={12} /> Salvar</button>
                          <button type="button" onClick={() => setEditingRoom(null)} className="btn-secondary text-xs"><X size={12} /> Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{room.name}</p>
                          <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                            <span>{room.area.toFixed(2)} m²</span>
                            {room.perimeter > 0 && <span>· {room.perimeter.toFixed(2)} m perímetro</span>}
                            {room.isManual
                              ? <span className="text-navy-600">· Manual</span>
                              : <span className="text-emerald-600">· Extraído do CAD</span>
                            }
                          </div>
                          {room.notes && <p className="text-xs text-slate-400 mt-0.5">{room.notes}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingRoom(room)} className="btn-ghost p-1.5"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
