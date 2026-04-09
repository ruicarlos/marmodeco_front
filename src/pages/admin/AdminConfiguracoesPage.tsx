import { Settings, Globe, Bell, Shield, Database } from 'lucide-react';

export default function AdminConfiguracoesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configurações gerais da plataforma MarmoDecor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            icon: Globe,
            title: 'Configurações Gerais',
            desc: 'Nome da plataforma, fuso horário, idioma padrão',
            color: 'bg-blue-50 text-blue-600',
          },
          {
            icon: Bell,
            title: 'Notificações',
            desc: 'Alertas de novos cadastros, vencimentos de planos',
            color: 'bg-amber-50 text-amber-600',
          },
          {
            icon: Shield,
            title: 'Segurança',
            desc: 'Políticas de senha, autenticação de dois fatores',
            color: 'bg-emerald-50 text-emerald-600',
          },
          {
            icon: Database,
            title: 'Banco de Dados',
            desc: 'Backup, exportação de dados, logs do sistema',
            color: 'bg-violet-50 text-violet-600',
          },
        ].map(item => (
          <div key={item.title} className="card p-5 flex gap-4 items-start opacity-60 cursor-not-allowed select-none">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-0.5">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
              <span className="inline-block mt-2 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Em breve</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Versão da Plataforma</span>
        </div>
        <p className="text-xs text-slate-400">MarmoDecor v1.0.0 — Chamada B+P Smart Factory · SENAI/CE</p>
      </div>
    </div>
  );
}
