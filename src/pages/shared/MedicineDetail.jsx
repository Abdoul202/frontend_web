import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { medicinesAPI } from '../../services/api'
import { PageHeader, Spinner } from '../../components/ui/index'
import { ArrowLeft, Pill, Package } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function MedicineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [medicine, setMedicine] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    medicinesAPI.getOne(id)
      .then(({ data }) => setMedicine(data.data))
      .catch(() => navigate('/medicines'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>
  if (!medicine) return null

  const now = new Date()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate('/medicines')} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
        <ArrowLeft size={15}/> Retour aux médicaments
      </button>

      <PageHeader title={medicine.nom} subtitle={medicine.dci || 'Sans DCI'}>
        <span className={`badge ${medicine.quantiteTotale <= medicine.seuilAlerte ? 'badge-red' : 'badge-green'}`}>
          {medicine.quantiteTotale} en stock
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info */}
        <div className="card md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Pill size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-surface-800">{medicine.nom}</h3>
              <p className="text-xs text-surface-400 capitalize">{medicine.forme} · {medicine.dosage}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              ['DCI',         medicine.dci || '—'],
              ['Catégorie',   medicine.categorie || '—'],
              ['Prix vente',  `${medicine.prixVente?.toLocaleString()} FCFA`],
              ['Prix achat',  medicine.prixAchat ? `${medicine.prixAchat?.toLocaleString()} FCFA` : '—'],
              ['Seuil alerte',`${medicine.seuilAlerte} unités`],
              ['Fabricant',   medicine.fabricant || '—'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-surface-500">{k}</dt>
                <dd className="font-medium text-surface-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Lots */}
        <div className="card md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-primary-600" />
            <h3 className="font-display font-semibold text-surface-800">Lots en stock ({medicine.lots?.length || 0})</h3>
          </div>
          {medicine.lots?.length === 0 ? (
            <p className="text-sm text-surface-400 py-4 text-center">Aucun lot disponible</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left">
                  <th className="pb-2 font-medium text-surface-500">N° Lot</th>
                  <th className="pb-2 font-medium text-surface-500">Qté</th>
                  <th className="pb-2 font-medium text-surface-500">Expiration</th>
                  <th className="pb-2 font-medium text-surface-500">Fournisseur</th>
                  <th className="pb-2 font-medium text-surface-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {medicine.lots.map(lot => {
                  const isExpired = new Date(lot.dateExpiration) <= now
                  const daysLeft  = Math.ceil((new Date(lot.dateExpiration) - now) / (1000*3600*24))
                  return (
                    <tr key={lot._id} className="table-row">
                      <td className="py-2.5 font-mono text-xs">{lot.numeroLot}</td>
                      <td className="py-2.5 font-semibold">{lot.quantite}</td>
                      <td className="py-2.5 text-surface-600">
                        {format(new Date(lot.dateExpiration), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-2.5 text-surface-500">{lot.fournisseur || '—'}</td>
                      <td className="py-2.5">
                        {isExpired
                          ? <span className="badge-red">Périmé</span>
                          : daysLeft <= 30
                          ? <span className="badge-yellow">Expire dans {daysLeft}j</span>
                          : <span className="badge-green">Valide</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
