import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Pill, Package, ShoppingCart, Bell,
  BarChart2, Users, Activity, User, LogOut,
  ChevronLeft, ClipboardList, Inbox, History, Eye
} from 'lucide-react'
import AlertBadge from '../ui/AlertBadge'

// Nav per role
const NAV_ADMIN = [
  { to: '/',                icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/admin/medicines', icon: Pill,            label: 'Médicaments' },
  { to: '/admin/stock',     icon: Package,         label: 'Stock & Lots' },
  { to: '/admin/sales',     icon: ShoppingCart,    label: 'Toutes les ventes' },
  { to: '/admin/alerts',    icon: Bell,            label: 'Alertes', badge: true },
  { to: '/admin/reports',   icon: BarChart2,       label: 'Rapports' },
  { to: '/admin/users',     icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/activity',  icon: Activity,        label: 'Journal' },
]

const NAV_PHARMACIEN = [
  { to: '/',                  icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/pharma/medicines',  icon: Pill,            label: 'Médicaments' },
  { to: '/pharma/stock',      icon: Package,         label: 'Stock & Lots' },
  { to: '/pharma/ordonnance', icon: ClipboardList,   label: 'Nouvelle ordonnance' },
  { to: '/pharma/commandes',  icon: Inbox,           label: 'Mes commandes' },
  { to: '/pharma/alerts',     icon: Bell,            label: 'Alertes', badge: true },
  { to: '/pharma/reports',    icon: BarChart2,       label: 'Rapports' },
]

const NAV_CAISSIER = [
  { to: '/',                    icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/caissier/commandes',  icon: Inbox,           label: 'Commandes reçues', badge: true },
  { to: '/caissier/vente/new',  icon: ShoppingCart,    label: 'Vente directe' },
  { to: '/caissier/historique', icon: History,         label: 'Historique ventes' },
  { to: '/caissier/stock',      icon: Eye,             label: 'Consulter stock' },
]

const NAV_MAP = { admin: NAV_ADMIN, pharmacien: NAV_PHARMACIEN, caissier: NAV_CAISSIER }
const ROLE_LABELS = { admin: 'Administrateur', pharmacien: 'Pharmacien', caissier: 'Caissier' }
const ROLE_BADGE  = { admin: 'badge-blue', pharmacien: 'badge-green', caissier: 'badge-yellow' }

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const nav = NAV_MAP[user?.role] || []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-surface-200 transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-surface-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <Pill size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display font-semibold text-sm text-surface-900 leading-tight">PharmacyManager</p>
              <p className="text-xs text-primary-600 font-medium">Burkina Faso</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label, exact, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <div className="relative shrink-0">
                <Icon size={18} />
                {badge && <AlertBadge role={user?.role} navKey={to} />}
              </div>
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-surface-100 p-3 space-y-1">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <User size={18} className="shrink-0" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-surface-800 truncate">{user?.nom}</p>
                <span className={`${ROLE_BADGE[user?.role]} text-xs mt-0.5`}>{ROLE_LABELS[user?.role]}</span>
              </div>
            )}
          </NavLink>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button onClick={() => setCollapsed(c => !c)} className="sidebar-link w-full">
            <ChevronLeft size={18} className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-xs">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
