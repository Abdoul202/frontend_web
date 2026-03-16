import { useEffect, useState } from 'react'
import { dashboardAPI, alertsAPI, stockAPI, commandesAPI } from '../../services/api'
import { PageHeader, StatCard, Spinner } from '../../components/ui/index'
import { Pill, Package, Bell, ClipboardList, AlertTriangle, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

export default function PharmaDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [expiring, setExpiring] = useState([])
  const [pendingCmd, setPendingCmd] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      alertsAPI.getLowStock(),
      alertsAPI.getExpiring({ days: 30 }),
      commandesAPI.getAll({ statut: 'brouillon', limit: 1 }),
    ]).then(([s, l, e, c]) => {
      setStats(s.data.data)
      setLowStock(l.data.data?.slice(0, 4) || [])
      setExpiring(e.data.data?.slice(0, 4) || [])
      setPendingCmd(c.data.pagination?.total || 0)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Bonjour, ${user?.nom} 👋`}
        subtitle={format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Alertes non lues"    value={stats?.alertesNonLues ?? 0} icon={Bell}          color="red"     />
        <StatCard label="Stock bas"            value={lowStock.length}            icon={Package}       color="yellow"  />
        <StatCard label="Expirent dans 30j"   value={expiring.length}            icon={Calendar}      color="red"     />
        <StatCard label="Commandes en cours"   value={pendingCmd}                 icon={ClipboardList} color="blue"    />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => navigate('/pharma/ordonnance')}
          className="card hover:shadow-card-hover transition-shadow text-left group">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
            <ClipboardList size={20} className="text-primary-600"/>
          </div>
          <p className="font-display font-semibold text-surface-800">Nouvelle ordonnance</p>
          <p className="text-sm text-surface-500 mt-1">Sélectionner médicaments et envoyer au caissier</p>
        </button>
        <button onClick={() => navigate('/pharma/stock')}
          className="card hover:shadow-card-hover transition-shadow text-left group">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Package size={20} className="text-blue-600"/>
          </div>
          <p className="font-display font-semibold text-surface-800">Entrée de stock</p>
          <p className="text-sm text-surface-500 mt-1">Ajouter un lot, saisir fournisseur et expiration</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock bas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500"/>
              <h3 className="font-display font-semibold text-surface-800">Stock bas</h3>
            </div>
            <button onClick={() => navigate('/pharma/alerts')} className="text-xs text-primary-600 hover:text-primary-700">Voir tout →</button>
          </div>
          {lowStock.length === 0 ? <p className="text-sm text-surface-400 py-4 text-center">Aucun stock bas 🎉</p> : (
            <div className="space-y-2">
              {lowStock.map(m => (
                <div key={m._id} className="flex justify-between items-center py-2 border-b border-surface-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-surface-800">{m.nom}</p>
                    <p className="text-xs text-surface-400 capitalize">{m.forme}</p>
                  </div>
                  <span className="badge-red font-semibold">{m.quantiteTotale} unités</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expirations proches */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-red-500"/>
              <h3 className="font-display font-semibold text-surface-800">Expirations dans 30j</h3>
            </div>
            <button onClick={() => navigate('/pharma/alerts')} className="text-xs text-primary-600 hover:text-primary-700">Voir tout →</button>
          </div>
          {expiring.length === 0 ? <p className="text-sm text-surface-400 py-4 text-center">Aucune expiration proche 🎉</p> : (
            <div className="space-y-2">
              {expiring.map(lot => {
                const days = Math.ceil((new Date(lot.dateExpiration) - new Date()) / (1000*3600*24))
                return (
                  <div key={lot._id} className="flex justify-between items-center py-2 border-b border-surface-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{lot.medicineId?.nom}</p>
                      <p className="text-xs text-surface-400">Lot {lot.numeroLot} · {lot.quantite} unités</p>
                    </div>
                    <span className={days <= 0 ? 'badge-red' : 'badge-yellow'}>{days <= 0 ? 'Périmé' : `${days}j`}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
