import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import { PageHeader } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { User, KeyRound } from 'lucide-react'

const ROLE_LABELS = { admin: 'Administrateur', pharmacien: 'Pharmacien', caissier: 'Caissier' }

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [saving, setSaving] = useState(false)

  const handleChangePwd = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    setSaving(true)
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success('Mot de passe modifié')
      setForm({ currentPassword:'', newPassword:'', confirm:'' })
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title="Mon profil" />

      <div className="space-y-6">
        {/* Info */}
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
            <User size={28} className="text-primary-600" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-surface-900 text-lg">{user?.nom}</h2>
            <p className="text-surface-500 text-sm">{user?.email}</p>
            <span className="badge-green mt-1 inline-flex">{ROLE_LABELS[user?.role]}</span>
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={18} className="text-primary-600" />
            <h3 className="font-display font-semibold text-surface-800">Changer le mot de passe</h3>
          </div>
          <form onSubmit={handleChangePwd} className="space-y-4">
            <div>
              <label className="label">Mot de passe actuel</label>
              <input className="input" type="password" value={form.currentPassword}
                onChange={e => setForm(f => ({...f, currentPassword: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Nouveau mot de passe (min. 8 caractères)</label>
              <input className="input" type="password" value={form.newPassword}
                onChange={e => setForm(f => ({...f, newPassword: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Confirmer le nouveau mot de passe</label>
              <input className="input" type="password" value={form.confirm}
                onChange={e => setForm(f => ({...f, confirm: e.target.value}))} required />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Modification…' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
