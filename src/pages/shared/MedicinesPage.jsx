import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicinesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, SearchInput, Modal, EmptyState, Spinner, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Pill, Plus, Pencil, Trash2, Download, Upload, Eye, ChevronRight } from 'lucide-react'

const FORMES = ['comprimé','gélule','sirop','injectable','pommade','suppositoire','sachet','gouttes','autre']

const emptyForm = { nom:'', dci:'', forme:'comprimé', dosage:'', categorie:'', prixVente:'', prixAchat:'', seuilAlerte:'10', description:'', fabricant:'' }

export default function MedicinesPage() {
  const { canEditStock } = useAuth()
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pages, setPages]         = useState(1)
  const [modal, setModal]         = useState(null) // null | 'create' | 'edit'
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await medicinesAPI.getAll({ search, page, limit: 20, withStock: true })
      setMedicines(data.data)
      setPages(data.pagination.pages)
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit   = (m) => {
    setForm({ nom: m.nom, dci: m.dci||'', forme: m.forme, dosage: m.dosage||'', categorie: m.categorie||'',
              prixVente: m.prixVente, prixAchat: m.prixAchat||'', seuilAlerte: m.seuilAlerte, description: m.description||'', fabricant: m.fabricant||'', _id: m._id })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') await medicinesAPI.create(form)
      else await medicinesAPI.update(form._id, form)
      toast.success(modal === 'create' ? 'Médicament ajouté' : 'Médicament modifié')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await medicinesAPI.remove(deleteTarget._id)
      toast.success('Médicament supprimé')
      setDeleteTarget(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleExport = async () => {
    try {
      const { data } = await medicinesAPI.exportXLSX()
      const url = URL.createObjectURL(data)
      const a = document.createElement('a'); a.href = url; a.download = 'medicaments.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Erreur export') }
  }

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Médicaments" subtitle={`${medicines.length} résultats`}>
        {canEditStock && <>
          <button onClick={handleExport} className="btn-secondary"><Download size={15}/> Export</button>
          <button onClick={openCreate}   className="btn-primary"><Plus size={15}/> Ajouter</button>
        </>}
      </PageHeader>

      {/* Filters */}
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher un médicament…" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200 text-left">
              <th className="px-5 py-3 font-medium text-surface-500">Médicament</th>
              <th className="px-5 py-3 font-medium text-surface-500">Forme / Dosage</th>
              <th className="px-5 py-3 font-medium text-surface-500">Prix vente</th>
              <th className="px-5 py-3 font-medium text-surface-500">Stock</th>
              <th className="px-5 py-3 font-medium text-surface-500">Catégorie</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center"><Spinner /></td></tr>
            ) : medicines.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={Pill} title="Aucun médicament" description="Ajoutez votre premier médicament." action={canEditStock && <button onClick={openCreate} className="btn-primary">Ajouter</button>} /></td></tr>
            ) : medicines.map(m => (
              <tr key={m._id} className="table-row">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-surface-800">{m.nom}</p>
                  {m.dci && <p className="text-xs text-surface-400">{m.dci}</p>}
                </td>
                <td className="px-5 py-3.5 text-surface-600 capitalize">{m.forme} {m.dosage && `· ${m.dosage}`}</td>
                <td className="px-5 py-3.5 font-mono font-medium text-surface-800">{m.prixVente?.toLocaleString()} F</td>
                <td className="px-5 py-3.5">
                  <span className={m.stockBas ? 'badge-red' : 'badge-green'}>
                    {m.quantiteTotale ?? '—'} unités
                  </span>
                </td>
                <td className="px-5 py-3.5 text-surface-500">{m.categorie || '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => navigate(`/medicines/${m._id}`)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors" title="Voir détail">
                      <Eye size={15}/>
                    </button>
                    {canEditStock && <>
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors" title="Modifier">
                        <Pencil size={15}/>
                      </button>
                      <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 size={15}/>
                      </button>
                    </>}
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

      {/* Modal Create/Edit */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Ajouter un médicament' : 'Modifier le médicament'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nom du médicament *</label>
            <input className="input" value={form.nom} onChange={f('nom')} placeholder="Ex: Amoxicilline" />
          </div>
          <div>
            <label className="label">DCI</label>
            <input className="input" value={form.dci} onChange={f('dci')} placeholder="Dénomination commune" />
          </div>
          <div>
            <label className="label">Forme *</label>
            <select className="select" value={form.forme} onChange={f('forme')}>
              {FORMES.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Dosage</label>
            <input className="input" value={form.dosage} onChange={f('dosage')} placeholder="Ex: 500mg" />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <input className="input" value={form.categorie} onChange={f('categorie')} placeholder="Ex: Antibiotique" />
          </div>
          <div>
            <label className="label">Prix de vente (FCFA) *</label>
            <input className="input" type="number" value={form.prixVente} onChange={f('prixVente')} placeholder="1500" />
          </div>
          <div>
            <label className="label">Prix d'achat (FCFA)</label>
            <input className="input" type="number" value={form.prixAchat} onChange={f('prixAchat')} placeholder="800" />
          </div>
          <div>
            <label className="label">Seuil d'alerte stock</label>
            <input className="input" type="number" value={form.seuilAlerte} onChange={f('seuilAlerte')} placeholder="10" />
          </div>
          <div>
            <label className="label">Fabricant</label>
            <input className="input" value={form.fabricant} onChange={f('fabricant')} placeholder="Nom du fabricant" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.nom || !form.prixVente} className="btn-primary">
            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Enregistrement…</> : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le médicament"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
      />
    </div>
  )
}
