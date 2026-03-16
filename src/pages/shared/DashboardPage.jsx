import { useEffect, useState } from 'react'
import { dashboardAPI, alertsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatCard, Spinner } from '../../components/ui/index'
import { ShoppingCart, TrendingUp, Package, Bell, Pill, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function DashboardPage() {
  const { user, isAdmin, isPharmacien } = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    if (!isAdmin && !isPharmacien) { setLoading(false); return }
    Promise.all([
      dashboardAPI.stats(),
      alertsAPI.getLowStock(),
    ]).then(([s, l]) => {
      setStats(s.data.data)
      setLowStock(l.data.data?.slice(0, 5) || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const fmtFCFA = (n) => n?.toLocaleString('fr-FR') + ' FCFA'

  if (loading) return (
    <div className="p-8 flex justify-center"><Spinner /></div>
  )

  // Caissier dashboard
  if (user?.role === 'caissier') return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title={`Bonjour, ${user.nom} 👋`} subtitle="Interface caissier" />
      <div className="card text-center py-12">
        <ShoppingCart size={40} className="text-primary-400 mx-auto mb-4" />
        <h3 className="font-display font-semibold text-lg text-surface-800 mb-2">Prêt à encaisser</h3>
        <p className="text-surface-500 text-sm mb-6">Créez une nouvelle vente ou consultez l'historique.</p>
        <div className="flex gap-3 justify-center">
          <a href="/sales/new" className="btn-primary">+ Nouvelle vente</a>
          <a href="/sales" className="btn-secondary">Historique</a>
        </div>
      </div>
    </div>
  )

  const caData = stats?.caParMois?.map(m => ({
    name: MONTHS[(m._id.month - 1)],
    ca: m.ca,
  })) || []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Bonjour, ${user?.nom} 👋`}
        subtitle={format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="CA du jour"     value={fmtFCFA(stats?.ca?.jour)}    icon={TrendingUp}   color="primary" />
        <StatCard label="CA du mois"     value={fmtFCFA(stats?.ca?.mois)}    icon={TrendingUp}   color="blue"    />
        <StatCard label="Ventes aujourd'hui" value={stats?.ventesJour ?? '—'} icon={ShoppingCart} color="primary" />
        <StatCard label="Alertes non lues"   value={stats?.alertesNonLues ?? 0} icon={Bell}       color="red"     />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CA Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-display font-semibold text-surface-800 mb-4">Chiffre d'affaires — 12 mois</h3>
          {caData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={caData}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2e9466" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2e9466" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={v => [v.toLocaleString('fr-FR') + ' FCFA', 'CA']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="ca" stroke="#2e9466" strokeWidth={2} fill="url(#caGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-surface-400 text-sm">Aucune donnée disponible</div>
          )}
        </div>

        {/* Top médicaments */}
        <div className="card">
          <h3 className="font-display font-semibold text-surface-800 mb-4">Top produits ce mois</h3>
          {stats?.topMedicaments?.length > 0 ? (
            <div className="space-y-3">
              {stats.topMedicaments.map((m, i) => (
                <div key={m._id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{m.nom}</p>
                    <p className="text-xs text-surface-400">{m.total} unités</p>
                  </div>
                  <span className="text-xs font-medium text-primary-600 shrink-0">{m.ca?.toLocaleString()} F</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400">Aucune vente ce mois.</p>
          )}
        </div>
      </div>

      {/* Stock bas */}
      {lowStock.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-display font-semibold text-surface-800">Stock bas — attention requise</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {lowStock.map(m => (
              <div key={m._id} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Pill size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{m.nom}</p>
                    <p className="text-xs text-amber-700 font-semibold">{m.quantiteTotale} / {m.seuilAlerte} min</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
