import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicinesAPI, salesAPI } from '../../services/api'
import { PageHeader, SearchInput } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Search } from 'lucide-react'

export default function NewSalePage() {
  const navigate = useNavigate()
  const [search, setSearch]     = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart]         = useState([])
  const [modePaiement, setMode] = useState('especes')
  const [montantRecu, setMontant] = useState('')
  const [saving, setSaving]     = useState(false)

  const doSearch = useCallback(async (q) => {
    setSearch(q)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await medicinesAPI.getAll({ search: q, withStock: true, limit: 10 })
      setResults(data.data)
    } catch {} finally { setSearching(false) }
  }, [])

  const addToCart = (med) => {
    setCart(prev => {
      const exists = prev.find(i => i.medicineId === med._id)
      if (exists) return prev.map(i => i.medicineId === med._id ? { ...i, quantite: i.quantite + 1 } : i)
      return [...prev, { medicineId: med._id, nom: med.nom, prixUnitaire: med.prixVente, quantite: 1, stockDispo: med.quantiteTotale }]
    })
    setSearch('')
    setResults([])
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.medicineId === id ? { ...i, quantite: Math.max(1, i.quantite + delta) } : i)
      .filter(i => i.quantite > 0)
    )
  }

  const removeItem = (id) => setCart(prev => prev.filter(i => i.medicineId !== id))

  const total     = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0)
  const monnaie   = montantRecu ? parseFloat(montantRecu) - total : 0
  const canSubmit = cart.length > 0 && (modePaiement !== 'especes' || !montantRecu || parseFloat(montantRecu) >= total)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { data } = await salesAPI.create({
        items: cart.map(i => ({ medicineId: i.medicineId, quantite: i.quantite })),
        modePaiement,
        montantRecu: montantRecu ? parseFloat(montantRecu) : total,
      })
      toast.success(`Vente enregistrée — ${data.data.reference}`)
      // Download receipt
      try {
        const { data: pdf } = await salesAPI.getRecu(data.data._id)
        const url = URL.createObjectURL(pdf)
        window.open(url, '_blank')
      } catch {}
      navigate('/sales')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la vente')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate('/sales')} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
        <ArrowLeft size={15}/> Retour aux ventes
      </button>
      <PageHeader title="Nouvelle vente" subtitle="Ajoutez les articles et validez la transaction" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Search + Cart */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="card">
            <h3 className="font-display font-semibold text-surface-800 mb-3">Rechercher un médicament</h3>
            <div className="relative">
              <SearchInput value={search} onChange={doSearch} placeholder="Nom, DCI ou code barres…" />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-card-hover z-10 overflow-hidden">
                  {results.map(m => (
                    <button key={m._id} onClick={() => addToCart(m)}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex items-center justify-between gap-4 border-b border-surface-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-surface-800">{m.nom}</p>
                        <p className="text-xs text-surface-400 capitalize">{m.forme} · {m.dosage}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary-600">{m.prixVente?.toLocaleString()} F</p>
                        <p className={`text-xs ${m.quantiteTotale <= 0 ? 'text-red-500' : 'text-surface-400'}`}>
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
              Panier <span className="text-surface-400 font-normal text-sm">({cart.length} article{cart.length !== 1 ? 's' : ''})</span>
            </h3>
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart size={32} className="text-surface-200 mx-auto mb-2" />
                <p className="text-sm text-surface-400">Le panier est vide</p>
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
                      <button onClick={() => updateQty(item.medicineId, -1)} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100 transition-colors">
                        <Minus size={12}/>
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantite}</span>
                      <button onClick={() => updateQty(item.medicineId, 1)} disabled={item.quantite >= item.stockDispo}
                        className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100 transition-colors disabled:opacity-40">
                        <Plus size={12}/>
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-surface-800 w-20 text-right shrink-0">
                      {(item.prixUnitaire * item.quantite).toLocaleString()} F
                    </p>
                    <button onClick={() => removeItem(item.medicineId)} className="text-surface-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Payment */}
        <div className="lg:col-span-2">
          <div className="card sticky top-8">
            <h3 className="font-display font-semibold text-surface-800 mb-4">Paiement</h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Mode de paiement</label>
                <select className="select" value={modePaiement} onChange={e => setMode(e.target.value)}>
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              {modePaiement === 'especes' && (
                <div>
                  <label className="label">Montant reçu (FCFA)</label>
                  <input className="input font-mono text-lg" type="number" value={montantRecu}
                    onChange={e => setMontant(e.target.value)} placeholder={total.toString()} />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-surface-50 rounded-xl p-4 space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.medicineId} className="flex justify-between text-sm text-surface-600">
                  <span>{item.nom} ×{item.quantite}</span>
                  <span>{(item.prixUnitaire * item.quantite).toLocaleString()} F</span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-2 mt-2 flex justify-between font-display font-bold text-surface-900 text-lg">
                <span>Total</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
              {montantRecu && modePaiement === 'especes' && monnaie >= 0 && (
                <div className="flex justify-between text-sm text-primary-600 font-medium">
                  <span>Rendu</span>
                  <span>{monnaie.toLocaleString()} FCFA</span>
                </div>
              )}
              {montantRecu && monnaie < 0 && (
                <p className="text-xs text-red-500 mt-1">Montant insuffisant</p>
              )}
            </div>

            <button onClick={handleSubmit} disabled={saving || !canSubmit || cart.length === 0}
              className="btn-primary w-full justify-center py-3 text-base">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Enregistrement…</>
                : <><ShoppingCart size={18}/> Valider la vente</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
