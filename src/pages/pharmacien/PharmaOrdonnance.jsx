import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicinesAPI, commandesAPI } from '../../services/api'
import { PageHeader, SearchInput } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Minus, Trash2, Send, ClipboardList, Save } from 'lucide-react'

export default function PharmaOrdonnance() {
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [results, setResults] = useState([])
  const [cart, setCart]       = useState([])
  const [notes, setNotes]     = useState('')
  const [patientNom, setPatientNom] = useState('')
  const [saving, setSaving]   = useState(false)
  const [sending, setSending] = useState(false)

  const doSearch = useCallback(async (q) => {
    setSearch(q)
    if (!q.trim()) { setResults([]); return }
    try {
      const { data } = await medicinesAPI.getAll({ search: q, withStock: true, limit: 10 })
      setResults(data.data)
    } catch {}
  }, [])

  const addToCart = (med) => {
    if (med.quantiteTotale <= 0) { toast.error('Stock insuffisant pour ce médicament'); return }
    setCart(prev => {
      const exists = prev.find(i => i.medicineId === med._id)
      if (exists) return prev.map(i => i.medicineId === med._id ? { ...i, quantite: i.quantite + 1 } : i)
      return [...prev, { medicineId: med._id, nom: med.nom, forme: med.forme, dosage: med.dosage, prixUnitaire: med.prixVente, quantite: 1, stockDispo: med.quantiteTotale }]
    })
    setSearch(''); setResults([])
  }

  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.medicineId === id ? { ...i, quantite: Math.max(1, i.quantite + delta) } : i))
  const remove    = (id) => setCart(prev => prev.filter(i => i.medicineId !== id))
  const total     = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0)

  const buildPayload = () => ({
    patientNom,
    notes,
    items: cart.map(i => ({ medicineId: i.medicineId, quantite: i.quantite })),
  })

  const handleSave = async () => {
    if (!cart.length) { toast.error('Ajoutez au moins un médicament'); return }
    setSaving(true)
    try {
      await commandesAPI.create(buildPayload())
      toast.success('Commande sauvegardée en brouillon')
      navigate('/pharma/commandes')
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleSend = async () => {
    if (!cart.length) { toast.error('Ajoutez au moins un médicament'); return }
    setSending(true)
    try {
      const { data } = await commandesAPI.create(buildPayload())
      await commandesAPI.send(data.data._id)
      toast.success('Commande envoyée au caissier !')
      navigate('/pharma/commandes')
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSending(false) }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate('/pharma/commandes')} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
        <ArrowLeft size={15}/> Mes commandes
      </button>
      <PageHeader title="Nouvelle ordonnance" subtitle="Composez la commande et envoyez-la au caissier" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: search + cart */}
        <div className="lg:col-span-3 space-y-4">
          {/* Patient */}
          <div className="card">
            <label className="label">Patient (optionnel)</label>
            <input className="input" value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder="Nom du patient" />
          </div>

          {/* Search */}
          <div className="card">
            <h3 className="font-display font-semibold text-surface-800 mb-3">Rechercher un médicament</h3>
            <div className="relative">
              <SearchInput value={search} onChange={doSearch} placeholder="Nom du médicament, DCI…" />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-card-hover z-10 overflow-hidden">
                  {results.map(m => (
                    <button key={m._id} onClick={() => addToCart(m)}
                      disabled={m.quantiteTotale <= 0}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex justify-between gap-4 border-b border-surface-100 last:border-0 disabled:opacity-50 disabled:cursor-not-allowed">
                      <div>
                        <p className="text-sm font-medium text-surface-800">{m.nom}</p>
                        <p className="text-xs text-surface-400 capitalize">{m.forme} · {m.dosage}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary-600">{m.prixVente?.toLocaleString()} F</p>
                        <p className={`text-xs ${m.quantiteTotale <= m.seuilAlerte ? 'text-amber-500' : 'text-surface-400'}`}>
                          Stock: {m.quantiteTotale}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="card">
            <h3 className="font-display font-semibold text-surface-800 mb-3">
              Articles <span className="text-surface-400 font-normal text-sm">({cart.length})</span>
            </h3>
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardList size={32} className="text-surface-200 mx-auto mb-2" />
                <p className="text-sm text-surface-400">Aucun médicament sélectionné</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.medicineId} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{item.nom}</p>
                      <p className="text-xs text-surface-400 capitalize">{item.forme} · {item.dosage}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(item.medicineId, -1)} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100">
                        <Minus size={12}/>
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantite}</span>
                      <button onClick={() => updateQty(item.medicineId, 1)} disabled={item.quantite >= item.stockDispo}
                        className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100 disabled:opacity-40">
                        <Plus size={12}/>
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-surface-800 w-20 text-right shrink-0">
                      {(item.prixUnitaire * item.quantite).toLocaleString()} F
                    </p>
                    <button onClick={() => remove(item.medicineId)} className="text-surface-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: summary + actions */}
        <div className="lg:col-span-2">
          <div className="card sticky top-8 space-y-4">
            <h3 className="font-display font-semibold text-surface-800">Récapitulatif</h3>

            {patientNom && (
              <div className="bg-primary-50 rounded-xl px-3 py-2 text-sm">
                <span className="text-surface-500">Patient : </span>
                <span className="font-medium text-surface-800">{patientNom}</span>
              </div>
            )}

            <div>
              <label className="label">Notes / instructions</label>
              <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Prendre 3x/jour après repas…" />
            </div>

            {/* Items summary */}
            <div className="bg-surface-50 rounded-xl p-4 space-y-2">
              {cart.map(item => (
                <div key={item.medicineId} className="flex justify-between text-sm text-surface-600">
                  <span className="truncate mr-2">{item.nom} ×{item.quantite}</span>
                  <span className="shrink-0">{(item.prixUnitaire * item.quantite).toLocaleString()} F</span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-2 flex justify-between font-display font-bold text-surface-900">
                <span>Total estimé</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={handleSend} disabled={sending || !cart.length}
                className="btn-primary w-full justify-center py-3">
                {sending
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Envoi…</>
                  : <><Send size={16}/> Envoyer au caissier</>}
              </button>
              <button onClick={handleSave} disabled={saving || !cart.length}
                className="btn-secondary w-full justify-center">
                {saving ? 'Sauvegarde…' : <><Save size={15}/> Sauvegarder brouillon</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
