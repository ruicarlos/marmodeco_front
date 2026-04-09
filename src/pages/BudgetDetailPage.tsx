import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Budget } from '../types';
import { ArrowLeft, Download, CheckCircle2, XCircle, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Rascunho', cls: 'badge-gray' },
  PENDING: { label: 'Pendente', cls: 'badge-yellow' },
  APPROVED: { label: 'Aprovado', cls: 'badge-green' },
  REJECTED: { label: 'Rejeitado', cls: 'badge-red' },
};

const TYPE_MAP: Record<string, string> = {
  MARBLE: 'Mármore', GRANITE: 'Granito', QUARTZITE: 'Quartzito', OTHER: 'Outro'
};

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    if (!id) return;
    api.get(`/budgets/${id}`).then(r => setBudget(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleStatus = async (status: string) => {
    setUpdating(true);
    await api.put(`/budgets/${id}`, { status });
    setUpdating(false);
    load();
  };

  const downloadPDF = () => window.open(`/api/reports/budgets/${id}/pdf`, '_blank');
  const downloadExcel = () => window.open(`/api/reports/budgets/${id}/excel`, '_blank');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" /></div>;
  if (!budget) return <div className="text-center py-20 text-slate-500">Orçamento não encontrado</div>;

  // Group items by room
  const roomGroups: Record<string, typeof budget.items> = {};
  for (const item of budget.items ?? []) {
    const key = item.room?.name ?? 'Sem ambiente';
    if (!roomGroups[key]) roomGroups[key] = [];
    roomGroups[key].push(item);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/orcamentos" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{budget.name}</h1>
          <p className="text-slate-500 text-sm">{budget.project?.name} · {budget.project?.clientName || 'Sem cliente'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('text-sm', STATUS_MAP[budget.status]?.cls ?? 'badge-gray')}>
            {STATUS_MAP[budget.status]?.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={downloadPDF} className="btn-secondary text-xs">
          <FileText size={13} className="text-red-500" /> Exportar PDF
        </button>
        <button onClick={downloadExcel} className="btn-secondary text-xs">
          <FileSpreadsheet size={13} className="text-emerald-600" /> Exportar Excel
        </button>
        {budget.status === 'DRAFT' && (
          <button onClick={() => handleStatus('PENDING')} className="btn-secondary text-xs" disabled={updating}>
            {updating && <Loader2 size={12} className="animate-spin" />}
            Enviar para Aprovação
          </button>
        )}
        {budget.status === 'PENDING' && (
          <>
            <button onClick={() => handleStatus('APPROVED')} className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700" disabled={updating}>
              <CheckCircle2 size={13} /> Aprovar
            </button>
            <button onClick={() => handleStatus('REJECTED')} className="btn-danger text-xs" disabled={updating}>
              <XCircle size={13} /> Rejeitar
            </button>
          </>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Área Total', value: `${budget.totalArea.toFixed(2)} m²` },
          { label: 'Total Materiais', value: `R$ ${(budget.totalCost - budget.laborCost - budget.extraCost + budget.discount).toFixed(2)}` },
          { label: 'Mão de Obra', value: `R$ ${budget.laborCost.toFixed(2)}` },
          { label: 'Total Geral', value: `R$ ${budget.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className={clsx('card p-4', highlight && 'bg-navy-50 border-navy-200')}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={clsx('text-lg font-bold', highlight ? 'text-navy-800' : 'text-slate-800')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Items by room */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Detalhamento por Ambiente</h2>
        </div>
        {Object.entries(roomGroups).length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Nenhum item no orçamento</div>
        ) : (
          Object.entries(roomGroups).map(([roomName, items]) => {
            const roomTotal = (items ?? []).reduce((s, it) => s + it.subtotal, 0);
            const roomArea = (items ?? []).reduce((s, it) => s + it.area, 0);
            return (
              <div key={roomName} className="border-b border-slate-100 last:border-b-0">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 text-sm">{roomName}</span>
                    <span className="text-xs text-slate-400">{roomArea.toFixed(2)} m²</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">
                    R$ {roomTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-2 font-medium text-slate-500 text-xs">Material</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs hidden md:table-cell">Tipo</th>
                      <th className="text-right px-4 py-2 font-medium text-slate-500 text-xs">Área</th>
                      <th className="text-right px-4 py-2 font-medium text-slate-500 text-xs">R$/m²</th>
                      <th className="text-right px-5 py-2 font-medium text-slate-500 text-xs">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items ?? []).map(item => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-2.5 text-slate-700">
                          <div>{item.material?.name}</div>
                          {item.material?.color && <div className="text-xs text-slate-400">{item.material.color} · {item.material.finish}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{TYPE_MAP[item.material?.type ?? ''] ?? item.material?.type}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{item.area.toFixed(2)} m²</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">R$ {item.unitPrice.toFixed(2)}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-800">R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Resumo Financeiro</h3>
        <div className="space-y-2 max-w-sm ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Materiais</span>
            <span className="font-medium">R$ {(budget.totalCost - budget.laborCost - budget.extraCost + budget.discount).toFixed(2)}</span>
          </div>
          {budget.laborCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Mão de obra</span>
              <span className="font-medium">R$ {budget.laborCost.toFixed(2)}</span>
            </div>
          )}
          {budget.extraCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Extras</span>
              <span className="font-medium">R$ {budget.extraCost.toFixed(2)}</span>
            </div>
          )}
          {budget.discount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Desconto</span>
              <span className="font-medium">-R$ {budget.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-semibold text-slate-800">Total</span>
            <span className="font-bold text-lg text-navy-800">R$ {budget.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {budget.notes && (
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
    </div>
  );
}
