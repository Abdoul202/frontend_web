import { useEffect, useState } from 'react'
import { dashboardAPI, alertsAPI, usersAPI } from '../../services/api'
import { PageHeader, StatCard, Spinner } from '../../components/ui/index'
import { ShoppingCart, TrendingUp, Package, Bell, Users, AlertTriangle, Pill } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      alertsAPI.getLowStock(),
      usersAPI.getAll({ limit: 100 }),
    ]).then(([s, l, u]) => {
      setStats(s.data.data)
      setLowStock(l.data.data?.slice(0, 6) || [])
      setUsers(u.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>

  const caData = stats?.caParMois?.map(m => ({ name: MONTHS[m._id.month-1], ca: m.ca })) || []
  const fmtF = n => (n || 0).toLocaleString('fr-FR') + ' FCFA'

  const actifParRole = {
    pharmaciens: users.filter(u => u.role === 'pharmacien' && u.actif).length,
    caissiers:   users.filter(u => u.role === 'caissier' && u.actif).length,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Bonjour, ${user?.nom} 👋`}
        subtitle={format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="CA du jour"        value={fmtF(stats?.ca?.jour)}        icon={TrendingUp}   color="primary" />
        <StatCard label="CA du mois"        value={fmtF(stats?.ca?.mois)}        icon={TrendingUp}   color="blue"    />
        <StatCard label="Ventes aujourd'hui" value={stats?.ventesJour ?? '—'}    icon={ShoppingCart} color="primary" />
        <StatCard label="Alertes non lues"  value={stats?.alertesNonLues ?? 0}   icon={Bell}         color="red"     />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CA Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-display font-semibold text-surface-800 mb-4">Chiffre d'affaires — 12 mois</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={caData}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2e9466" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2e9466" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
              <Tooltip formatter={v => [v.toLocaleString('fr-FR') + ' FCFA', 'CA']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}/>
              <Area type="monotone" dataKey="ca" stroke="#2e9466" strokeWidth={2} fill="url(#g)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top produits */}
        <div className="card">
          <h3 className="font-display font-semibold text-surface-800 mb-4">Top 5 produits ce mois</h3>
          <div className="space-y-3">
            {stats?.topMedicaments?.length > 0 ? stats.topMedicaments.map((m, i) => (
              <div key={m._id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{m.nom}</p>
                  <p className="text-xs text-surface-400">{m.total} unités</p>
                </div>
                <span className="text-xs font-medium text-primary-600 shrink-0">{m.ca?.toLocaleString()} F</span>
              </div>
            )) : <p className="text-sm text-surface-400 py-4 text-center">Aucune donnée ce mois</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Équipe */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><Users size={18} className="text-primary-600"/><h3 className="font-display font-semibold text-surface-800">Équipe active</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-surface-100">
              <span className="text-sm text-surface-600">Pharmaciens</span>
              <span className="badge-green">{actifParRole.pharmaciens}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-surface-600">Caissiers</span>
              <span className="badge-yellow">{actifParRole.caissiers}</span>
            </div>
          </div>
        </div>

        {/* Stock bas */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500"/>
            <h3 className="font-display font-semibold text-surface-800">Stock bas ({lowStock.length})</h3>
          </div>
          {lowStock.length === 0 ? <p className="text-sm text-surface-400 py-4 text-center">Tous les stocks sont corrects 🎉</p> : (
            <div className="grid grid-cols-2 gap-2">
              {lowStock.map(m => (
                <div key={m._id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <Pill size={14} className="text-amber-600 shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{m.nom}</p>
                    <p className="text-xs text-amber-700 font-semibold">{m.quantiteTotale} / {m.seuilAlerte} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
