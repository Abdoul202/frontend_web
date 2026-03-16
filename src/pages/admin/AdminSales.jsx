import { useEffect, useState, useCallback } from 'react'
import { salesAPI } from '../../services/api'
import { PageHeader, EmptyState, Spinner, Pagination, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { ShoppingCart, Eye, XCircle, FileText, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const MODE_LABELS = { especes:'Espèces', mobile_money:'Mobile Money', carte:'Carte', autre:'Autre' }

export default function AdminSales() {
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
      const params = { page, limit: 25, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }
      const { data } = await salesAPI.getAll(params)
      setSales(data.data); setPages(data.pagination.pages); setCa(data.ca || 0)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const handleRecu = async s => {
    try { const { data } = await salesAPI.getRecu(s._id); window.open(URL.createObjectURL(data), '_blank') }
    catch { toast.error('Erreur reçu') }
  }

  const handleCancel = async () => {
    try { await salesAPI.cancel(cancelTarget._id, { raison: cancelRaison || 'Admin' }); toast.success('Vente annulée'); setCancelTarget(null); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Toutes les ventes" subtitle="Historique complet · Admin">
        <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2">
          <TrendingUp size={16} className="text-primary-600"/>
          <span className="text-sm font-semibold text-primary-700">{ca.toLocaleString()} FCFA</span>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="input w-auto"/>
        <input type="date" value={filters.endDate}   onChange={e => setFilters(f => ({...f, endDate:   e.target.value}))} className="input w-auto"/>
        <select value={filters.statut} onChange={e => setFilters(f => ({...f, statut: e.target.value}))} className="select w-auto">
          <option value="">Tous statuts</option><option value="valide">Valides</option><option value="annule">Annulées</option>
        </select>
        {Object.values(filters).some(v => v) && <button onClick={() => setFilters({ startDate:'', endDate:'', statut:'' })} className="btn-secondary text-xs">Réinitialiser</button>}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-surface-50 border-b border-surface-200 text-left">
            <th className="px-5 py-3 font-medium text-surface-500">Référence</th>
            <th className="px-5 py-3 font-medium text-surface-500">Date</th>
            <th className="px-5 py-3 font-medium text-surface-500">Caissier</th>
            <th className="px-5 py-3 font-medium text-surface-500">Articles</th>
            <th className="px-5 py-3 font-medium text-surface-500">Total</th>
            <th className="px-5 py-3 font-medium text-surface-500">Paiement</th>
            <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
            <th className="px-5 py-3"/>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="py-16 text-center"><Spinner/></td></tr>
            : sales.length === 0 ? <tr><td colSpan={8}><EmptyState icon={ShoppingCart} title="Aucune vente"/></td></tr>
            : sales.map(s => (
              <tr key={s._id} className="table-row">
                <td className="px-5 py-3.5 font-mono text-xs text-surface-600">{s.reference}</td>
                <td className="px-5 py-3.5 text-surface-600">{format(new Date(s.createdAt), 'dd/MM/yy HH:mm')}</td>
                <td className="px-5 py-3.5 text-surface-700">{s.caissierRef?.nom || '—'}</td>
                <td className="px-5 py-3.5 text-surface-600">{s.items?.length} art.</td>
                <td className="px-5 py-3.5 font-semibold font-mono">{s.total?.toLocaleString()} F</td>
                <td className="px-5 py-3.5 text-surface-500">{MODE_LABELS[s.modePaiement]}</td>
                <td className="px-5 py-3.5">{s.statut === 'valide' ? <span className="badge-green">Valide</span> : <span className="badge-red">Annulée</span>}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setDetail(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600"><Eye size={15}/></button>
                    <button onClick={() => handleRecu(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600"><FileText size={15}/></button>
                    {s.statut === 'valide' && <button onClick={() => { setCancelTarget(s); setCancelRaison('') }} className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500"><XCircle size={15}/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-surface-100"><Pagination page={page} pages={pages} onPage={setPage}/></div>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Vente — ${detail?.reference}`} size="lg">
        {detail && <>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-surface-500">Date : </span><span className="font-medium">{format(new Date(detail.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
            <div><span className="text-surface-500">Caissier : </span><span className="font-medium">{detail.caissierRef?.nom}</span></div>
            <div><span className="text-surface-500">Paiement : </span><span className="font-medium">{MODE_LABELS[detail.modePaiement]}</span></div>
            <div><span className="text-surface-500">Statut : </span><span className={detail.statut === 'valide' ? 'badge-green' : 'badge-red'}>{detail.statut}</span></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 text-left"><th className="py-2 font-medium text-surface-500">Médicament</th><th className="py-2 font-medium text-surface-500">Qté</th><th className="py-2 font-medium text-surface-500 text-right">Sous-total</th></tr></thead>
            <tbody>{detail.items?.map((i,x) => <tr key={x} className="border-b border-surface-50"><td className="py-2">{i.nomMedicament}</td><td className="py-2">{i.quantite}</td><td className="py-2 font-mono text-right">{i.sousTotal?.toLocaleString()} F</td></tr>)}</tbody>
          </table>
          <div className="flex justify-between font-bold text-surface-900 mt-3 pt-3 border-t border-surface-100">
            <span>Total</span><span className="font-mono text-primary-600">{detail.total?.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-end mt-4"><button onClick={() => handleRecu(detail)} className="btn-secondary"><FileText size={15}/> Reçu PDF</button></div>
        </>}
      </Modal>

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Annuler la vente" size="sm">
        <p className="text-sm text-surface-600 mb-3">Raison de l'annulation :</p>
        <textarea className="input" rows={3} value={cancelRaison} onChange={e => setCancelRaison(e.target.value)} placeholder="Motif…"/>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setCancelTarget(null)} className="btn-secondary">Retour</button>
          <button onClick={handleCancel} className="btn-danger"><XCircle size={15}/> Confirmer</button>
        </div>
      </Modal>
    </div>
  )
}
