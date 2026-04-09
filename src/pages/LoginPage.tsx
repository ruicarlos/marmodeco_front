import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import logo from '../assets/logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('marmodecor_user');
      const role = stored ? JSON.parse(stored).role : 'GESTOR';
      navigate(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'E-mail ou senha incorretos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f1f3d 0%, #1a2744 50%, #1e3a6e 100%)' }}
      >
        {/* Subtle marble texture overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 20 50 50 Q75 80 100 50' stroke='white' stroke-width='0.5' fill='none' opacity='0.4'/%3E%3Cpath d='M0 30 Q30 60 60 30 Q90 0 100 30' stroke='white' stroke-width='0.3' fill='none' opacity='0.3'/%3E%3Cpath d='M0 70 Q20 40 50 70 Q80 100 100 70' stroke='white' stroke-width='0.4' fill='none' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="MarmoDecor" className="w-12 h-12 rounded-lg object-cover shadow-lg" />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: 'white', letterSpacing: '0.05em' }}>
              MARMODECO
            </span>
          </div>

          {/* Center quote */}
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: 'white', lineHeight: 1.3, opacity: 0.95 }}>
              Orçamentos precisos,<br />
              <span style={{ fontStyle: 'italic', color: '#c8b89a' }}>projetos impecáveis.</span>
            </p>
            <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
              Plataforma de automação inteligente para marmorarias que valorizam excelência e eficiência.
            </p>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-slate-500" />
            <span className="text-xs text-slate-500">Marmodeco © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <img src={logo} alt="MarmoDecor" className="w-16 h-16 rounded-xl object-cover shadow mb-3" />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 600, color: '#1a2744', letterSpacing: '0.05em' }}>
              MARMODECO
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-1">Bem-vindo</h2>
          <p className="text-sm text-slate-500 mb-8">Acesse sua conta para continuar</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com.br"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-sm tracking-wide"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
