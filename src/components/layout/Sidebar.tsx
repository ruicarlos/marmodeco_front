import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FileText, Package,
  BarChart3, X, ChevronRight, Building2, CreditCard,
  Activity, Settings, DollarSign, Gauge
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import logo from '../../assets/logo.png';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const gestorNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/projetos', icon: FolderOpen, label: 'Projetos', end: false },
  { to: '/orcamentos', icon: FileText, label: 'Orçamentos', end: false },
  { to: '/materiais', icon: Package, label: 'Materiais', end: false },
  { to: '/indicadores', icon: Gauge, label: 'Indicadores', end: false },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios', end: false },
];

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/empresas', icon: Building2, label: 'Empresas', end: false },
  { to: '/admin/financeiro', icon: DollarSign, label: 'Financeiro', end: false },
  { to: '/admin/planos', icon: CreditCard, label: 'Planos', end: false },
  { to: '/admin/operacoes', icon: Activity, label: 'Operações', end: false },
  { to: '/admin/relatorios', icon: BarChart3, label: 'Relatórios', end: false },
  { to: '/admin/configuracoes', icon: Settings, label: 'Configurações', end: false },
];

function NavItem({ item, onClose }: { item: typeof adminNavItems[0]; onClose: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
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
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const navItems = isAdmin ? adminNavItems : gestorNavItems;
  const subtitle = isAdmin ? 'Administração SaaS' : 'Orçamentação Inteligente';

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
            <div className="text-navy-300 text-xs">{subtitle}</div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-navy-300 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isAdmin && (
          <div className="mb-2 px-3">
            <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Gestão da Plataforma</span>
          </div>
        )}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} />
          ))}
        </div>
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
