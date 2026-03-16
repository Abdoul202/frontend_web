import { useEffect, useState, useCallback } from 'react'
import { stockAPI, medicinesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Modal, EmptyState, Spinner, Pagination } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Package, Plus, AlertTriangle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function StockPage() {
  const { canEditStock } = useAuth()
  const [summary, setSummary]   = useState(null)
  const [lots, setLots]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('overview') // overview | lots
  const [modal, setModal]       = useState(false)
  const [medicines, setMedicines] = useState([])
  const [form, setForm]         = useState({ medicineId:'', numeroLot:'', quantite:'', dateExpiration:'', fournisseur:'' })
  const [saving, setSaving]     = useState(false)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await stockAPI.summary()
        setSummary(data.data)
      } else {
        const { data } = await stockAPI.getLots({ page, limit: 20 })
        setLots(data.data)
        setPages(data.pagination.pages)
      }
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [tab, page])

  useEffect(() => { load() }, [load])

  const openModal = async () => {
    if (!medicines.length) {
      const { data } = await medicinesAPI.getAll({ limit: 200 })
      setMedicines(data.data)
    }
    setForm({ medicineId:'', numeroLot:'', quantite:'', dateExpiration:'', fournisseur:'' })
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await stockAPI.addLot(form)
      toast.success('Lot ajouté avec succès')
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const now = new Date()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Stock & Lots" subtitle="Gestion des inventaires et entrées de stock">
        {canEditStock && <button onClick={openModal} className="btn-primary"><Plus size={15}/> Entrée de stock</button>}
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-6">
        {['overview','lots'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-card text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}>
            {t === 'overview' ? 'Vue d\'ensemble' : 'Tous les lots'}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner /></div> : tab === 'overview' ? (
        <>
          {/* Stats bar */}
          {summary && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card text-center">
                <p className="text-2xl font-display font-bold text-surface-900">{summary.medicines?.length}</p>
                <p className="text-sm text-surface-500 mt-1">Médicaments</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-display font-bold text-amber-500">{summary.stats?.stockBas}</p>
                <p className="text-sm text-surface-500 mt-1">Stock bas</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-display font-bold text-red-500">{summary.stats?.expirantDans30j}</p>
                <p className="text-sm text-surface-500 mt-1">Expirent dans 30j</p>
              </div>
            </div>
          )}

          {/* Medicines grid */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200 text-left">
                  <th className="px-5 py-3 font-medium text-surface-500">Médicament</th>
                  <th className="px-5 py-3 font-medium text-surface-500">Disponible</th>
                  <th className="px-5 py-3 font-medium text-surface-500">Seuil</th>
                  <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {summary?.medicines?.map(m => (
                  <tr key={m._id} className="table-row">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-surface-800">{m.nom}</p>
                      <p className="text-xs text-surface-400 capitalize">{m.forme}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold font-mono">{m.quantiteTotale}</td>
                    <td className="px-5 py-3.5 text-surface-500">{m.seuilAlerte}</td>
                    <td className="px-5 py-3.5">
                      {m.stockBas
                        ? <span className="badge-red flex items-center gap-1 w-fit"><AlertTriangle size={11}/> Stock bas</span>
                        : <span className="badge-green">OK</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Lots table */
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200 text-left">
                <th className="px-5 py-3 font-medium text-surface-500">Médicament</th>
                <th className="px-5 py-3 font-medium text-surface-500">N° Lot</th>
                <th className="px-5 py-3 font-medium text-surface-500">Quantité</th>
                <th className="px-5 py-3 font-medium text-surface-500">Expiration</th>
                <th className="px-5 py-3 font-medium text-surface-500">Fournisseur</th>
                <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
              </tr>
            </thead>
            <tbody>
              {lots.length === 0
                ? <tr><td colSpan={6}><EmptyState icon={Package} title="Aucun lot" /></td></tr>
                : lots.map(lot => {
                  const exp = new Date(lot.dateExpiration)
                  const isExpired = exp <= now
                  const daysLeft  = Math.ceil((exp - now) / (1000*3600*24))
                  return (
                    <tr key={lot._id} className="table-row">
                      <td className="px-5 py-3.5 font-medium text-surface-800">{lot.medicineId?.nom || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{lot.numeroLot}</td>
                      <td className="px-5 py-3.5 font-semibold">{lot.quantite}</td>
                      <td className="px-5 py-3.5 text-surface-600">{format(exp, 'dd/MM/yyyy')}</td>
                      <td className="px-5 py-3.5 text-surface-500">{lot.fournisseur || '—'}</td>
                      <td className="px-5 py-3.5">
                        {isExpired ? <span className="badge-red">Périmé</span>
                          : daysLeft <= 30 ? <span className="badge-yellow">{daysLeft}j restants</span>
                          : <span className="badge-green">Valide</span>}
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
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Entrée de stock — Nouveau lot">
        <div className="space-y-4">
          <div>
            <label className="label">Médicament *</label>
            <select className="select" value={form.medicineId} onChange={f('medicineId')}>
              <option value="">Sélectionner un médicament</option>
              {medicines.map(m => <option key={m._id} value={m._id}>{m.nom} ({m.forme})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numéro de lot *</label>
              <input className="input" value={form.numeroLot} onChange={f('numeroLot')} placeholder="LOT-2026-001" />
            </div>
            <div>
              <label className="label">Quantité *</label>
              <input className="input" type="number" value={form.quantite} onChange={f('quantite')} placeholder="100" />
            </div>
            <div>
              <label className="label">Date d'expiration *</label>
              <input className="input" type="date" value={form.dateExpiration} onChange={f('dateExpiration')} />
            </div>
            <div>
              <label className="label">Fournisseur</label>
              <input className="input" value={form.fournisseur} onChange={f('fournisseur')} placeholder="CAMEG" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.medicineId || !form.numeroLot || !form.quantite || !form.dateExpiration} className="btn-primary">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
