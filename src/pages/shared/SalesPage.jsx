import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { salesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, EmptyState, Spinner, Pagination, Modal, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { ShoppingCart, Plus, Eye, XCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const MODE_LABELS = { especes: 'Espèces', mobile_money: 'Mobile Money', carte: 'Carte', autre: 'Autre' }

export default function SalesPage() {
  const { isAdmin } = useAuth()
  const navigate    = useNavigate()
  const [sales, setSales]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)
  const [ca, setCa]             = useState(0)
  const [filters, setFilters]   = useState({ startDate:'', endDate:'', statut:'' })
  const [detail, setDetail]     = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelRaison, setCancelRaison] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }
      const { data } = await salesAPI.getAll(params)
      setSales(data.data)
      setPages(data.pagination.pages)
      setCa(data.ca || 0)
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const handleRecu = async (sale) => {
    try {
      const { data } = await salesAPI.getRecu(sale._id)
      const url = URL.createObjectURL(data)
      window.open(url, '_blank')
    } catch { toast.error('Erreur génération reçu') }
  }

  const handleCancel = async () => {
    try {
      await salesAPI.cancel(cancelTarget._id, { raison: cancelRaison || 'Non précisé' })
      toast.success('Vente annulée')
      setCancelTarget(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Ventes" subtitle={`CA total filtré: ${ca.toLocaleString()} FCFA`}>
        <button onClick={() => navigate('/sales/new')} className="btn-primary"><Plus size={15}/> Nouvelle vente</button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="input w-auto" />
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="input w-auto" />
        <select value={filters.statut} onChange={e => setFilters(f => ({...f, statut: e.target.value}))} className="select w-auto">
          <option value="">Tous statuts</option>
          <option value="valide">Valides</option>
          <option value="annule">Annulées</option>
        </select>
        {(filters.startDate || filters.endDate || filters.statut) && (
          <button onClick={() => setFilters({ startDate:'', endDate:'', statut:'' })} className="btn-secondary text-xs">Réinitialiser</button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200 text-left">
              <th className="px-5 py-3 font-medium text-surface-500">Référence</th>
              <th className="px-5 py-3 font-medium text-surface-500">Date</th>
              <th className="px-5 py-3 font-medium text-surface-500">Caissier</th>
              <th className="px-5 py-3 font-medium text-surface-500">Articles</th>
              <th className="px-5 py-3 font-medium text-surface-500">Total</th>
              <th className="px-5 py-3 font-medium text-surface-500">Paiement</th>
              <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-16 text-center"><Spinner /></td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={8}><EmptyState icon={ShoppingCart} title="Aucune vente" description="Les ventes apparaîtront ici." /></td></tr>
            ) : sales.map(s => (
              <tr key={s._id} className="table-row">
                <td className="px-5 py-3.5 font-mono text-xs text-surface-600">{s.reference}</td>
                <td className="px-5 py-3.5 text-surface-600">{format(new Date(s.createdAt), 'dd/MM/yy HH:mm')}</td>
                <td className="px-5 py-3.5 text-surface-700">{s.caissierRef?.nom || '—'}</td>
                <td className="px-5 py-3.5 text-surface-600">{s.items?.length} art.</td>
                <td className="px-5 py-3.5 font-semibold font-mono text-surface-900">{s.total?.toLocaleString()} F</td>
                <td className="px-5 py-3.5 text-surface-500">{MODE_LABELS[s.modePaiement]}</td>
                <td className="px-5 py-3.5">
                  {s.statut === 'valide'
                    ? <span className="badge-green">Valide</span>
                    : <span className="badge-red">Annulée</span>}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setDetail(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors" title="Détail">
                      <Eye size={15}/>
                    </button>
                    <button onClick={() => handleRecu(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors" title="Reçu PDF">
                      <FileText size={15}/>
                    </button>
                    {s.statut === 'valide' && (isAdmin || true) && (
                      <button onClick={() => { setCancelTarget(s); setCancelRaison('') }} className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors" title="Annuler">
                        <XCircle size={15}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-surface-100">
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Vente — ${detail?.reference}`} size="lg">
        {detail && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-surface-500">Date :</span> <span className="font-medium">{format(new Date(detail.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
              <div><span className="text-surface-500">Caissier :</span> <span className="font-medium">{detail.caissierRef?.nom}</span></div>
              <div><span className="text-surface-500">Paiement :</span> <span className="font-medium">{MODE_LABELS[detail.modePaiement]}</span></div>
              <div><span className="text-surface-500">Statut :</span> <span className={detail.statut === 'valide' ? 'badge-green' : 'badge-red'}>{detail.statut}</span></div>
            </div>
            <table className="w-full text-sm border-t border-surface-100 pt-4">
              <thead>
                <tr className="border-b border-surface-100 text-left">
                  <th className="py-2 font-medium text-surface-500">Médicament</th>
                  <th className="py-2 font-medium text-surface-500">Qté</th>
                  <th className="py-2 font-medium text-surface-500">Prix unit.</th>
                  <th className="py-2 font-medium text-surface-500 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {detail.items?.map((item, i) => (
                  <tr key={i} className="border-b border-surface-50">
                    <td className="py-2">{item.nomMedicament}</td>
                    <td className="py-2">{item.quantite}</td>
                    <td className="py-2 font-mono">{item.prixUnitaire?.toLocaleString()} F</td>
                    <td className="py-2 font-mono font-semibold text-right">{item.sousTotal?.toLocaleString()} F</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 font-display font-bold text-right text-surface-800">Total</td>
                  <td className="pt-3 font-display font-bold font-mono text-primary-600 text-right">{detail.total?.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRecu(detail)} className="btn-secondary"><FileText size={15}/> Télécharger reçu</button>
            </div>
          </>
        )}
      </Modal>

      {/* Cancel modal */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Annuler la vente" size="sm">
        <p className="text-sm text-surface-600 mb-3">Raison de l'annulation :</p>
        <textarea className="input" rows={3} value={cancelRaison} onChange={e => setCancelRaison(e.target.value)} placeholder="Ex: Erreur de saisie…" />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setCancelTarget(null)} className="btn-secondary">Retour</button>
          <button onClick={handleCancel} className="btn-danger"><XCircle size={15}/> Confirmer l'annulation</button>
        </div>
      </Modal>
    </div>
  )
}
