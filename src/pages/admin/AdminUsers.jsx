import { useEffect, useState, useCallback } from 'react'
import { usersAPI } from '../../services/api'
import { PageHeader, Modal, EmptyState, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Users, Plus, Pencil, Power, KeyRound } from 'lucide-react'

const ROLE_LABELS = { admin:'Admin', pharmacien:'Pharmacien', caissier:'Caissier' }
const ROLE_COLORS = { admin:'badge-blue', pharmacien:'badge-green', caissier:'badge-yellow' }
const EMPTY = { nom:'', email:'', password:'', role:'caissier' }

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPwd, setNewPwd]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data } = await usersAPI.getAll({ limit: 100 }); setUsers(data.data) }
    catch { toast.error('Erreur') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = u => { setForm({ nom: u.nom, email: u.email, role: u.role, _id: u._id, password:'' }); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') await usersAPI.create(form)
      else await usersAPI.update(form._id, { nom: form.nom, role: form.role })
      toast.success(modal === 'create' ? 'Utilisateur créé' : 'Modifié')
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') } finally { setSaving(false) }
  }

  const handleToggle = async u => {
    try { await usersAPI.toggleActif(u._id); toast.success(u.actif ? 'Désactivé' : 'Activé'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleReset = async () => {
    if (newPwd.length < 8) { toast.error('Min. 8 caractères'); return }
    try { await usersAPI.resetPassword(resetTarget._id, { newPassword: newPwd }); toast.success('Mot de passe réinitialisé'); setResetTarget(null); setNewPwd('') }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Utilisateurs" subtitle="Gestion des comptes pharmacien et caissier">
        <button onClick={openCreate} className="btn-primary"><Plus size={15}/> Créer un compte</button>
      </PageHeader>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-surface-50 border-b border-surface-200 text-left">
            <th className="px-5 py-3 font-medium text-surface-500">Nom</th>
            <th className="px-5 py-3 font-medium text-surface-500">Email</th>
            <th className="px-5 py-3 font-medium text-surface-500">Rôle</th>
            <th className="px-5 py-3 font-medium text-surface-500">Statut</th>
            <th className="px-5 py-3 font-medium text-surface-500">Dernière connexion</th>
            <th className="px-5 py-3"/>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="py-16 text-center"><Spinner/></td></tr>
            : users.length === 0 ? <tr><td colSpan={6}><EmptyState icon={Users} title="Aucun utilisateur" action={<button onClick={openCreate} className="btn-primary">Créer</button>}/></td></tr>
            : users.map(u => (
              <tr key={u._id} className="table-row">
                <td className="px-5 py-3.5 font-medium text-surface-800">{u.nom}</td>
                <td className="px-5 py-3.5 text-surface-500">{u.email}</td>
                <td className="px-5 py-3.5"><span className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</span></td>
                <td className="px-5 py-3.5">{u.actif ? <span className="badge-green">Actif</span> : <span className="badge-gray">Inactif</span>}</td>
                <td className="px-5 py-3.5 text-surface-400 text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : 'Jamais'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600"><Pencil size={15}/></button>
                    <button onClick={() => { setResetTarget(u); setNewPwd('') }} className="p-1.5 rounded-lg hover:bg-amber-50 text-surface-400 hover:text-amber-500"><KeyRound size={15}/></button>
                    <button onClick={() => handleToggle(u)} className={`p-1.5 rounded-lg ${u.actif ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-primary-50 hover:text-primary-500'} text-surface-400`}><Power size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Créer un compte' : 'Modifier'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Nom complet *</label><input className="input" value={form.nom} onChange={f('nom')} placeholder="Prénom Nom"/></div>
          {modal === 'create' && <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={f('email')}/></div>}
          <div><label className="label">Rôle *</label>
            <select className="select" value={form.role} onChange={f('role')}>
              <option value="pharmacien">Pharmacien</option>
              <option value="caissier">Caissier</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {modal === 'create' && <div><label className="label">Mot de passe * (min. 8 car.)</label><input className="input" type="password" value={form.password} onChange={f('password')}/></div>}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.nom || (modal === 'create' && (!form.email || !form.password))} className="btn-primary">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset MDP — ${resetTarget?.nom}`} size="sm">
        <div><label className="label">Nouveau mot de passe</label><input className="input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères"/></div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setResetTarget(null)} className="btn-secondary">Annuler</button>
          <button onClick={handleReset} disabled={newPwd.length < 8} className="btn-primary">Confirmer</button>
        </div>
      </Modal>
    </div>
  )
}
