import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Building2, Lock, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Informações da sua conta</p>
      </div>

      {/* User info */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-navy-700 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <span className={user?.role === 'ADMIN' ? 'badge bg-purple-100 text-purple-700 mt-1' : 'badge-gray mt-1'}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Gestor Geral'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            <User size={15} className="text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs">Perfil</p>
              <p className="font-medium text-slate-700">{user?.role === 'ADMIN' ? 'Administrador' : 'Gestor Geral'}</p>
            </div>
          </div>
          {user?.company && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={15} className="text-slate-400" />
              <div>
                <p className="text-slate-500 text-xs">Empresa</p>
                <p className="font-medium text-slate-700">{user.company.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-800">Alterar Senha</h2>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm">
            <CheckCircle2 size={16} /> Senha alterada com sucesso!
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Senha Atual</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Nova Senha</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="label">Confirmar Nova Senha</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
