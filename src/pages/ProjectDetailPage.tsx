import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Project, Room, Material, Seller, BudgetAdjustment } from '../types';
import {
  ArrowLeft, Upload, Plus, Trash2, Edit2, Save, X,
  FileText, Layers, DollarSign, Loader2, File, CheckCircle2,
  Download, ClipboardList, ChevronDown, ChevronUp, CheckSquare, Square,
  UserCheck, Tag,
} from 'lucide-react';
import clsx from 'clsx';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'DRAFT',       label: 'Rascunho'    },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED',   label: 'Concluído'    },
  { value: 'CANCELLED',   label: 'Cancelado'    },
];

const PROJECT_TYPE_OPTIONS = [
  { value: 'RESIDENCIAL', label: 'Residencial' },
  { value: 'COMERCIAL',   label: 'Comercial'   },
  { value: 'INDUSTRIAL',  label: 'Industrial'  },
  { value: 'OUTRO',       label: 'Outro'        },
];

const TYPE_OPTIONS = [
  { value: '',           label: 'Todos os tipos'   },
  { value: 'MARBLE',     label: 'Mármore'           },
  { value: 'GRANITE',    label: 'Granito'           },
  { value: 'QUARTZITE',  label: 'Quartzito'         },
  { value: 'OTHER',      label: 'Outro'             },
];

const FINISH_OPTIONS = [
  { value: '',           label: 'Todos os acabamentos' },
  { value: 'POLISHED',   label: 'Polido'               },
  { value: 'BRUSHED',    label: 'Escovado'             },
  { value: 'HONED',      label: 'Amaciado'             },
  { value: 'NATURAL',    label: 'Natural'              },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardRow = {
  roomId:       string;
  typeFilter:   string;
  finishFilter: string;
  materialId:   string;
  area:         string;
  unitPrice:    string;
};

type AdjRow = {
  _key:        string; // local id for React key
  description: string;
  type:        'COST' | 'DISCOUNT';
  valueType:   'FIXED' | 'PERCENT';
  value:       string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRANITE_WORDS = ['cozinha', 'churrasqueira', 'externo', 'externa', 'garagem', 'lavanderia', 'serviço', 'servico'];
const MARBLE_WORDS  = ['banheiro', 'lavabo', 'suite', 'suíte', 'sala', 'quarto', 'hall', 'corredor', 'varanda'];

function suggestType(roomName: string): string {
  const n = roomName.toLowerCase();
  if (GRANITE_WORDS.some(w => n.includes(w))) return 'GRANITE';
  if (MARBLE_WORDS.some(w  => n.includes(w))) return 'MARBLE';
  return '';
}

function initRows(rooms: Room[], materials: Material[]): WizardRow[] {
  return rooms.map(room => {
    const typeFilter = suggestType(room.name);
    const filtered   = materials.filter(m => m.active && (!typeFilter || m.type === typeFilter));
    const mat        = filtered[0] ?? materials.find(m => m.active);
    return {
      roomId:       room.id,
      typeFilter,
      finishFilter: '',
      materialId:   mat?.id       ?? '',
      area:         String(room.area),
      unitPrice:    String(mat?.pricePerM2 ?? ''),
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project,       setProject      ] = useState<Project | null>(null);
  const [materials,     setMaterials    ] = useState<Material[]>([]);
  const [sellers,       setSellers      ] = useState<Seller[]>([]);
  const [loading,       setLoading      ] = useState(true);
  const [uploading,     setUploading    ] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [exportingDXF,  setExportingDXF ] = useState(false);

  // status
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus,     setNewStatus     ] = useState('');

  // project details
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsForm,    setDetailsForm    ] = useState({ projectType: '', deadline: '' });

  // rooms
  const [addingRoom,   setAddingRoom  ] = useState(false);
  const [roomForm,     setRoomForm    ] = useState({ name: '', area: '', perimeter: '', notes: '' });
  const [editingRoom,  setEditingRoom ] = useState<Room | null>(null);
  const [savingRoom,   setSavingRoom  ] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [deletingBulk,  setDeletingBulk ] = useState(false);

  // budget wizard
  const [wizardOpen,    setWizardOpen   ] = useState(false);
  const [wizardName,    setWizardName   ] = useState('');
  const [wizardNotes,   setWizardNotes  ] = useState('');
  const [wizardValid,   setWizardValid  ] = useState('');
  const [wizardSellerId, setWizardSellerId] = useState('');
  const [wizardRows,    setWizardRows   ] = useState<WizardRow[]>([]);
  const [adjRows,       setAdjRows      ] = useState<AdjRow[]>([]);
  const [savingWizard,  setSavingWizard ] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/projects/${id}`).then(res => {
      const p = res.data.data;
      setProject(p);
      setNewStatus(p.status);
      setDetailsForm({
        projectType: p.projectType || '',
        deadline:    p.deadline ? p.deadline.substring(0, 10) : '',
      });
    }).finally(() => setLoading(false));
  };

  useEffect(load, [id]);
  useEffect(() => {
    api.get('/materials/all').then(r => setMaterials(r.data.data ?? []));
    api.get('/sellers').then(r => setSellers(r.data.data ?? []));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(`/projects/${id}/files`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage(res.data.message || 'Arquivo enviado com sucesso');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 6000);
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

  const handleDetailsSave = async () => {
    await api.put(`/projects/${id}`, {
      projectType: detailsForm.projectType || null,
      deadline:    detailsForm.deadline ? new Date(detailsForm.deadline).toISOString() : null,
    });
    setEditingDetails(false);
    load();
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRoom(true);
    try {
      await api.post(`/projects/${id}/rooms`, {
        name:      roomForm.name,
        area:      parseFloat(roomForm.area)      || 0,
        perimeter: parseFloat(roomForm.perimeter) || 0,
        notes:     roomForm.notes,
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
        name:      editingRoom.name,
        area:      editingRoom.area,
        perimeter: editingRoom.perimeter,
        notes:     editingRoom.notes,
      });
      setEditingRoom(null);
      load();
    } finally { setSavingRoom(false); }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Excluir este ambiente?')) return;
    await api.delete(`/projects/${id}/rooms/${roomId}`);
    setSelectedRooms(s => { const n = new Set(s); n.delete(roomId); return n; });
    load();
  };

  const toggleRoom = (roomId: string) =>
    setSelectedRooms(s => { const n = new Set(s); n.has(roomId) ? n.delete(roomId) : n.add(roomId); return n; });

  const toggleAll = () => {
    const allIds = project?.rooms?.map(r => r.id) ?? [];
    setSelectedRooms(s => s.size === allIds.length ? new Set() : new Set(allIds));
  };

  const handleBulkDelete = async () => {
    const count = selectedRooms.size;
    if (!count) return;
    if (!confirm(`Excluir ${count} ambiente(s) selecionado(s)? Esta ação não pode ser desfeita.`)) return;
    setDeletingBulk(true);
    try {
      await Promise.all([...selectedRooms].map(roomId => api.delete(`/projects/${id}/rooms/${roomId}`)));
      setSelectedRooms(new Set());
      load();
    } catch {
      alert('Erro ao excluir ambientes');
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleExportDXF = async () => {
    if (!id) return;
    setExportingDXF(true);
    try {
      const res = await api.get(`/reports/projects/${id}/dxf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `projeto-${project?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') ?? id}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Erro ao exportar DXF'); }
    finally  { setExportingDXF(false); }
  };

  // ── Wizard ────────────────────────────────────────────────────────────────

  const openWizard = () => {
    const rows = initRows(project?.rooms ?? [], materials);
    setWizardRows(rows);
    setWizardName(`Orçamento — ${project?.name ?? ''}`);
    setWizardNotes('');
    setWizardValid('');
    setWizardSellerId('');
    setAdjRows([]);
    setWizardOpen(true);
    setTimeout(() => document.getElementById('wizard-section')?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  // ── Adjustments helpers ───────────────────────────────────────────────────

  const addAdjRow = () =>
    setAdjRows(r => [...r, { _key: Date.now().toString(), description: '', type: 'COST', valueType: 'FIXED', value: '' }]);

  const updateAdj = (key: string, changes: Partial<AdjRow>) =>
    setAdjRows(r => r.map(a => a._key === key ? { ...a, ...changes } : a));

  const removeAdj = (key: string) =>
    setAdjRows(r => r.filter(a => a._key !== key));

  const updateRow = (idx: number, changes: Partial<WizardRow>) =>
    setWizardRows(rows => rows.map((r, i) => i === idx ? { ...r, ...changes } : r));

  const onRowFilterChange = (idx: number, changes: { typeFilter?: string; finishFilter?: string }) => {
    const row = { ...wizardRows[idx], ...changes };
    const filtered = materials.filter(m =>
      m.active &&
      (!row.typeFilter   || m.type   === row.typeFilter)   &&
      (!row.finishFilter || m.finish === row.finishFilter)
    );
    const mat = filtered[0];
    updateRow(idx, { ...changes, materialId: mat?.id ?? '', unitPrice: String(mat?.pricePerM2 ?? '') });
  };

  const onRowMaterialChange = (idx: number, materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    updateRow(idx, { materialId, unitPrice: String(mat?.pricePerM2 ?? '') });
  };

  const handleWizardSave = async () => {
    if (!wizardName.trim()) { alert('Informe o nome do orçamento'); return; }
    setSavingWizard(true);
    try {
      const items = wizardRows
        .filter(r => r.materialId && parseFloat(r.area) > 0)
        .map(r => ({
          roomId:    r.roomId,
          materialId: r.materialId,
          area:      parseFloat(r.area),
          unitPrice: parseFloat(r.unitPrice) || 0,
        }));

      const adjustments = adjRows
        .filter(a => a.description.trim() && parseFloat(a.value) > 0)
        .map(a => ({ description: a.description, type: a.type, valueType: a.valueType, value: parseFloat(a.value) }));

      const res = await api.post('/budgets', {
        projectId:  id,
        name:       wizardName,
        notes:      wizardNotes  || undefined,
        validUntil: wizardValid  || undefined,
        sellerId:   wizardSellerId || undefined,
        items,
        adjustments,
      });
      navigate(`/orcamentos/${res.data.data.id}`);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar orçamento');
    } finally { setSavingWizard(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" />
    </div>
  );
  if (!project) return <div className="text-center py-20 text-slate-500">Projeto não encontrado</div>;

  const totalArea   = (project.rooms ?? []).reduce((acc, r) => acc + r.area, 0);
  const wizardMaterials = wizardRows.reduce((s, r) => s + (parseFloat(r.area) || 0) * (parseFloat(r.unitPrice) || 0), 0);
  const wizardArea      = wizardRows.reduce((s, r) => s + (parseFloat(r.area) || 0), 0);
  const adjTotal = adjRows.reduce((s, a) => {
    const v = parseFloat(a.value) || 0;
    const computed = a.valueType === 'PERCENT' ? wizardMaterials * v / 100 : v;
    return s + (a.type === 'COST' ? computed : -computed);
  }, 0);
  const wizardTotal = wizardMaterials + adjTotal;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
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

        {/* ── Left column ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Info card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 text-sm">Informações</h3>
              {!editingDetails && (
                <button onClick={() => setEditingDetails(true)} className="btn-ghost p-1 text-slate-400 hover:text-slate-700">
                  <Edit2 size={13} />
                </button>
              )}
            </div>
            {editingDetails ? (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Tipo do projeto</label>
                  <select className="input text-sm" value={detailsForm.projectType}
                    onChange={e => setDetailsForm(f => ({ ...f, projectType: e.target.value }))}>
                    <option value="">— Selecione —</option>
                    {PROJECT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Prazo de entrega</label>
                  <input className="input text-sm" type="date" value={detailsForm.deadline}
                    onChange={e => setDetailsForm(f => ({ ...f, deadline: e.target.value }))} />
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

          {/* Files card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 text-sm">Arquivos</h3>
              <label className={clsx('btn-primary text-xs cursor-pointer px-3 py-1.5', uploading && 'opacity-50 cursor-not-allowed')}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? 'Enviando…' : 'Importar'}
                <input
                  type="file" className="hidden"
                  accept=".dxf,.jpg,.jpeg,.png,.gif,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Upload progress animation */}
            {uploading && (
              <div className="mb-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-navy-700">
                  <Loader2 size={12} className="animate-spin" /> Processando arquivo…
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy-600 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-3 flex items-start gap-2 text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {(project.rooms?.length ?? 0) > 0 && (
              <button onClick={handleExportDXF} disabled={exportingDXF}
                className="btn-secondary text-xs w-full justify-center mb-3">
                {exportingDXF ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {exportingDXF ? 'Exportando…' : 'Exportar DXF'}
              </button>
            )}

            {project.files?.length === 0 ? (
              <div className="text-center py-6">
                <File size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhum arquivo importado</p>
                <p className="text-xs text-slate-300 mt-0.5">DXF (extrai ambientes) · JPG / PNG / PDF (referência)</p>
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

          {/* Budgets list */}
          {project.budgets && project.budgets.length > 0 ? (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-2">Orçamentos</h3>
              <div className="space-y-2">
                {project.budgets.map(b => (
                  <Link key={b.id} to={`/orcamentos/${b.id}`}
                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-sm">
                    <span className="text-slate-700">{b.name}</span>
                    <span className="text-navy-700 font-medium">R$ {b.totalCost.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-4 border-dashed border-slate-300 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign size={18} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Nenhum orçamento</p>
                <p className="text-xs text-slate-400">Monte um orçamento a partir dos ambientes</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: Rooms ── */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {/* Select-all checkbox */}
                {(project.rooms?.length ?? 0) > 0 && (
                  <button onClick={toggleAll} className="text-slate-400 hover:text-navy-700 transition-colors">
                    {selectedRooms.size > 0 && selectedRooms.size === (project.rooms?.length ?? 0)
                      ? <CheckSquare size={16} className="text-navy-700" />
                      : selectedRooms.size > 0
                        ? <CheckSquare size={16} className="text-navy-400" />
                        : <Square size={16} />
                    }
                  </button>
                )}
                <Layers size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800">Ambientes</h2>
                <span className="badge-gray">{project.rooms?.length ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Bulk delete bar */}
                {selectedRooms.size > 0 && (
                  <button onClick={handleBulkDelete} disabled={deletingBulk}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
                    {deletingBulk
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                    Excluir {selectedRooms.size} selecionado{selectedRooms.size !== 1 ? 's' : ''}
                  </button>
                )}
                {(project.rooms?.length ?? 0) > 0 && !wizardOpen && selectedRooms.size === 0 && (
                  <button onClick={openWizard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                    <ClipboardList size={13} />
                    Montar Orçamento
                  </button>
                )}
                <button onClick={() => setAddingRoom(true)} className="btn-primary text-xs px-3 py-1.5">
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            </div>

            {/* Add room form */}
            {addingRoom && (
              <form onSubmit={handleAddRoom} className="p-5 border-b border-slate-100 bg-navy-50">
                <p className="text-xs font-medium text-slate-600 mb-3">Novo Ambiente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input className="input text-sm" placeholder="Nome do ambiente *"
                      value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <input className="input text-sm" type="number" step="0.01" placeholder="Área (m²)"
                    value={roomForm.area} onChange={e => setRoomForm(f => ({ ...f, area: e.target.value }))} />
                  <input className="input text-sm" type="number" step="0.01" placeholder="Perímetro (m)"
                    value={roomForm.perimeter} onChange={e => setRoomForm(f => ({ ...f, perimeter: e.target.value }))} />
                  <div className="col-span-2">
                    <input className="input text-sm" placeholder="Observações (opcional)"
                      value={roomForm.notes} onChange={e => setRoomForm(f => ({ ...f, notes: e.target.value }))} />
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
                <p className="text-slate-400 text-xs mt-1">Importe um arquivo DXF/imagem ou adicione manualmente</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {project.rooms?.map(room => {
                  const isSelected = selectedRooms.has(room.id);
                  return (
                    <div key={room.id}
                      className={clsx('p-4 transition-colors', isSelected && 'bg-red-50')}
                    >
                      {editingRoom?.id === room.id ? (
                        <form onSubmit={handleEditRoom} className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input className="input text-sm col-span-2" value={editingRoom.name}
                              onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })} required />
                            <input className="input text-sm" type="number" step="0.01" placeholder="Área (m²)"
                              value={editingRoom.area}
                              onChange={e => setEditingRoom({ ...editingRoom, area: parseFloat(e.target.value) || 0 })} />
                            <input className="input text-sm" type="number" step="0.01" placeholder="Perímetro (m)"
                              value={editingRoom.perimeter}
                              onChange={e => setEditingRoom({ ...editingRoom, perimeter: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="btn-primary text-xs" disabled={savingRoom}><Save size={12} /> Salvar</button>
                            <button type="button" onClick={() => setEditingRoom(null)} className="btn-secondary text-xs"><X size={12} /> Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <button onClick={() => toggleRoom(room.id)}
                            className="shrink-0 text-slate-300 hover:text-navy-700 transition-colors">
                            {isSelected
                              ? <CheckSquare size={16} className="text-red-500" />
                              : <Square size={16} />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{room.name}</p>
                            <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                              <span>{room.area.toFixed(2)} m²</span>
                              {room.perimeter > 0 && <span>· {room.perimeter.toFixed(2)} m périm.</span>}
                              {room.isManual
                                ? <span className="text-navy-600">· Manual</span>
                                : <span className="text-emerald-600">· Extraído do CAD</span>
                              }
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setEditingRoom(room)} className="btn-ghost p-1.5"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteRoom(room.id)}
                              className="btn-ghost p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BUDGET WIZARD — full width, below grid
      ══════════════════════════════════════════════════════════════════════ */}
      {wizardOpen && (
        <div id="wizard-section" className="card overflow-hidden">

          {/* Wizard header */}
          <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-600" />
              <h2 className="font-semibold text-slate-800">Montar Orçamento</h2>
              <span className="text-xs text-slate-500">{wizardRows.length} ambiente(s)</span>
            </div>
            <button onClick={() => setWizardOpen(false)} className="btn-ghost p-1.5 text-slate-400">
              <X size={16} />
            </button>
          </div>

          {/* Budget metadata */}
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="label text-xs">Nome do orçamento *</label>
                <input className="input" value={wizardName}
                  onChange={e => setWizardName(e.target.value)} placeholder="Ex: Orçamento Sala Principal" />
              </div>
              <div>
                <label className="label text-xs">Válido até</label>
                <input className="input" type="date" value={wizardValid}
                  onChange={e => setWizardValid(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">
                  <span className="flex items-center gap-1"><UserCheck size={11} /> Vendedor</span>
                </label>
                <div className="relative">
                  <select className="input text-sm appearance-none pr-7" value={wizardSellerId}
                    onChange={e => setWizardSellerId(e.target.value)}>
                    <option value="">— Sem vendedor —</option>
                    {sellers.filter(s => s.active).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.commission > 0 ? ` (${s.commission}%)` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label className="label text-xs">Observações</label>
              <input className="input" value={wizardNotes}
                onChange={e => setWizardNotes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {/* Per-room rows */}
          <div className="divide-y divide-slate-100">
            {wizardRows.map((row, idx) => {
              const room     = project.rooms?.find(r => r.id === row.roomId);
              const filtered = materials.filter(m =>
                m.active &&
                (!row.typeFilter   || m.type   === row.typeFilter)   &&
                (!row.finishFilter || m.finish === row.finishFilter)
              );
              const subtotal = (parseFloat(row.area) || 0) * (parseFloat(row.unitPrice) || 0);
              const selMat   = materials.find(m => m.id === row.materialId);

              return (
                <div key={row.roomId} className="p-5">
                  {/* Room title bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-semibold text-slate-800">{room?.name}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {room?.area.toFixed(2)} m²
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Subtotal</p>
                      <p className="font-bold text-navy-700">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Selectors */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Tipo */}
                    <div>
                      <label className="label text-xs">Tipo de pedra</label>
                      <div className="relative">
                        <select className="input text-sm appearance-none pr-7"
                          value={row.typeFilter}
                          onChange={e => onRowFilterChange(idx, { typeFilter: e.target.value })}>
                          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Acabamento */}
                    <div>
                      <label className="label text-xs">Acabamento</label>
                      <div className="relative">
                        <select className="input text-sm appearance-none pr-7"
                          value={row.finishFilter}
                          onChange={e => onRowFilterChange(idx, { finishFilter: e.target.value })}>
                          {FINISH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Material */}
                    <div className="md:col-span-2">
                      <label className="label text-xs">
                        Material
                        {filtered.length === 0 && (row.typeFilter || row.finishFilter) && (
                          <span className="text-amber-600 ml-1 font-normal">(sem correspondência — mostrando todos)</span>
                        )}
                      </label>
                      <div className="relative">
                        <select className="input text-sm appearance-none pr-7"
                          value={row.materialId}
                          onChange={e => onRowMaterialChange(idx, e.target.value)}>
                          <option value="">— Selecione —</option>
                          {(filtered.length > 0 ? filtered : materials.filter(m => m.active)).map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} — R$ {m.pricePerM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/m²
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      {selMat && (
                        <p className="text-xs text-slate-400 mt-1">
                          {selMat.color && <>{selMat.color} · </>}
                          {selMat.finish ?? ''}
                        </p>
                      )}
                    </div>

                    {/* Área */}
                    <div>
                      <label className="label text-xs">Área (m²)</label>
                      <input className="input text-sm" type="number" step="0.01" min="0"
                        value={row.area}
                        onChange={e => updateRow(idx, { area: e.target.value })} />
                    </div>

                    {/* Preço */}
                    <div>
                      <label className="label text-xs">R$/m²</label>
                      <input className="input text-sm" type="number" step="0.01" min="0"
                        value={row.unitPrice}
                        onChange={e => updateRow(idx, { unitPrice: e.target.value })} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Adjustments section ─────────────────────────────────────── */}
          <div className="border-t border-slate-100">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Custos Adicionais e Descontos</span>
                {adjRows.length > 0 && (
                  <span className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">{adjRows.length}</span>
                )}
              </div>
              <button onClick={addAdjRow}
                className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={13} /> Adicionar linha
              </button>
            </div>

            {adjRows.length > 0 && (
              <div className="px-5 py-3 space-y-3">
                {/* Header labels */}
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide px-1">
                  <div className="col-span-4">Descrição</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-2">Formato</div>
                  <div className="col-span-2">Valor</div>
                  <div className="col-span-2 text-right">Impacto</div>
                </div>
                {adjRows.map(adj => {
                  const v = parseFloat(adj.value) || 0;
                  const computed = adj.valueType === 'PERCENT' ? wizardMaterials * v / 100 : v;
                  const impact   = adj.type === 'COST' ? computed : -computed;
                  return (
                    <div key={adj._key} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 md:col-span-4">
                        <input className="input text-sm" placeholder="Descrição *"
                          value={adj.description}
                          onChange={e => updateAdj(adj._key, { description: e.target.value })} />
                      </div>
                      <div className="col-span-5 md:col-span-2">
                        <select className="input text-sm" value={adj.type}
                          onChange={e => updateAdj(adj._key, { type: e.target.value as 'COST' | 'DISCOUNT' })}>
                          <option value="COST">Custo (+)</option>
                          <option value="DISCOUNT">Desconto (−)</option>
                        </select>
                      </div>
                      <div className="col-span-5 md:col-span-2">
                        <select className="input text-sm" value={adj.valueType}
                          onChange={e => updateAdj(adj._key, { valueType: e.target.value as 'FIXED' | 'PERCENT' })}>
                          <option value="FIXED">R$ Fixo</option>
                          <option value="PERCENT">% Percentual</option>
                        </select>
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <div className="relative">
                          <input className="input text-sm pr-7" type="number" step="0.01" min="0"
                            value={adj.value} placeholder="0"
                            onChange={e => updateAdj(adj._key, { value: e.target.value })} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            {adj.valueType === 'PERCENT' ? '%' : 'R$'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2">
                        {v > 0 && (
                          <span className={clsx('text-sm font-semibold', impact >= 0 ? 'text-red-600' : 'text-emerald-600')}>
                            {impact >= 0 ? '+' : '−'}R$ {Math.abs(impact).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <button onClick={() => removeAdj(adj._key)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wizard footer */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm space-y-0.5">
              <div>
                <span className="text-slate-500">{wizardArea.toFixed(2)} m² · Materiais: </span>
                <span className="font-medium text-slate-700">
                  R$ {wizardMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {adjTotal !== 0 && (
                  <span className={clsx('ml-2 font-medium', adjTotal > 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {adjTotal > 0 ? '+' : '−'}R$ {Math.abs(adjTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ajustes
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500">Total: </span>
                <span className="font-bold text-navy-800 text-base">
                  R$ {wizardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWizardOpen(false)} className="btn-secondary text-sm">
                <ChevronUp size={14} /> Fechar
              </button>
              <button onClick={handleWizardSave} disabled={savingWizard || !wizardName.trim()}
                className="btn-primary text-sm px-5">
                {savingWizard
                  ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
                  : <><Save size={14} /> Salvar Orçamento</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
