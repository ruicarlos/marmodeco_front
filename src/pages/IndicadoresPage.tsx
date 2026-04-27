import { useEffect, useState } from 'react';
import api from '../services/api';
import { KPIRecord } from '../types';
import { Plus, Trash2, TrendingUp, Gauge, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ── helpers ─────────────────────────────────────────────────────────────────

function oeeColor(v: number) {
  if (v >= 85) return 'text-emerald-600';
  if (v >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function prodColor(v: number) {
  if (v >= 1) return 'text-emerald-600';
  if (v >= 0.5) return 'text-amber-600';
  return 'text-red-500';
}

// ── Form components ──────────────────────────────────────────────────────────

function ProdutividadeForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ period: '', unidadesProduzidas: '', horasTrabalhadas: '', numOperadores: '1', notes: '' });
  const [loading, setLoading] = useState(false);

  const preview = () => {
    const u = parseFloat(form.unidadesProduzidas) || 0;
    const h = parseFloat(form.horasTrabalhadas) || 0;
    const n = parseInt(form.numOperadores) || 1;
    return h > 0 ? (u / (h * n)).toFixed(3) : '—';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/kpis', { type: 'PRODUTIVIDADE', ...form });
      onSaved();
      onClose();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-navy-50 border border-navy-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Novo registro — Produtividade</p>
        <button type="button" onClick={onClose}><X size={14} className="text-slate-400" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label text-xs">Período *</label>
          <input className="input text-sm" type="month" required value={form.period}
            onChange={e => setForm(f => ({ ...f, period: e.target.value + '-01' }))} />
        </div>
        <div>
          <label className="label text-xs">Unidades produzidas (m²) *</label>
          <input className="input text-sm" type="number" step="0.01" required value={form.unidadesProduzidas}
            onChange={e => setForm(f => ({ ...f, unidadesProduzidas: e.target.value }))} placeholder="Ex: 120" />
        </div>
        <div>
          <label className="label text-xs">Horas trabalhadas *</label>
          <input className="input text-sm" type="number" step="0.1" required value={form.horasTrabalhadas}
            onChange={e => setForm(f => ({ ...f, horasTrabalhadas: e.target.value }))} placeholder="Ex: 160" />
        </div>
        <div>
          <label className="label text-xs">Nº de operadores *</label>
          <input className="input text-sm" type="number" min="1" required value={form.numOperadores}
            onChange={e => setForm(f => ({ ...f, numOperadores: e.target.value }))} />
        </div>
        <div className="flex items-end pb-1">
          <p className="text-xs text-slate-500">Prévia: <span className="font-bold text-navy-700">{preview()} m²/h·op</span></p>
        </div>
        <div className="col-span-2">
          <label className="label text-xs">Observações</label>
          <input className="input text-sm" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
        <button type="submit" className="btn-primary text-xs" disabled={loading}>
          {loading && <Loader2 size={12} className="animate-spin" />} Salvar
        </button>
      </div>
    </form>
  );
}

function OEEForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ period: '', disponibilidade: '', desempenho: '', qualidade: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const preview = () => {
    const d = parseFloat(form.disponibilidade) || 0;
    const p = parseFloat(form.desempenho) || 0;
    const q = parseFloat(form.qualidade) || 0;
    return ((d / 100) * (p / 100) * (q / 100) * 100).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/kpis', { type: 'OEE', ...form });
      onSaved();
      onClose();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-navy-50 border border-navy-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Novo registro — OEE</p>
        <button type="button" onClick={onClose}><X size={14} className="text-slate-400" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label text-xs">Período *</label>
          <input className="input text-sm" type="month" required value={form.period}
            onChange={e => setForm(f => ({ ...f, period: e.target.value + '-01' }))} />
        </div>
        <div>
          <label className="label text-xs">Disponibilidade (%) *</label>
          <input className="input text-sm" type="number" step="0.1" min="0" max="100" required value={form.disponibilidade}
            onChange={e => setForm(f => ({ ...f, disponibilidade: e.target.value }))} placeholder="Ex: 95" />
        </div>
        <div>
          <label className="label text-xs">Desempenho (%) *</label>
          <input className="input text-sm" type="number" step="0.1" min="0" max="100" required value={form.desempenho}
            onChange={e => setForm(f => ({ ...f, desempenho: e.target.value }))} placeholder="Ex: 88" />
        </div>
        <div>
          <label className="label text-xs">Qualidade (%) *</label>
          <input className="input text-sm" type="number" step="0.1" min="0" max="100" required value={form.qualidade}
            onChange={e => setForm(f => ({ ...f, qualidade: e.target.value }))} placeholder="Ex: 97" />
        </div>
        <div className="flex items-end pb-1">
          <p className="text-xs text-slate-500">OEE prévia: <span className="font-bold text-navy-700">{preview()}%</span></p>
        </div>
        <div className="col-span-2">
          <label className="label text-xs">Observações</label>
          <input className="input text-sm" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
        <button type="submit" className="btn-primary text-xs" disabled={loading}>
          {loading && <Loader2 size={12} className="animate-spin" />} Salvar
        </button>
      </div>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function IndicadoresPage() {
  const [records, setRecords] = useState<KPIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProdForm, setShowProdForm] = useState(false);
  const [showOEEForm, setShowOEEForm] = useState(false);
  const [showProdHistory, setShowProdHistory] = useState(false);
  const [showOEEHistory, setShowOEEHistory] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/kpis').then(r => setRecords(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    await api.delete(`/kpis/${id}`);
    load();
  };

  const prodRecords = records.filter(r => r.type === 'PRODUTIVIDADE').sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  const oeeRecords  = records.filter(r => r.type === 'OEE').sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

  const latestProd = prodRecords[prodRecords.length - 1];
  const latestOEE  = oeeRecords[oeeRecords.length - 1];

  const prodChartData = prodRecords.map(r => ({
    period: format(new Date(r.period), 'MMM/yy', { locale: ptBR }),
    valor: r.resultado,
  }));
  const oeeChartData = oeeRecords.map(r => ({
    period: format(new Date(r.period), 'MMM/yy', { locale: ptBR }),
    valor: r.resultado,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Indicadores</h1>
        <p className="text-slate-500 text-sm mt-0.5">Acompanhamento de desempenho operacional</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-navy-700" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Produtividade ───────────────────────────────────────── */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Produtividade</h2>
                  <p className="text-xs text-slate-400">Unidades / (Horas × Operadores)</p>
                </div>
              </div>
              <button onClick={() => { setShowProdForm(v => !v); setShowOEEForm(false); }} className="btn-primary text-xs px-3 py-1.5">
                <Plus size={13} /> Registrar
              </button>
            </div>

            <div className="p-5 space-y-4">
              {showProdForm && (
                <ProdutividadeForm onSaved={load} onClose={() => setShowProdForm(false)} />
              )}

              {/* Latest value */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Último resultado</p>
                  <p className={`text-3xl font-bold ${latestProd ? prodColor(latestProd.resultado) : 'text-slate-300'}`}>
                    {latestProd ? latestProd.resultado.toFixed(3) : '—'}
                  </p>
                  <p className="text-xs text-slate-400">m²/hora·operador</p>
                </div>
                {latestProd && (
                  <div className="flex-1 text-xs text-slate-500 space-y-1 bg-slate-50 rounded-lg p-3">
                    <div className="flex justify-between"><span>Unidades produzidas</span><span className="font-medium">{latestProd.unidadesProduzidas} m²</span></div>
                    <div className="flex justify-between"><span>Horas trabalhadas</span><span className="font-medium">{latestProd.horasTrabalhadas} h</span></div>
                    <div className="flex justify-between"><span>Operadores</span><span className="font-medium">{latestProd.numOperadores}</span></div>
                    <div className="flex justify-between"><span>Período</span><span className="font-medium">{format(new Date(latestProd.period), 'MMM yyyy', { locale: ptBR })}</span></div>
                  </div>
                )}
              </div>

              {/* Mini formula card */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Fórmula</p>
                <p className="font-mono">Produtividade = Unidades / (Horas × Operadores)</p>
              </div>

              {/* Chart */}
              {prodChartData.length > 1 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Evolução mensal</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={prodChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [v.toFixed(3), 'm²/h·op']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* History toggle */}
              {prodRecords.length > 0 && (
                <div>
                  <button onClick={() => setShowProdHistory(v => !v)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                    {showProdHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showProdHistory ? 'Ocultar' : 'Ver'} histórico ({prodRecords.length} registros)
                  </button>
                  {showProdHistory && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 text-slate-500 font-medium">Período</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Unidades</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Horas</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Op.</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Resultado</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...prodRecords].reverse().map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="py-2">{format(new Date(r.period), 'MMM yyyy', { locale: ptBR })}</td>
                              <td className="py-2 text-right">{r.unidadesProduzidas}</td>
                              <td className="py-2 text-right">{r.horasTrabalhadas}</td>
                              <td className="py-2 text-right">{r.numOperadores}</td>
                              <td className={`py-2 text-right font-semibold ${prodColor(r.resultado)}`}>{r.resultado.toFixed(3)}</td>
                              <td className="py-2 text-right">
                                <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {prodRecords.length === 0 && !showProdForm && (
                <p className="text-center text-slate-400 text-xs py-4">Nenhum registro ainda. Clique em "Registrar" para começar.</p>
              )}
            </div>
          </div>

          {/* ── OEE ─────────────────────────────────────────────────── */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Gauge size={18} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Eficiência Global (OEE)</h2>
                  <p className="text-xs text-slate-400">Disponibilidade × Desempenho × Qualidade</p>
                </div>
              </div>
              <button onClick={() => { setShowOEEForm(v => !v); setShowProdForm(false); }} className="btn-primary text-xs px-3 py-1.5">
                <Plus size={13} /> Registrar
              </button>
            </div>

            <div className="p-5 space-y-4">
              {showOEEForm && (
                <OEEForm onSaved={load} onClose={() => setShowOEEForm(false)} />
              )}

              {/* Latest value */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Último resultado</p>
                  <p className={`text-3xl font-bold ${latestOEE ? oeeColor(latestOEE.resultado) : 'text-slate-300'}`}>
                    {latestOEE ? `${latestOEE.resultado.toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">OEE geral</p>
                </div>
                {latestOEE && (
                  <div className="flex-1 text-xs text-slate-500 space-y-1 bg-slate-50 rounded-lg p-3">
                    <div className="flex justify-between"><span>Disponibilidade</span><span className="font-medium">{latestOEE.disponibilidade}%</span></div>
                    <div className="flex justify-between"><span>Desempenho</span><span className="font-medium">{latestOEE.desempenho}%</span></div>
                    <div className="flex justify-between"><span>Qualidade</span><span className="font-medium">{latestOEE.qualidade}%</span></div>
                    <div className="flex justify-between"><span>Período</span><span className="font-medium">{format(new Date(latestOEE.period), 'MMM yyyy', { locale: ptBR })}</span></div>
                  </div>
                )}
              </div>

              {/* Reference bands */}
              <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-900 space-y-1">
                <p className="font-semibold mb-1">Referência de desempenho</p>
                <div className="flex gap-4">
                  <span className="text-emerald-700 font-medium">≥ 85% — World Class</span>
                  <span className="text-amber-700 font-medium">60–85% — Bom</span>
                  <span className="text-red-600 font-medium">&lt; 60% — Atenção</span>
                </div>
                <p className="font-mono mt-1">OEE = Disp. × Desemp. × Qualidade</p>
              </div>

              {/* Chart */}
              {oeeChartData.length > 1 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Evolução mensal</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={oeeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'OEE']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* History toggle */}
              {oeeRecords.length > 0 && (
                <div>
                  <button onClick={() => setShowOEEHistory(v => !v)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                    {showOEEHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showOEEHistory ? 'Ocultar' : 'Ver'} histórico ({oeeRecords.length} registros)
                  </button>
                  {showOEEHistory && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 text-slate-500 font-medium">Período</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Disp.</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Desemp.</th>
                            <th className="text-right py-2 text-slate-500 font-medium">Qualid.</th>
                            <th className="text-right py-2 text-slate-500 font-medium">OEE</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...oeeRecords].reverse().map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="py-2">{format(new Date(r.period), 'MMM yyyy', { locale: ptBR })}</td>
                              <td className="py-2 text-right">{r.disponibilidade}%</td>
                              <td className="py-2 text-right">{r.desempenho}%</td>
                              <td className="py-2 text-right">{r.qualidade}%</td>
                              <td className={`py-2 text-right font-semibold ${oeeColor(r.resultado)}`}>{r.resultado.toFixed(1)}%</td>
                              <td className="py-2 text-right">
                                <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {oeeRecords.length === 0 && !showOEEForm && (
                <p className="text-center text-slate-400 text-xs py-4">Nenhum registro ainda. Clique em "Registrar" para começar.</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
