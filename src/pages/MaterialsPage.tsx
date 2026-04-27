import { useEffect, useState } from 'react';
import api from '../services/api';
import { Material } from '../types';
import { Plus, Search, Package, Pencil, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const TYPE_MAP: Record<string, { label: string; cls: string }> = {
  MARBLE: { label: 'Mármore', cls: 'bg-purple-100 text-purple-700' },
  GRANITE: { label: 'Granito', cls: 'bg-stone-100 text-slate-700' },
  QUARTZITE: { label: 'Quartzito', cls: 'bg-blue-100 text-blue-700' },
  OTHER: { label: 'Outro', cls: 'bg-gray-100 text-gray-700' },
};

const FINISH_MAP: Record<string, string> = {
  POLISHED: 'Polido', BRUSHED: 'Escovado', HONED: 'Acetinado', NATURAL: 'Natural'
};

function MaterialModal({ material, onClose, onSaved }: {
  material?: Material;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!material;
  const [form, setForm] = useState({
    name:       material?.name              || '',
    type:       material?.type              || 'MARBLE',
    color:      material?.color             || '',
    finish:     material?.finish            || 'POLISHED',
    thickness:  material?.thickness?.toString() || '2.0',
    pricePerM2: material?.pricePerM2?.toString() || '',
    stock:      material?.stock?.toString()      || '0',
    description: material?.description     || '',
    supplier:   material?.supplier         || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/materials/${material!.id}`, form);
      } else {
        await api.post('/materials', form);
      }
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">{isEdit ? 'Editar Material' : 'Novo Material'}</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Mármore Branco Carrara" />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'MARBLE' | 'GRANITE' | 'QUARTZITE' | 'OTHER' }))}>
                <option value="MARBLE">Mármore</option>
                <option value="GRANITE">Granito</option>
                <option value="QUARTZITE">Quartzito</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div>
              <label className="label">Acabamento</label>
              <select className="input" value={form.finish} onChange={e => setForm(f => ({ ...f, finish: e.target.value as 'POLISHED' | 'BRUSHED' | 'HONED' | 'NATURAL' }))}>
                <option value="POLISHED">Polido</option>
                <option value="BRUSHED">Escovado</option>
                <option value="HONED">Acetinado</option>
                <option value="NATURAL">Natural</option>
              </select>
            </div>
            <div>
              <label className="label">Cor</label>
              <input className="input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Ex: Branco, Cinza..." />
            </div>
            <div>
              <label className="label">Espessura (cm)</label>
              <input className="input" type="number" step="0.1" value={form.thickness} onChange={e => setForm(f => ({ ...f, thickness: e.target.value }))} />
            </div>
            <div>
              <label className="label">Preço por m² (R$) *</label>
              <input className="input" type="number" step="0.01" value={form.pricePerM2} onChange={e => setForm(f => ({ ...f, pricePerM2: e.target.value }))} required placeholder="0.00" />
            </div>
            <div>
              <label className="label">Estoque (m²)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input className="input" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Nome do fornecedor" />
            </div>
            <div className="col-span-2">
              <label className="label">Descrição</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição opcional" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const { isAdmin } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | undefined>(undefined);

  const load = () => {
    setLoading(true);
    api.get('/materials/all').then(r => setMaterials(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, [isAdmin]);

  const handleDeactivate = async (id: string) => {
    if (!confirm('Desativar este material?')) return;
    await api.delete(`/materials/${id}`);
    load();
  };

  const filtered = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.color || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.supplier || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || m.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Materiais</h1>
          <p className="text-slate-500 text-sm mt-0.5">{materials.filter(m => m.active).length} material(is) ativo(s)</p>
        </div>
        <button onClick={() => { setEditing(undefined); setModalOpen(true); }} className="btn-primary">
          <Plus size={16} /> Novo Material
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar material, cor ou fornecedor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['ALL', 'MARBLE', 'GRANITE', 'QUARTZITE', 'OTHER'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={clsx('px-3 py-2 rounded-lg text-xs font-medium transition-colors', filter === type ? 'bg-navy-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}
            >
              {type === 'ALL' ? 'Todos' : TYPE_MAP[type]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-navy-700" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum material encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className={clsx('card p-5 transition-shadow hover:shadow-md', !m.active && 'opacity-60')}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 leading-tight">{m.name}</h3>
                  {m.color && <p className="text-xs text-slate-500 mt-0.5">{m.color} · {FINISH_MAP[m.finish ?? ''] || m.finish}</p>}
                </div>
                <span className={clsx('badge ml-2 shrink-0', TYPE_MAP[m.type]?.cls)}>
                  {TYPE_MAP[m.type]?.label}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-navy-800">
                    R$ {m.pricePerM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400">por m²</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(m); setModalOpen(true); }}
                    className="btn-ghost p-1.5 text-slate-400 hover:text-slate-700"
                  >
                    <Pencil size={14} />
                  </button>
                  {m.active && (
                    <button onClick={() => handleDeactivate(m.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 text-xs">
                      Desativar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                {m.stock > 0
                  ? <span className="text-emerald-600 font-medium">Estoque: {m.stock.toFixed(2)} m²</span>
                  : <span className="text-slate-400">Sem estoque cadastrado</span>}
                {m.supplier  && <span>· {m.supplier}</span>}
                {m.thickness && <span>· {m.thickness} cm</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <MaterialModal
          material={editing}
          onClose={() => { setModalOpen(false); setEditing(undefined); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
