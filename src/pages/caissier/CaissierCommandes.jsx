import { useEffect, useState, useCallback } from 'react'
import { commandesAPI } from '../../services/api'
import { PageHeader, EmptyState, Spinner, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Inbox, Eye, CreditCard, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const MODE_LABELS = { especes:'Espèces', mobile_money:'Mobile Money', carte:'Carte', autre:'Autre' }

export default function CaissierCommandes() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading]    = useState(true)
  const [tab, setTab]            = useState('envoye')
  const [detail, setDetail]      = useState(null)
  const [encaissModal, setEncaissModal] = useState(null)
  const [payForm, setPayForm]    = useState({ modePaiement: 'especes', montantRecu: '' })
  const [saving, setSaving]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await commandesAPI.getAll({ statut: tab, limit: 50 })
      setCommandes(data.data || [])
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }, [tab])

  useEffect(() => { load() }, [load])

  const openEncaiss = (cmd) => {
    setEncaissModal(cmd)
    setPayForm({ modePaiement: 'especes', montantRecu: cmd.total?.toString() || '' })
  }

  const handleEncaiss = async () => {
    setSaving(true)
    try {
      await commandesAPI.encaisser(encaissModal._id, {
        modePaiement: payForm.modePaiement,
        montantRecu: parseFloat(payForm.montantRecu) || encaissModal.total,
      })
      toast.success('Commande encaissée — reçu généré')
      setEncaissModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const monnaie = encaissModal && payForm.montantRecu
    ? parseFloat(payForm.montantRecu) - encaissModal.total
    : 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Commandes reçues" subtitle="Ordonnances du pharmacien à encaisser"/>

      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-6">
        {[{id:'envoye',label:'À traiter'},{id:'encaisse',label:'Encaissées'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-card text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner/></div> : (
        <div className="space-y-3">
          {commandes.length === 0 ? (
            <div className="card text-center py-16">
              <CheckCircle size={40} className="text-surface-200 mx-auto mb-3"/>
              <p className="font-display font-semibold text-surface-700 mb-1">
                {tab === 'envoye' ? 'Aucune commande en attente' : 'Aucune commande encaissée'}
              </p>
              <p className="text-sm text-surface-400">{tab === 'envoye' ? 'Le pharmacien n\'a envoyé aucune ordonnance' : ''}</p>
            </div>
          ) : commandes.map(cmd => (
            <div key={cmd._id} className={`card hover:shadow-card-hover transition-shadow ${tab === 'envoye' ? 'border-blue-200 bg-blue-50/30' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {tab === 'envoye'
                      ? <span className="badge-blue flex items-center gap-1"><Clock size={11}/> À encaisser</span>
                      : <span className="badge-green flex items-center gap-1"><CheckCircle size={11}/> Encaissée</span>}
                    <span className="text-xs text-surface-400">{format(new Date(cmd.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                  </div>
                  <p className="font-display font-semibold text-surface-900">
                    {cmd.patientNom || 'Patient anonyme'}
                  </p>
                  <p className="text-sm text-surface-500 mt-0.5">
                    Pharmacien : {cmd.pharmacienRef?.nom || '—'} · {cmd.items?.length} médicament{cmd.items?.length !== 1 ? 's' : ''}
                  </p>
                  {cmd.notes && <p className="text-xs text-surface-500 mt-1 italic">📝 {cmd.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-display font-bold text-surface-900">{cmd.total?.toLocaleString()}</p>
                  <p className="text-xs text-surface-400">FCFA</p>
                </div>
              </div>

              {/* Items preview */}
              <div className="mt-3 pt-3 border-t border-surface-100 flex flex-wrap gap-2">
                {cmd.items?.map((item, i) => (
                  <span key={i} className="badge-gray text-xs">
                    {item.nomMedicament || item.medicineId?.nom} ×{item.quantite}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => setDetail(cmd)} className="btn-secondary text-xs">
                  <Eye size={13}/> Détail
                </button>
                {tab === 'envoye' && (
                  <button onClick={() => openEncaiss(cmd)} className="btn-primary text-xs">
                    <CreditCard size={13}/> Encaisser
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Ordonnance — ${detail?.patientNom || 'Patient anonyme'}`} size="md">
        {detail && <>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-surface-500">Pharmacien : </span><span className="font-medium">{detail.pharmacienRef?.nom || '—'}</span></div>
            <div><span className="text-surface-500">Date : </span><span className="font-medium">{format(new Date(detail.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
          </div>
          {detail.notes && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-surface-700 mb-4 italic">📝 {detail.notes}</div>}
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 text-left"><th className="py-2 font-medium text-surface-500">Médicament</th><th className="py-2 font-medium text-surface-500">Forme</th><th className="py-2 font-medium text-surface-500">Qté</th><th className="py-2 font-medium text-surface-500 text-right">Prix</th></tr></thead>
            <tbody>
              {detail.items?.map((item, i) => (
                <tr key={i} className="border-b border-surface-50">
                  <td className="py-2 font-medium">{item.nomMedicament || item.medicineId?.nom}</td>
                  <td className="py-2 text-surface-500 capitalize text-xs">{item.forme}</td>
                  <td className="py-2">{item.quantite}</td>
                  <td className="py-2 font-mono text-right">{(item.prixUnitaire * item.quantite)?.toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between font-bold text-surface-900 mt-3 pt-3 border-t border-surface-100">
            <span>Total</span><span className="font-mono text-primary-600">{detail.total?.toLocaleString()} FCFA</span>
          </div>
          {detail.statut === 'envoye' && (
            <div className="flex justify-end mt-4">
              <button onClick={() => { setDetail(null); openEncaiss(detail) }} className="btn-primary"><CreditCard size={15}/> Encaisser cette commande</button>
            </div>
          )}
        </>}
      </Modal>

      {/* Encaissement modal */}
      <Modal open={!!encaissModal} onClose={() => setEncaissModal(null)} title="Encaissement" size="sm">
        {encaissModal && <>
          <div className="bg-surface-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-surface-600 mb-1">Patient : <span className="font-medium text-surface-800">{encaissModal.patientNom || 'Anonyme'}</span></p>
            <p className="text-2xl font-display font-bold text-surface-900">{encaissModal.total?.toLocaleString()} <span className="text-sm font-normal text-surface-500">FCFA</span></p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Mode de paiement</label>
              <select className="select" value={payForm.modePaiement} onChange={e => setPayForm(p => ({...p, modePaiement: e.target.value}))}>
                {Object.entries(MODE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {payForm.modePaiement === 'especes' && (
              <div>
                <label className="label">Montant reçu (FCFA)</label>
                <input className="input font-mono text-lg" type="number" value={payForm.montantRecu}
                  onChange={e => setPayForm(p => ({...p, montantRecu: e.target.value}))}/>
                {payForm.montantRecu && monnaie >= 0 && (
                  <p className="text-sm text-primary-600 font-medium mt-1.5">Rendu : {monnaie.toLocaleString()} FCFA</p>
                )}
                {payForm.montantRecu && monnaie < 0 && (
                  <p className="text-sm text-red-500 mt-1.5">Montant insuffisant</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEncaissModal(null)} className="btn-secondary">Annuler</button>
            <button onClick={handleEncaiss} disabled={saving || (payForm.modePaiement === 'especes' && payForm.montantRecu && monnaie < 0)} className="btn-primary">
              {saving ? 'Enregistrement…' : <><CreditCard size={15}/> Confirmer l'encaissement</>}
            </button>
          </div>
        </>}
      </Modal>
    </div>
  )
}
