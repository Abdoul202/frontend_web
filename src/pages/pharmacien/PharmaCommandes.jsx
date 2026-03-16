import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { commandesAPI } from '../../services/api'
import { PageHeader, EmptyState, Spinner, Pagination, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Inbox, Plus, Send, Eye, XCircle, Clock, CheckCircle, ShoppingBag } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUT_CONFIG = {
  brouillon:  { label: 'Brouillon',   cls: 'badge-gray',   icon: Clock },
  envoye:     { label: 'Envoyée',     cls: 'badge-blue',   icon: Send },
  encaisse:   { label: 'Encaissée',   cls: 'badge-green',  icon: CheckCircle },
  annule:     { label: 'Annulée',     cls: 'badge-red',    icon: XCircle },
}

export default function PharmaCommandes() {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading]    = useState(true)
  const [page, setPage]          = useState(1)
  const [pages, setPages]        = useState(1)
  const [statut, setStatut]      = useState('')
  const [detail, setDetail]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (statut) params.statut = statut
      const { data } = await commandesAPI.getAll(params)
      setCommandes(data.data || [])
      setPages(data.pagination?.pages || 1)
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [page, statut])

  useEffect(() => { load() }, [load])

  const handleSend = async (cmd) => {
    try {
      await commandesAPI.send(cmd._id)
      toast.success('Commande envoyée au caissier !')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleCancel = async (cmd) => {
    if (!confirm('Annuler cette commande ?')) return
    try {
      await commandesAPI.cancel(cmd._id)
      toast.success('Commande annulée')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Mes commandes" subtitle="Suivi des ordonnances envoyées au caissier">
        <button onClick={() => navigate('/pharma/ordonnance')} className="btn-primary">
          <Plus size={15}/> Nouvelle ordonnance
        </button>
      </PageHeader>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'brouillon', 'envoye', 'encaisse', 'annule'].map(s => (
          <button key={s} onClick={() => { setStatut(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statut === s ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
            {s === '' ? 'Toutes' : STATUT_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200 text-left">
              <th className="px-5 py-3 font-medium text-surface-500">Référence</th>
              <th className="px-5 py-3 font-medium text-surface-500">Patient</th>
              <th className="px-5 py-3 font-medium text-surface-500">Articles</th>
              <th className="px-5 py-3 font-medium text-surface-500">Total</th>
              <th className="px-5 py-3 font-medium text-surface-500">Date</th>
              <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
              <th className="px-5 py-3"/>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center"><Spinner /></td></tr>
            ) : commandes.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon={Inbox} title="Aucune commande" description="Créez une nouvelle ordonnance."
                action={<button onClick={() => navigate('/pharma/ordonnance')} className="btn-primary">Nouvelle ordonnance</button>} /></td></tr>
            ) : commandes.map(cmd => {
              const sc = STATUT_CONFIG[cmd.statut] || STATUT_CONFIG.brouillon
              return (
                <tr key={cmd._id} className="table-row">
                  <td className="px-5 py-3.5 font-mono text-xs text-surface-600">{cmd.reference || cmd._id.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3.5 text-surface-700">{cmd.patientNom || <span className="text-surface-400">—</span>}</td>
                  <td className="px-5 py-3.5 text-surface-600">{cmd.items?.length} méd.</td>
                  <td className="px-5 py-3.5 font-semibold font-mono">{cmd.total?.toLocaleString()} F</td>
                  <td className="px-5 py-3.5 text-surface-500 text-xs">{format(new Date(cmd.createdAt), 'dd/MM/yy HH:mm')}</td>
                  <td className="px-5 py-3.5"><span className={sc.cls}>{sc.label}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setDetail(cmd)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"><Eye size={15}/></button>
                      {cmd.statut === 'brouillon' && <>
                        <button onClick={() => handleSend(cmd)} className="p-1.5 rounded-lg hover:bg-primary-50 text-surface-400 hover:text-primary-600 transition-colors" title="Envoyer au caissier"><Send size={15}/></button>
                        <button onClick={() => handleCancel(cmd)} className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors" title="Annuler"><XCircle size={15}/></button>
                      </>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-surface-100">
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Commande — ${detail?.patientNom || 'Sans nom'}`} size="md">
        {detail && <>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-surface-500">Statut : </span><span className={`${STATUT_CONFIG[detail.statut]?.cls}`}>{STATUT_CONFIG[detail.statut]?.label}</span></div>
            <div><span className="text-surface-500">Date : </span><span className="font-medium">{format(new Date(detail.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
          </div>
          {detail.notes && <div className="bg-surface-50 rounded-xl p-3 text-sm text-surface-600 mb-4">📝 {detail.notes}</div>}
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 text-left"><th className="py-2 font-medium text-surface-500">Médicament</th><th className="py-2 font-medium text-surface-500">Qté</th><th className="py-2 font-medium text-surface-500 text-right">Prix</th></tr></thead>
            <tbody>
              {detail.items?.map((item, i) => (
                <tr key={i} className="border-b border-surface-50">
                  <td className="py-2">{item.nomMedicament || item.medicineId?.nom}</td>
                  <td className="py-2">{item.quantite}</td>
                  <td className="py-2 font-mono text-right">{(item.prixUnitaire * item.quantite)?.toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between font-bold text-surface-900 mt-3 pt-3 border-t border-surface-100">
            <span>Total</span><span className="font-mono">{detail.total?.toLocaleString()} FCFA</span>
          </div>
        </>}
      </Modal>
    </div>
  )
}
