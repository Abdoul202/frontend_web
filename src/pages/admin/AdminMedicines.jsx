import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicinesAPI } from '../../services/api'
import { PageHeader, SearchInput, Modal, EmptyState, Spinner, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Pill, Plus, Pencil, Trash2, Download, Upload, Eye } from 'lucide-react'

const FORMES = ['comprimé','gélule','sirop','injectable','pommade','suppositoire','sachet','gouttes','autre']
const EMPTY  = { nom:'', dci:'', forme:'comprimé', dosage:'', categorie:'', prixVente:'', prixAchat:'', seuilAlerte:'10', description:'', fabricant:'' }

export default function AdminMedicines() {
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pages, setPages]         = useState(1)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await medicinesAPI.getAll({ search, page, limit: 20, withStock: true })
      setMedicines(data.data); setPages(data.pagination.pages)
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = m => { setForm({ ...EMPTY, ...m }); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') await medicinesAPI.create(form)
      else await medicinesAPI.update(form._id, form)
      toast.success(modal === 'create' ? 'Médicament ajouté' : 'Médicament modifié')
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await medicinesAPI.remove(deleteTarget._id); toast.success('Supprimé'); setDeleteTarget(null); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleExport = async () => {
    try {
      const { data } = await medicinesAPI.exportXLSX()
      const url = URL.createObjectURL(data)
      const a = document.createElement('a'); a.href = url; a.download = 'medicaments.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Erreur export') }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try { await medicinesAPI.importCSV(fd); toast.success('Import réussi'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur import') }
    e.target.value = ''
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Médicaments" subtitle={`Catalogue complet · ${medicines.length} résultats`}>
        <label className="btn-secondary cursor-pointer"><Upload size={15}/> Import CSV <input type="file" accept=".csv" className="hidden" onChange={handleImport}/></label>
        <button onClick={handleExport} className="btn-secondary"><Download size={15}/> Export Excel</button>
        <button onClick={openCreate}   className="btn-primary"><Plus size={15}/> Ajouter</button>
      </PageHeader>

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher…" />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200 text-left">
              <th className="px-5 py-3 font-medium text-surface-500">Médicament</th>
              <th className="px-5 py-3 font-medium text-surface-500">Forme</th>
              <th className="px-5 py-3 font-medium text-surface-500">Prix vente</th>
              <th className="px-5 py-3 font-medium text-surface-500">Prix achat</th>
              <th className="px-5 py-3 font-medium text-surface-500">Stock</th>
              <th className="px-5 py-3 font-medium text-surface-500">Catégorie</th>
              <th className="px-5 py-3"/>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="py-16 text-center"><Spinner/></td></tr>
            : medicines.length === 0 ? <tr><td colSpan={7}><EmptyState icon={Pill} title="Aucun médicament" action={<button onClick={openCreate} className="btn-primary">Ajouter</button>}/></td></tr>
            : medicines.map(m => (
              <tr key={m._id} className="table-row">
                <td className="px-5 py-3.5"><p className="font-medium text-surface-800">{m.nom}</p>{m.dci && <p className="text-xs text-surface-400">{m.dci}</p>}</td>
                <td className="px-5 py-3.5 text-surface-600 capitalize">{m.forme}{m.dosage && ` · ${m.dosage}`}</td>
                <td className="px-5 py-3.5 font-mono font-medium">{m.prixVente?.toLocaleString()} F</td>
                <td className="px-5 py-3.5 font-mono text-surface-500">{m.prixAchat?.toLocaleString() || '—'} F</td>
                <td className="px-5 py-3.5"><span className={m.stockBas ? 'badge-red' : 'badge-green'}>{m.quantiteTotale ?? '—'} unités</span></td>
                <td className="px-5 py-3.5 text-surface-500">{m.categorie || '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => navigate(`/medicines/${m._id}`)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"><Eye size={15}/></button>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"><Pencil size={15}/></button>
                    <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-surface-100"><Pagination page={page} pages={pages} onPage={setPage}/></div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Ajouter un médicament' : 'Modifier'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Nom *</label><input className="input" value={form.nom} onChange={f('nom')} placeholder="Ex: Amoxicilline"/></div>
          <div><label className="label">DCI</label><input className="input" value={form.dci} onChange={f('dci')}/></div>
          <div><label className="label">Forme *</label><select className="select" value={form.forme} onChange={f('forme')}>{FORMES.map(x => <option key={x} value={x}>{x}</option>)}</select></div>
          <div><label className="label">Dosage</label><input className="input" value={form.dosage} onChange={f('dosage')} placeholder="500mg"/></div>
          <div><label className="label">Catégorie</label><input className="input" value={form.categorie} onChange={f('categorie')}/></div>
          <div><label className="label">Prix vente (FCFA) *</label><input className="input" type="number" value={form.prixVente} onChange={f('prixVente')}/></div>
          <div><label className="label">Prix achat (FCFA)</label><input className="input" type="number" value={form.prixAchat} onChange={f('prixAchat')}/></div>
          <div><label className="label">Seuil alerte stock</label><input className="input" type="number" value={form.seuilAlerte} onChange={f('seuilAlerte')}/></div>
          <div><label className="label">Fabricant</label><input className="input" value={form.fabricant} onChange={f('fabricant')}/></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.nom || !form.prixVente} className="btn-primary">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Supprimer le médicament" message={`Supprimer "${deleteTarget?.nom}" ?`} confirmLabel="Supprimer" danger/>
    </div>
  )
}
