import { useEffect, useState } from 'react'
import { stockAPI } from '../../services/api'
import { PageHeader, SearchInput, Spinner, EmptyState } from '../../components/ui/index'
import { Eye, AlertTriangle, Package } from 'lucide-react'

export default function CaissierStock() {
  const [medicines, setMedicines] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [stats, setStats]         = useState({})

  useEffect(() => {
    stockAPI.summary()
      .then(({ data }) => {
        const meds = data.data?.medicines || []
        setMedicines(meds)
        setFiltered(meds)
        setStats(data.data?.stats || {})
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = v => {
    setSearch(v)
    if (!v.trim()) { setFiltered(medicines); return }
    const q = v.toLowerCase()
    setFiltered(medicines.filter(m => m.nom?.toLowerCase().includes(q) || m.categorie?.toLowerCase().includes(q)))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Consulter le stock" subtitle="Disponibilités en temps réel — lecture seule"/>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center"><p className="text-2xl font-display font-bold text-surface-900">{medicines.length}</p><p className="text-sm text-surface-500 mt-1">Médicaments</p></div>
          <div className="card text-center"><p className="text-2xl font-display font-bold text-amber-500">{stats.stockBas ?? 0}</p><p className="text-sm text-surface-500 mt-1">Stock bas</p></div>
          <div className="card text-center"><p className="text-2xl font-display font-bold text-red-500">{stats.expirantDans30j ?? 0}</p><p className="text-sm text-surface-500 mt-1">Expirent dans 30j</p></div>
        </div>
      )}

      <div className="mb-4">
        <SearchInput value={search} onChange={handleSearch} placeholder="Rechercher un médicament…"/>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner/></div> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-surface-50 border-b border-surface-200 text-left">
              <th className="px-5 py-3 font-medium text-surface-500">Médicament</th>
              <th className="px-5 py-3 font-medium text-surface-500">Forme</th>
              <th className="px-5 py-3 font-medium text-surface-500">Prix vente</th>
              <th className="px-5 py-3 font-medium text-surface-500">Stock disponible</th>
              <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={5}><EmptyState icon={Package} title="Aucun médicament trouvé"/></td></tr>
                : filtered.map(m => (
                  <tr key={m._id} className="table-row">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-surface-800">{m.nom}</p>
                      {m.dci && <p className="text-xs text-surface-400">{m.dci}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-surface-600 capitalize">{m.forme}{m.dosage && ` · ${m.dosage}`}</td>
                    <td className="px-5 py-3.5 font-mono font-medium text-surface-800">{m.prixVente?.toLocaleString()} F</td>
                    <td className="px-5 py-3.5 font-semibold font-mono">
                      <span className={m.quantiteTotale <= 0 ? 'text-red-600' : m.stockBas ? 'text-amber-600' : 'text-surface-800'}>
                        {m.quantiteTotale}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {m.quantiteTotale <= 0
                        ? <span className="badge-red">Rupture</span>
                        : m.stockBas
                        ? <span className="badge-yellow flex items-center gap-1 w-fit"><AlertTriangle size={11}/> Stock bas</span>
                        : <span className="badge-green">Disponible</span>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-surface-400 text-center mt-4 flex items-center justify-center gap-1">
        <Eye size={12}/> Consultation uniquement — les modifications de stock sont gérées par le pharmacien
      </p>
    </div>
  )
}
