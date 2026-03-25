import { useEffect, useState } from 'react'
import { commandesAPI, salesAPI } from '../../services/api'
import { PageHeader, Spinner } from '../../components/ui/index'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Inbox, History, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CaissierDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]         = useState({ commandes: 0, ventesJour: 0, caJour: 0 })
  const [recentCmds, setRecentCmds] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      commandesAPI.getAll({ statut: 'envoye', limit: 5 }),
      salesAPI.getAll({ limit: 5 }),
    ]).then(([cmds, sales]) => {
      setRecentCmds(cmds.data.data || [])
      const ventesAujourd = sales.data.data?.filter(s => {
        const d = new Date(s.createdAt)
        const now = new Date()
        return d.getFullYear() === now.getFullYear() && d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
      }) || []
      setStats({
        commandes: cmds.data.pagination?.total || 0,
        ventesJour: ventesAujourd.length,
        caJour: ventesAujourd.reduce((s, v) => s + (v.total || 0), 0),
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Spinner/></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title={`Bonjour, ${user?.nom} 👋`}
        subtitle={format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Inbox size={20} className="text-blue-600"/></div>
          <p className="text-2xl font-display font-bold text-surface-900">{stats.commandes}</p>
          <p className="text-sm text-surface-500 mt-0.5">Commandes en attente</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2"><ShoppingCart size={20} className="text-primary-600"/></div>
          <p className="text-2xl font-display font-bold text-surface-900">{stats.ventesJour}</p>
          <p className="text-sm text-surface-500 mt-0.5">Ventes du jour</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2"><TrendingUp size={20} className="text-primary-600"/></div>
          <p className="text-2xl font-display font-bold text-primary-700">{stats.caJour.toLocaleString()}</p>
          <p className="text-sm text-surface-500 mt-0.5">FCFA encaissés</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => navigate('/caissier/commandes')}
          className="card hover:shadow-card-hover transition-shadow text-left group relative">
          {stats.commandes > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.commandes} en attente
            </span>
          )}
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Inbox size={20} className="text-blue-600"/>
          </div>
          <p className="font-display font-semibold text-surface-800">Commandes reçues</p>
          <p className="text-sm text-surface-500 mt-1">Voir les ordonnances du pharmacien et encaisser</p>
        </button>

        <button onClick={() => navigate('/caissier/vente/new')}
          className="card hover:shadow-card-hover transition-shadow text-left group">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
            <ShoppingCart size={20} className="text-primary-600"/>
          </div>
          <p className="font-display font-semibold text-surface-800">Vente directe</p>
          <p className="text-sm text-surface-500 mt-1">Nouvelle vente libre sans ordonnance</p>
        </button>
      </div>

      {/* Commandes récentes en attente */}
      {recentCmds.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-500"/>
              <h3 className="font-display font-semibold text-surface-800">Dernières commandes à traiter</h3>
            </div>
            <button onClick={() => navigate('/caissier/commandes')} className="text-xs text-primary-600 hover:text-primary-700">Voir tout →</button>
          </div>
          <div className="space-y-2">
            {recentCmds.map(cmd => (
              <button key={cmd._id} onClick={() => navigate('/caissier/commandes')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-surface-800">{cmd.patientNom || 'Patient anonyme'}</p>
                  <p className="text-xs text-surface-500">{cmd.items?.length} médicament{cmd.items?.length !== 1 ? 's' : ''} · {cmd.total?.toLocaleString()} FCFA</p>
                </div>
                <span className="badge-blue text-xs">Encaisser</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
