import { useEffect, useState } from 'react'
import { alertsAPI } from '../../services/api'
import { PageHeader, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Bell, AlertTriangle, Calendar, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminAlerts() {
  const [alerts, setAlerts]     = useState([])
  const [lowStock, setLowStock] = useState([])
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')
  const [unread, setUnread]     = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const [a, l, e] = await Promise.all([alertsAPI.getAll({ limit: 100 }), alertsAPI.getLowStock(), alertsAPI.getExpiring({ days: 60 })])
      setAlerts(a.data.data); setUnread(a.data.unreadCount || 0)
      setLowStock(l.data.data); setExpiring(e.data.data)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markAll = async () => { await alertsAPI.markAllRead(); toast.success('Toutes marquées comme lues'); load() }

  const now = new Date()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Alertes" subtitle={`${unread} non lue${unread !== 1 ? 's' : ''}`}>
        {unread > 0 && <button onClick={markAll} className="btn-secondary text-xs"><CheckCheck size={14}/> Tout marquer lu</button>}
      </PageHeader>

      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-6">
        {[{id:'all',label:`Toutes (${alerts.length})`},{id:'stock',label:`Stock bas (${lowStock.length})`},{id:'expiring',label:`Expirations (${expiring.length})`}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-card text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}>{t.label}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner/></div> : <>
        {tab === 'all' && (
          <div className="space-y-2">
            {alerts.length === 0 ? <div className="card text-center py-12"><Bell size={36} className="text-surface-200 mx-auto mb-3"/><p className="text-surface-500">Aucune alerte</p></div>
            : alerts.map(a => (
              <div key={a._id} className={`flex items-start gap-4 p-4 rounded-xl border ${a.lu ? 'bg-white border-surface-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.type === 'stock_bas' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'}`}>
                  {a.type === 'stock_bas' ? <AlertTriangle size={18}/> : <Calendar size={18}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${a.lu ? 'text-surface-700' : 'text-surface-900 font-medium'}`}>{a.message}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                {!a.lu && <button onClick={async () => { await alertsAPI.markRead(a._id); load() }} className="text-xs text-surface-400 hover:text-surface-600 shrink-0">Marquer lu</button>}
              </div>
            ))}
          </div>
        )}
        {tab === 'stock' && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-surface-50 border-b border-surface-200 text-left"><th className="px-5 py-3 font-medium text-surface-500">Médicament</th><th className="px-5 py-3 font-medium text-surface-500">Stock</th><th className="px-5 py-3 font-medium text-surface-500">Seuil</th><th className="px-5 py-3 font-medium text-surface-500">Statut</th></tr></thead>
              <tbody>
                {lowStock.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-surface-400 text-sm">Aucun stock bas 🎉</td></tr>
                : lowStock.map(m => <tr key={m._id} className="table-row"><td className="px-5 py-3.5 font-medium text-surface-800">{m.nom}</td><td className="px-5 py-3.5 font-semibold text-red-600 font-mono">{m.quantiteTotale}</td><td className="px-5 py-3.5 text-surface-500">{m.seuilAlerte}</td><td className="px-5 py-3.5">{m.quantiteTotale === 0 ? <span className="badge-red">Rupture</span> : <span className="badge-yellow">Stock bas</span>}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'expiring' && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-surface-50 border-b border-surface-200 text-left"><th className="px-5 py-3 font-medium text-surface-500">Médicament</th><th className="px-5 py-3 font-medium text-surface-500">N° Lot</th><th className="px-5 py-3 font-medium text-surface-500">Qté</th><th className="px-5 py-3 font-medium text-surface-500">Expiration</th><th className="px-5 py-3 font-medium text-surface-500">Statut</th></tr></thead>
              <tbody>
                {expiring.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-surface-400 text-sm">Aucune expiration proche 🎉</td></tr>
                : expiring.map(lot => { const days = Math.ceil((new Date(lot.dateExpiration) - now) / (1000*3600*24)); return (
                  <tr key={lot._id} className="table-row"><td className="px-5 py-3.5 font-medium text-surface-800">{lot.medicineId?.nom}</td><td className="px-5 py-3.5 font-mono text-xs">{lot.numeroLot}</td><td className="px-5 py-3.5">{lot.quantite}</td><td className="px-5 py-3.5 text-surface-600">{format(new Date(lot.dateExpiration), 'dd/MM/yyyy')}</td><td className="px-5 py-3.5">{days <= 0 ? <span className="badge-red">Périmé</span> : days <= 30 ? <span className="badge-red">{days}j</span> : <span className="badge-yellow">{days}j</span>}</td></tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </>}
    </div>
  )
}
