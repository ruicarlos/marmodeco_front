import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Budget, Project, Material, Room } from '../types';
import { Plus, FileText, Search, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Rascunho', cls: 'badge-gray' },
  PENDING: { label: 'Pendente', cls: 'badge-yellow' },
  APPROVED: { label: 'Aprovado', cls: 'badge-green' },
  REJECTED: { label: 'Rejeitado', cls: 'badge-red' },
};

interface BudgetItem {
  roomId: string;
  materialId: string;
  area: number;
  quantity: number;
  unitPrice: number;
  notes: string;
}

function NewBudgetModal({ onClose, onSaved, defaultProjectId }: {
  onClose: () => void;
  onSaved: () => void;
  defaultProjectId?: string;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId || '');
  const [name, setName] = useState('');
  const [laborCost, setLaborCost] = useState('0');
  const [extraCost, setExtraCost] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.data));
    api.get('/materials').then(r => setMaterials(r.data.data));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      api.get(`/projects/${selectedProject}/rooms`).then(r => {
        setRooms(r.data.data);
        setItems([]);
      });
    }
  }, [selectedProject]);

  const addItem = () => setItems(prev => [...prev, { roomId: rooms[0]?.id || '', materialId: materials[0]?.id || '', area: 0, quantity: 1, unitPrice: materials[0]?.pricePerM2 || 0, notes: '' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof BudgetItem, val: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[i] };
      if (key === 'materialId') {
        const mat = materials.find(m => m.id === val);
        item.materialId = String(val);
        item.unitPrice = mat?.pricePerM2 ?? 0;
      } else if (key === 'roomId' || key === 'notes') {
        (item as Record<string, string | number>)[key] = String(val);
      } else {
        (item as Record<string, string | number>)[key] = parseFloat(String(val)) || 0;
      }
      updated[i] = item;
      return updated;
    });
  };

  const totalMaterials = items.reduce((sum, it) => sum + (it.area * it.unitPrice), 0);
  const total = totalMaterials + parseFloat(laborCost || '0') + parseFloat(extraCost || '0') - parseFloat(discount || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !name) return;
    setLoading(true);
    try {
      await api.post('/budgets', {
        projectId: selectedProject,
        name,
        laborCost: parseFloat(laborCost) || 0,
        extraCost: parseFloat(extraCost) || 0,
        discount: parseFloat(discount) || 0,
        notes,
        validUntil: validUntil || undefined,
        items,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-200 z-10">
          <h2 className="font-semibold text-slate-800">Novo Orçamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Projeto *</label>
              <select className="input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)} required>
                <option value="">Selecione...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nome do Orçamento *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Orçamento Cozinha v1" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Itens do Orçamento</label>
              <button type="button" onClick={addItem} className="btn-secondary text-xs px-2 py-1" disabled={!selectedProject || rooms.length === 0}>
                <Plus size={12} /> Adicionar Item
              </button>
            </div>
            {rooms.length === 0 && selectedProject && (
              <p className="text-xs text-navy-600 bg-navy-50 p-2 rounded">Cadastre ambientes no projeto antes de criar itens.</p>
            )}
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end bg-slate-50 p-3 rounded-lg">
                <div className="col-span-3">
                  <label className="label text-xs">Ambiente</label>
                  <select className="input text-sm" value={item.roomId} onChange={e => updateItem(i, 'roomId', e.target.value)}>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="label text-xs">Material</label>
                  <select className="input text-sm" value={item.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)}>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label text-xs">Área (m²)</label>
                  <input className="input text-sm" type="number" step="0.01" value={item.area} onChange={e => updateItem(i, 'area', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label text-xs">R$/m²</label>
                  <input className="input text-sm" type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                </div>
                <div className="col-span-1">
                  <label className="label text-xs">Subtotal</label>
                  <div className="text-sm font-medium text-slate-700 py-2">
                    R$ {(item.area * item.unitPrice).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => removeItem(i)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600">×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Mão de Obra (R$)</label>
              <input className="input" type="number" step="0.01" value={laborCost} onChange={e => setLaborCost(e.target.value)} />
            </div>
            <div>
              <label className="label">Extras (R$)</label>
              <input className="input" type="number" step="0.01" value={extraCost} onChange={e => setExtraCost(e.target.value)} />
            </div>
            <div>
              <label className="label">Desconto (R$)</label>
              <input className="input" type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Válido até</label>
              <input className="input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
            <div>
              <label className="label">Observações</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações" />
            </div>
          </div>

          {/* Total preview */}
          <div className="bg-navy-50 border border-navy-200 rounded-lg p-4 flex justify-between items-center">
            <span className="font-medium text-slate-700">Total do Orçamento:</span>
            <span className="text-xl font-bold text-navy-800">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Criar Orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const [searchParams] = useSearchParams();
  const defaultProjectId = searchParams.get('projeto') || undefined;
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(!!defaultProjectId);

  const load = () => {
    setLoading(true);
    api.get('/budgets').then(r => setBudgets(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = budgets.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.project?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{budgets.length} orçamento(s)</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Buscar orçamento ou projeto..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-navy-700" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum orçamento encontrado</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4"><Plus size={15} /> Criar Orçamento</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Orçamento</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Projeto</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Área</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{b.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{b.project?.name}</td>
                  <td className="px-4 py-3 text-right text-slate-600 hidden sm:table-cell">{b.totalArea.toFixed(2)} m²</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    R$ {b.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={STATUS_MAP[b.status]?.cls ?? 'badge-gray'}>
                      {STATUS_MAP[b.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                    {format(new Date(b.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/orcamentos/${b.id}`} className="btn-ghost p-1.5"><Eye size={14} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <NewBudgetModal
          onClose={() => setModalOpen(false)}
          onSaved={load}
          defaultProjectId={defaultProjectId}
        />
      )}
    </div>
  );
}
