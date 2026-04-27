import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Budget, Material, Room, BudgetAdjustment } from '../types';
import {
  ArrowLeft, CheckCircle2, XCircle, FileSpreadsheet, FileText,
  Loader2, Pencil, Trash2, Check, X, Plus, Save, UserCheck, Tag,
  CreditCard, Banknote, Smartphone, SplitSquareHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

// ── constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: 'Rascunho',          cls: 'badge-gray'   },
  PENDING:  { label: 'Pendente',          cls: 'badge-yellow' },
  APPROVED: { label: 'Aprovado',          cls: 'badge-green'  },
  REJECTED: { label: 'Rejeitado',         cls: 'badge-red'    },
};
const TYPE_MAP: Record<string, string> = {
  MARBLE: 'Mármore', GRANITE: 'Granito', QUARTZITE: 'Quartzito', OTHER: 'Outro',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── main component ───────────────────────────────────────────────────────────

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget]       = useState<Budget | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [rooms, setRooms]         = useState<Room[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // inline item edit
  const [editId, setEditId]       = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ materialId: '', area: '', unitPrice: '' });

  // add item
  const [addingItem, setAddingItem] = useState(false);
  const [addForm, setAddForm]       = useState({ roomId: '', materialId: '', area: '', unitPrice: '' });

  // costs edit
  const [editCosts, setEditCosts]   = useState(false);
  const [costsForm, setCostsForm]   = useState({ laborCost: '0', extraCost: '0', discount: '0', notes: '', validUntil: '' });

  // adjustment add form
  const [addingAdj, setAddingAdj] = useState(false);
  const [adjForm,   setAdjForm  ] = useState({ description: '', type: 'COST', valueType: 'FIXED', value: '' });

  // approval / sale modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  type PayMethod = 'CARD' | 'PIX' | 'CASH' | 'MIXED';
  const [payMethod, setPayMethod] = useState<PayMethod>('PIX');
  const [mixedPayments, setMixedPayments] = useState<{ method: 'CARD' | 'PIX' | 'CASH'; amount: string }[]>([
    { method: 'PIX',  amount: '' },
    { method: 'CARD', amount: '' },
  ]);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/budgets/${id}`)
      .then(r => {
        const b: Budget = r.data.data;
        setBudget(b);
        setCostsForm({
          laborCost:  String(b.laborCost),
          extraCost:  String(b.extraCost),
          discount:   String(b.discount),
          notes:      b.notes    || '',
          validUntil: b.validUntil ? b.validUntil.substring(0, 10) : '',
        });
        // load materials + rooms for the project
        api.get('/materials/all').then(m => setMaterials(m.data.data));
        if (b.projectId) {
          api.get(`/projects/${b.projectId}/rooms`).then(rm => {
            setRooms(rm.data.data);
            setAddForm(f => ({ ...f, roomId: rm.data.data[0]?.id || '', materialId: '', area: '', unitPrice: '' }));
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  // can edit items only on DRAFT / PENDING
  const canEdit = budget?.status === 'DRAFT' || budget?.status === 'PENDING';

  // ── item edit ──────────────────────────────────────────────────────────────

  const startEdit = (item: NonNullable<Budget['items']>[0]) => {
    setEditId(item.id);
    setEditForm({ materialId: item.materialId, area: String(item.area), unitPrice: String(item.unitPrice) });
    setAddingItem(false);
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await api.put(`/budgets/${id}/items/${editId}`, {
        materialId: editForm.materialId,
        area:       parseFloat(editForm.area)      || 0,
        unitPrice:  parseFloat(editForm.unitPrice) || 0,
      });
      setBudget(res.data.data);
      setEditId(null);
    } catch { alert('Erro ao salvar item'); }
    finally { setSaving(false); }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Remover este item do orçamento?')) return;
    setSaving(true);
    try {
      await api.delete(`/budgets/${id}/items/${itemId}`);
      load();
    } catch { alert('Erro ao remover item'); }
    finally { setSaving(false); }
  };

  // ── add item ───────────────────────────────────────────────────────────────

  const saveAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/budgets/${id}/items`, {
        roomId:     addForm.roomId,
        materialId: addForm.materialId,
        area:       parseFloat(addForm.area)      || 0,
        unitPrice:  parseFloat(addForm.unitPrice) || 0,
      });
      setBudget(res.data.data);
      setAddingItem(false);
      setAddForm(f => ({ ...f, materialId: '', area: '', unitPrice: '' }));
    } catch { alert('Erro ao adicionar item'); }
    finally { setSaving(false); }
  };

  // when material changes in add/edit form, auto-fill unit price
  const onMaterialChange = (matId: string, target: 'edit' | 'add') => {
    const mat = materials.find(m => m.id === matId);
    if (target === 'edit') setEditForm(f => ({ ...f, materialId: matId, unitPrice: String(mat?.pricePerM2 ?? f.unitPrice) }));
    else setAddForm(f => ({ ...f, materialId: matId, unitPrice: String(mat?.pricePerM2 ?? '') }));
  };

  // ── costs edit ─────────────────────────────────────────────────────────────

  const saveCosts = async () => {
    setSaving(true);
    try {
      await api.put(`/budgets/${id}`, {
        laborCost:  parseFloat(costsForm.laborCost)  || 0,
        extraCost:  parseFloat(costsForm.extraCost)  || 0,
        discount:   parseFloat(costsForm.discount)   || 0,
        notes:      costsForm.notes      || null,
        validUntil: costsForm.validUntil || undefined,
      });
      setEditCosts(false);
      load();
    } catch { alert('Erro ao salvar custos'); }
    finally { setSaving(false); }
  };

  // ── status actions ─────────────────────────────────────────────────────────

  const handleStatus = async (status: string) => {
    setSaving(true);
    await api.put(`/budgets/${id}`, { status });
    setSaving(false);
    load();
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      const payments = payMethod === 'MIXED'
        ? mixedPayments.filter(p => parseFloat(p.amount) > 0).map(p => ({ method: p.method, amount: parseFloat(p.amount) }))
        : [];
      await api.post('/sales', { budgetId: id, paymentMethod: payMethod, payments });
      setShowApproveModal(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Erro ao aprovar orçamento');
    } finally { setSaving(false); }
  };

  // ── downloads ──────────────────────────────────────────────────────────────

  const downloadBlob = async (url: string, filename: string, mime: string) => {
    setSaving(true);
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: mime });
      const link = document.createElement('a');
      link.href     = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { alert('Erro ao baixar arquivo'); }
    finally { setSaving(false); }
  };

  const handleDownloadPDF = () =>
    downloadBlob(
      `/reports/budgets/${id}/pdf`,
      `orcamento-${budget?.name?.replace(/\s+/g, '_') ?? id}.pdf`,
      'application/pdf',
    );

  const handleDownloadExcel = () =>
    downloadBlob(
      `/reports/budgets/${id}/excel`,
      `orcamento-${budget?.name?.replace(/\s+/g, '_') ?? id}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

  // ── adjustments ───────────────────────────────────────────────────────────

  const saveAdj = async () => {
    if (!adjForm.description.trim()) { alert('Informe a descrição'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/budgets/${id}/adjustments`, {
        description: adjForm.description,
        type:        adjForm.type,
        valueType:   adjForm.valueType,
        value:       parseFloat(adjForm.value) || 0,
      });
      setBudget(res.data.data);
      setAddingAdj(false);
      setAdjForm({ description: '', type: 'COST', valueType: 'FIXED', value: '' });
    } catch { alert('Erro ao adicionar ajuste'); }
    finally { setSaving(false); }
  };

  const deleteAdj = async (adjId: string) => {
    if (!confirm('Remover este ajuste?')) return;
    setSaving(true);
    try {
      await api.delete(`/budgets/${id}/adjustments/${adjId}`);
      load();
    } catch { alert('Erro ao remover ajuste'); }
    finally { setSaving(false); }
  };

  // ── loaders ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" />
    </div>
  );
  if (!budget) return <div className="text-center py-20 text-slate-500">Orçamento não encontrado</div>;

  // group items by room
  type ItemType = NonNullable<Budget['items']>[0];
  const roomGroups: Record<string, ItemType[]> = {};
  for (const item of budget.items ?? []) {
    const key = item.room?.name ?? 'Sem ambiente';
    if (!roomGroups[key]) roomGroups[key] = [];
    roomGroups[key].push(item);
  }

  const materialsCost = (budget.items ?? []).reduce((s, i) => s + i.subtotal, 0);
  const realArea      = (budget.items ?? []).reduce((s, i) => s + i.area,     0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link to="/orcamentos" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{budget.name}</h1>
          <p className="text-slate-500 text-sm">
            {budget.project?.name}
            {budget.project?.clientName && <> · {budget.project.clientName}</>}
            {budget.seller && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                <UserCheck size={10} /> {budget.seller.name}
              </span>
            )}
          </p>
        </div>
        <span className={clsx('text-sm', STATUS_MAP[budget.status]?.cls ?? 'badge-gray')}>
          {STATUS_MAP[budget.status]?.label}
        </span>
      </div>

      {/* ── Action bar ── */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleDownloadPDF} disabled={saving} className="btn-secondary text-xs">
          <FileText size={13} className="text-red-500" />
          {saving ? 'Gerando…' : 'Baixar PDF'}
        </button>
        <button onClick={handleDownloadExcel} disabled={saving} className="btn-secondary text-xs">
          <FileSpreadsheet size={13} className="text-emerald-600" /> Excel
        </button>
        {budget.status === 'DRAFT' && (
          <button onClick={() => handleStatus('PENDING')} className="btn-secondary text-xs" disabled={saving}>
            {saving && <Loader2 size={12} className="animate-spin" />} Enviar para Aprovação
          </button>
        )}
        {budget.status === 'PENDING' && (
          <>
            <button onClick={() => setShowApproveModal(true)} className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              <CheckCircle2 size={13} /> Aprovar / Vender
            </button>
            <button onClick={() => handleStatus('REJECTED')} className="btn-secondary text-xs text-red-600 border-red-200" disabled={saving}>
              <XCircle size={13} /> Rejeitar
            </button>
          </>
        )}
        {budget.status === 'APPROVED' && budget.sale && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
            <CheckCircle2 size={13} /> Venda registrada
          </span>
        )}
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Área Total',      value: `${realArea.toFixed(2)} m²`            },
          { label: 'Materiais',       value: `R$ ${fmt(materialsCost)}`             },
          { label: 'Mão de Obra',     value: `R$ ${fmt(budget.laborCost)}`          },
          { label: 'Total Geral',     value: `R$ ${fmt(budget.totalCost)}`, hi: true },
        ].map(({ label, value, hi }) => (
          <div key={label} className={clsx('card p-4', hi && 'bg-navy-50 border-navy-200')}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={clsx('text-lg font-bold', hi ? 'text-navy-800' : 'text-slate-800')}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Items by room ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Detalhamento por Ambiente</h2>
          {canEdit && (
            <button onClick={() => { setAddingItem(v => !v); setEditId(null); }} className="btn-secondary text-xs px-3 py-1.5">
              <Plus size={13} /> Adicionar Item
            </button>
          )}
        </div>

        {/* Add-item row */}
        {addingItem && canEdit && (
          <div className="p-4 bg-navy-50 border-b border-navy-100">
            <p className="text-xs font-semibold text-navy-700 mb-3">Novo item</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="label text-xs">Ambiente</label>
                <select className="input text-sm" value={addForm.roomId} onChange={e => setAddForm(f => ({ ...f, roomId: e.target.value }))}>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label text-xs">Material</label>
                <select className="input text-sm" value={addForm.materialId} onChange={e => onMaterialChange(e.target.value, 'add')}>
                  <option value="">— Selecione —</option>
                  {materials.filter(m => m.active).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({TYPE_MAP[m.type]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Área (m²)</label>
                <input className="input text-sm" type="number" step="0.01" value={addForm.area}
                  onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="label text-xs">R$/m²</label>
                <input className="input text-sm" type="number" step="0.01" value={addForm.unitPrice}
                  onChange={e => setAddForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={saveAdd} disabled={saving || !addForm.roomId || !addForm.materialId}
                className="btn-primary text-xs">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirmar
              </button>
              <button onClick={() => setAddingItem(false)} className="btn-secondary text-xs"><X size={12} /> Cancelar</button>
            </div>
          </div>
        )}

        {/* Rooms */}
        {Object.entries(roomGroups).length === 0 && !addingItem ? (
          <div className="py-10 text-center text-slate-400 text-sm">Nenhum item no orçamento</div>
        ) : (
          Object.entries(roomGroups).map(([roomName, items]) => {
            const roomTotal = items.reduce((s, it) => s + it.subtotal, 0);
            const roomArea  = items.reduce((s, it) => s + it.area,     0);
            return (
              <div key={roomName} className="border-b border-slate-100 last:border-b-0">
                {/* Room header */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 text-sm">{roomName}</span>
                    <span className="text-xs text-slate-400">{roomArea.toFixed(2)} m²</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">R$ {fmt(roomTotal)}</span>
                </div>

                {/* Items table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-2 font-medium text-slate-400 text-xs">Material</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-400 text-xs hidden md:table-cell">Tipo</th>
                      <th className="text-right px-4 py-2 font-medium text-slate-400 text-xs">Área (m²)</th>
                      <th className="text-right px-4 py-2 font-medium text-slate-400 text-xs">R$/m²</th>
                      <th className="text-right px-5 py-2 font-medium text-slate-400 text-xs">Subtotal</th>
                      {canEdit && <th className="px-3 py-2 w-20"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const isEditing = editId === item.id;
                      const previewSubtotal = isEditing
                        ? (parseFloat(editForm.area) || 0) * (parseFloat(editForm.unitPrice) || 0)
                        : item.subtotal;
                      const editMat = isEditing ? materials.find(m => m.id === editForm.materialId) : null;

                      return (
                        <tr key={item.id} className={clsx('border-b border-slate-50 last:border-0', isEditing && 'bg-amber-50')}>
                          {/* Material */}
                          <td className="px-5 py-2.5">
                            {isEditing ? (
                              <select className="input text-xs py-1" value={editForm.materialId}
                                onChange={e => onMaterialChange(e.target.value, 'edit')}>
                                {materials.filter(m => m.active).map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div>
                                <span className="text-slate-700">{item.material?.name}</span>
                                {item.material?.color && (
                                  <div className="text-xs text-slate-400">{item.material.color} · {item.material.finish}</div>
                                )}
                              </div>
                            )}
                          </td>
                          {/* Tipo */}
                          <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell text-xs">
                            {isEditing
                              ? (editMat ? TYPE_MAP[editMat.type] : '—')
                              : TYPE_MAP[item.material?.type ?? ''] ?? item.material?.type}
                          </td>
                          {/* Área */}
                          <td className="px-4 py-2.5 text-right">
                            {isEditing ? (
                              <input className="input text-xs py-1 text-right w-24 ml-auto" type="number" step="0.01"
                                value={editForm.area} onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))} />
                            ) : (
                              <span className="text-slate-600">{item.area.toFixed(2)}</span>
                            )}
                          </td>
                          {/* R$/m² */}
                          <td className="px-4 py-2.5 text-right">
                            {isEditing ? (
                              <input className="input text-xs py-1 text-right w-24 ml-auto" type="number" step="0.01"
                                value={editForm.unitPrice} onChange={e => setEditForm(f => ({ ...f, unitPrice: e.target.value }))} />
                            ) : (
                              <span className="text-slate-600">R$ {item.unitPrice.toFixed(2)}</span>
                            )}
                          </td>
                          {/* Subtotal */}
                          <td className="px-5 py-2.5 text-right font-semibold text-slate-800">
                            R$ {fmt(previewSubtotal)}
                          </td>
                          {/* Actions */}
                          {canEdit && (
                            <td className="px-3 py-2 text-right">
                              {isEditing ? (
                                <div className="flex gap-1 justify-end">
                                  <button onClick={saveEdit} disabled={saving} title="Salvar"
                                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50">
                                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                  </button>
                                  <button onClick={cancelEdit} title="Cancelar"
                                    className="p-1 rounded text-slate-400 hover:bg-slate-100">
                                    <X size={13} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-end">
                                  <button onClick={() => startEdit(item)} title="Editar"
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => deleteItem(item.id)} title="Remover"
                                    className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      {/* ── Costs + Summary ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Resumo Financeiro</h3>
          {canEdit && !editCosts && (
            <button onClick={() => setEditCosts(true)} className="btn-ghost p-1.5 text-slate-400 hover:text-slate-700">
              <Pencil size={14} />
            </button>
          )}
        </div>

        {editCosts ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label text-xs">Mão de Obra (R$)</label>
                <input className="input" type="number" step="0.01" value={costsForm.laborCost}
                  onChange={e => setCostsForm(f => ({ ...f, laborCost: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Extras (R$)</label>
                <input className="input" type="number" step="0.01" value={costsForm.extraCost}
                  onChange={e => setCostsForm(f => ({ ...f, extraCost: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Desconto (R$)</label>
                <input className="input" type="number" step="0.01" value={costsForm.discount}
                  onChange={e => setCostsForm(f => ({ ...f, discount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-xs">Válido até</label>
                <input className="input" type="date" value={costsForm.validUntil}
                  onChange={e => setCostsForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Observações</label>
                <input className="input" value={costsForm.notes}
                  onChange={e => setCostsForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveCosts} disabled={saving} className="btn-primary text-xs">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
              </button>
              <button onClick={() => setEditCosts(false)} className="btn-secondary text-xs"><X size={12} /> Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Materiais</span>
              <span className="font-medium">R$ {fmt(materialsCost)}</span>
            </div>
            {budget.laborCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Mão de obra</span>
                <span className="font-medium">R$ {fmt(budget.laborCost)}</span>
              </div>
            )}
            {budget.extraCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Extras</span>
                <span className="font-medium">R$ {fmt(budget.extraCost)}</span>
              </div>
            )}
            {budget.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto</span>
                <span className="font-medium">−R$ {fmt(budget.discount)}</span>
              </div>
            )}
            {/* Adjustments */}
            {(budget.adjustments ?? []).map(adj => {
              const base = materialsCost;
              const v = adj.valueType === 'PERCENT' ? base * adj.value / 100 : adj.value;
              const isDiscount = adj.type === 'DISCOUNT';
              return (
                <div key={adj.id} className={clsx('flex justify-between text-sm', isDiscount ? 'text-emerald-600' : 'text-orange-600')}>
                  <div className="flex items-center gap-1.5">
                    <Tag size={11} />
                    <span>{adj.description}</span>
                    <span className="text-xs opacity-60">
                      ({adj.valueType === 'PERCENT' ? `${adj.value}%` : 'fixo'})
                    </span>
                    {canEdit && (
                      <button onClick={() => deleteAdj(adj.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <span className="font-medium">{isDiscount ? '−' : '+'}R$ {fmt(v)}</span>
                </div>
              );
            })}
            {/* Add adjustment row */}
            {canEdit && !addingAdj && (
              <button onClick={() => setAddingAdj(true)}
                className="flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 transition-colors py-1">
                <Plus size={12} /> Adicionar custo / desconto
              </button>
            )}
            {addingAdj && canEdit && (
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                <input className="input text-sm" placeholder="Descrição *"
                  value={adjForm.description}
                  onChange={e => setAdjForm(f => ({ ...f, description: e.target.value }))} />
                <div className="grid grid-cols-3 gap-2">
                  <select className="input text-sm" value={adjForm.type}
                    onChange={e => setAdjForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="COST">Custo (+)</option>
                    <option value="DISCOUNT">Desconto (−)</option>
                  </select>
                  <select className="input text-sm" value={adjForm.valueType}
                    onChange={e => setAdjForm(f => ({ ...f, valueType: e.target.value }))}>
                    <option value="FIXED">R$ Fixo</option>
                    <option value="PERCENT">% Percentual</option>
                  </select>
                  <input className="input text-sm" type="number" step="0.01" min="0"
                    placeholder={adjForm.valueType === 'PERCENT' ? '%' : 'R$'}
                    value={adjForm.value}
                    onChange={e => setAdjForm(f => ({ ...f, value: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingAdj(false)} className="btn-secondary text-xs py-1"><X size={12} /> Cancelar</button>
                  <button onClick={saveAdj} disabled={saving} className="btn-primary text-xs py-1">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Adicionar
                  </button>
                </div>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-semibold text-slate-800">Total</span>
              <span className="font-bold text-xl text-navy-800">R$ {fmt(budget.totalCost)}</span>
            </div>
          </div>
        )}

        {budget.notes && !editCosts && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border-l-2 border-navy-400">
            <span className="font-medium">Obs:</span> {budget.notes}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
          <span>Criado em {format(new Date(budget.createdAt), 'dd MMM yyyy', { locale: ptBR })}</span>
          {budget.validUntil && <span>· Válido até {format(new Date(budget.validUntil), 'dd MMM yyyy', { locale: ptBR })}</span>}
          {budget.approvedAt && <span>· Aprovado em {format(new Date(budget.approvedAt), 'dd MMM yyyy', { locale: ptBR })}</span>}
        </div>
      </div>

      {/* ── Approve / Sale Modal ── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800">Aprovar Orçamento</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selecione a forma de pagamento</p>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Total */}
              <div className="bg-navy-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-navy-800">R$ {budget.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>

              {/* Payment method selector */}
              <div>
                <label className="label text-xs mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { k: 'PIX',   label: 'Pix',    Icon: Smartphone },
                    { k: 'CARD',  label: 'Cartão', Icon: CreditCard },
                    { k: 'CASH',  label: 'Dinheiro', Icon: Banknote },
                    { k: 'MIXED', label: 'Misto',  Icon: SplitSquareHorizontal },
                  ] as const).map(({ k, label, Icon }) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPayMethod(k)}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                        payMethod === k
                          ? 'border-navy-600 bg-navy-50 text-navy-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mixed split */}
              {payMethod === 'MIXED' && (
                <div className="space-y-2">
                  <label className="label text-xs">Distribuição dos valores</label>
                  {mixedPayments.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        className="input text-sm flex-shrink-0 w-32"
                        value={p.method}
                        onChange={e => setMixedPayments(mp => mp.map((x, j) => j === i ? { ...x, method: e.target.value as 'PIX' | 'CARD' | 'CASH' } : x))}
                      >
                        <option value="PIX">Pix</option>
                        <option value="CARD">Cartão</option>
                        <option value="CASH">Dinheiro</option>
                      </select>
                      <input
                        className="input text-sm flex-1"
                        type="number" step="0.01" min="0" placeholder="R$ 0,00"
                        value={p.amount}
                        onChange={e => setMixedPayments(mp => mp.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                      />
                      {mixedPayments.length > 1 && (
                        <button onClick={() => setMixedPayments(mp => mp.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMixedPayments(mp => [...mp, { method: 'CASH', amount: '' }])}
                    className="text-xs text-navy-600 hover:text-navy-800 flex items-center gap-1"
                  >
                    <Plus size={12} /> Adicionar método
                  </button>
                  {(() => {
                    const total = mixedPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                    const diff  = Math.abs(total - budget.totalCost);
                    if (total > 0 && diff > 0.01) {
                      return <p className="text-xs text-amber-600">Soma: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (faltam R$ {(budget.totalCost - total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</p>;
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setShowApproveModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleApprove} disabled={saving} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirmar Venda
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
