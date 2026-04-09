import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AuditLog } from '../../types';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then(r => setLogs(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Logs de Auditoria</h1>
        <p className="text-slate-500 text-sm mt-0.5">Registro de todas as ações realizadas na plataforma</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-700" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Nenhum log registrado</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{logs.length} registro(s)</p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Ação</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Entidade</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-slate-700 font-medium">{l.user?.name ?? 'Sistema'}</td>
                    <td className="px-4 py-2.5">
                      <span className="badge bg-blue-50 text-blue-700 text-xs">{l.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{l.entity}</td>
                    <td className="px-4 py-2.5 text-slate-400 hidden lg:table-cell text-xs">
                      {format(new Date(l.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
