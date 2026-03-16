import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicinesAPI, salesAPI } from '../../services/api'
import { PageHeader, SearchInput } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, CreditCard } from 'lucide-react'

const MODE_LABELS = { especes:'Espèces', mobile_money:'Mobile Money', carte:'Carte', autre:'Autre' }

export default function CaissierVente() {
  const navigate = useNavigate()
  const [search, setSearch]     = useState('')
  const [results, setResults]   = useState([])
  const [cart, setCart]         = useState([])
  const [mode, setMode]         = useState('especes')
  const [montantRecu, setMontant] = useState('')
  const [saving, setSaving]     = useState(false)

  const doSearch = useCallback(async (q) => {
    setSearch(q)
    if (!q.trim()) { setResults([]); return }
    try {
      const { data } = await medicinesAPI.getAll({ search: q, withStock: true, limit: 8 })
      setResults(data.data)
    } catch {}
  }, [])

  const addToCart = (med) => {
    if (med.quantiteTotale <= 0) { toast.error('Stock épuisé'); return }
    setCart(prev => {
      const exists = prev.find(i => i.medicineId === med._id)
      if (exists) {
        if (exists.quantite >= med.quantiteTotale) { toast.error('Stock insuffisant'); return prev }
        return prev.map(i => i.medicineId === med._id ? { ...i, quantite: i.quantite + 1 } : i)
      }
      return [...prev, { medicineId: med._id, nom: med.nom, forme: med.forme, prixUnitaire: med.prixVente, quantite: 1, stockDispo: med.quantiteTotale }]
    })
    setSearch(''); setResults([])
  }

  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.medicineId === id ? { ...i, quantite: Math.max(1, i.quantite + delta) } : i))
  const remove    = (id) => setCart(prev => prev.filter(i => i.medicineId !== id))
  const total     = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0)
  const monnaie   = montantRecu ? parseFloat(montantRecu) - total : 0

  const handleSubmit = async () => {
    if (!cart.length) { toast.error('Panier vide'); return }
    setSaving(true)
    try {
      const { data } = await salesAPI.create({
        items: cart.map(i => ({ medicineId: i.medicineId, quantite: i.quantite })),
        modePaiement: mode,
        montantRecu: montantRecu ? parseFloat(montantRecu) : total,
      })
      toast.success(`Vente enregistrée — ${data.data.reference}`)
      // open receipt
      try { const { data: pdf } = await salesAPI.getRecu(data.data._id); window.open(URL.createObjectURL(pdf), '_blank') } catch {}
      navigate('/caissier/historique')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la vente')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
        <ArrowLeft size={15}/> Tableau de bord
      </button>
      <PageHeader title="Vente directe" subtitle="Caisse libre — sans ordonnance"/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="card">
            <h3 className="font-display font-semibold text-surface-800 mb-3">Rechercher un médicament</h3>
            <div className="relative">
              <SearchInput value={search} onChange={doSearch} placeholder="Tapez le nom du médicament…"/>
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-card-hover z-10 overflow-hidden">
                  {results.map(m => (
                    <button key={m._id} onClick={() => addToCart(m)} disabled={m.quantiteTotale <= 0}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex justify-between gap-4 border-b border-surface-100 last:border-0 disabled:opacity-40">
                      <div>
                        <p className="text-sm font-medium text-surface-800">{m.nom}</p>
                        <p className="text-xs text-surface-400 capitalize">{m.forme}{m.dosage && ` · ${m.dosage}`}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary-600">{m.prixVente?.toLocaleString()} F</p>
                        <p className={`text-xs ${m.quantiteTotale <= m.seuilAlerte ? 'text-amber-500' : 'text-surface-400'}`}>Stock: {m.quantiteTotale}</p>
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
              Panier <span className="text-surface-400 font-normal text-sm">({cart.length} article{cart.length !== 1 ? 's' : ''})</span>
            </h3>
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart size={32} className="text-surface-200 mx-auto mb-2"/>
                <p className="text-sm text-surface-400">Recherchez un médicament pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.medicineId} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{item.nom}</p>
                      <p className="text-xs text-surface-400">{item.prixUnitaire?.toLocaleString()} FCFA / unité</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(item.medicineId, -1)} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100"><Minus size={12}/></button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantite}</span>
                      <button onClick={() => updateQty(item.medicineId, 1)} disabled={item.quantite >= item.stockDispo} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100 disabled:opacity-40"><Plus size={12}/></button>
                    </div>
                    <p className="text-sm font-semibold text-surface-800 w-20 text-right shrink-0">{(item.prixUnitaire * item.quantite).toLocaleString()} F</p>
                    <button onClick={() => remove(item.medicineId)} className="text-surface-300 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: payment */}
        <div className="lg:col-span-2">
          <div className="card sticky top-8">
            <h3 className="font-display font-semibold text-surface-800 mb-4">Encaissement</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(MODE_LABELS).map(([k,v]) => (
                    <button key={k} onClick={() => setMode(k)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${mode === k ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {mode === 'especes' && (
                <div>
                  <label className="label">Montant reçu (FCFA)</label>
                  <input className="input font-mono text-xl" type="number" value={montantRecu}
                    onChange={e => setMontant(e.target.value)} placeholder={total.toString()}/>
                  {montantRecu && monnaie >= 0 && <p className="text-sm text-primary-600 font-medium mt-1.5">Monnaie à rendre : {monnaie.toLocaleString()} FCFA</p>}
                  {montantRecu && monnaie < 0  && <p className="text-sm text-red-500 mt-1.5">Montant insuffisant ({Math.abs(monnaie).toLocaleString()} FCFA manquants)</p>}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-surface-50 rounded-xl p-4 mb-4">
              {cart.map(item => (
                <div key={item.medicineId} className="flex justify-between text-sm text-surface-600 mb-1">
                  <span className="truncate mr-2">{item.nom} ×{item.quantite}</span>
                  <span className="shrink-0">{(item.prixUnitaire * item.quantite).toLocaleString()} F</span>
                </div>
              ))}
              {cart.length > 0 && <div className="border-t border-surface-200 mt-2 pt-2 flex justify-between font-display font-bold text-surface-900 text-lg">
                <span>Total</span><span>{total.toLocaleString()} FCFA</span>
              </div>}
              {!cart.length && <p className="text-sm text-surface-400 text-center py-2">Panier vide</p>}
            </div>

            <button onClick={handleSubmit} disabled={saving || !cart.length || (mode === 'especes' && montantRecu && monnaie < 0)}
              className="btn-primary w-full justify-center py-3 text-base">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Enregistrement…</>
                : <><CreditCard size={18}/> Valider la vente</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
