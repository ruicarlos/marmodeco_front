import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FileText, Package,
  BarChart3, Settings, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import logo from '../../assets/logo.png';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projetos', icon: FolderOpen, label: 'Projetos' },
  { to: '/orcamentos', icon: FileText, label: 'Orçamentos' },
  { to: '/materiais', icon: Package, label: 'Materiais' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

const adminItems = [
  { to: '/admin', icon: Settings, label: 'Administração' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-navy-900 flex flex-col transition-transform duration-300 ease-in-out',
        'lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MarmoDecor" className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <div className="font-bold text-white text-sm leading-tight">MarmoDecor</div>
            <div className="text-navy-300 text-xs">Orçamentação Inteligente</div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-navy-300 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-navy-800 text-white border-l-4 border-amber-500 pl-2'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3">
              <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Administração</span>
            </div>
            <div className="space-y-0.5">
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                      isActive
                        ? 'bg-navy-800 text-white border-l-4 border-amber-500 pl-2'
                        : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={14} />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-navy-800">
        <div className="text-xs text-navy-400 text-center">
          © 2025 BMAAR Propriedades<br />
          <span className="text-navy-500">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
