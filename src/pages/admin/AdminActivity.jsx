import { useEffect, useState, useCallback } from 'react'
import { activityAPI } from '../../services/api'
import { PageHeader, Spinner, Pagination, SearchInput } from '../../components/ui/index'
import { format } from 'date-fns'

const COLORS = {
  CONNEXION:'badge-green', DECONNEXION:'badge-gray',
  VENTE:'badge-blue', ANNULATION_VENTE:'badge-red',
  AJOUT_MEDICAMENT:'badge-green', MODIF_MEDICAMENT:'badge-yellow', SUPPRESSION_MEDICAMENT:'badge-red',
  ENTREE_STOCK:'badge-green', CREATION_UTILISATEUR:'badge-blue',
}

export default function AdminActivity() {
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const [pages, setPages]   = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data } = await activityAPI.getAll({ page, limit: 50 }); setLogs(data.data); setPages(data.pagination?.pages || 1) }
    catch {} finally { setLoading(false) }
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Journal d'activité" subtitle="Audit complet de toutes les actions"/>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-surface-50 border-b border-surface-200 text-left">
            <th className="px-5 py-3 font-medium text-surface-500">Date</th>
            <th className="px-5 py-3 font-medium text-surface-500">Utilisateur</th>
            <th className="px-5 py-3 font-medium text-surface-500">Action</th>
            <th className="px-5 py-3 font-medium text-surface-500">Entité</th>
            <th className="px-5 py-3 font-medium text-surface-500">IP</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="py-16 text-center"><Spinner/></td></tr>
            : logs.map(log => (
              <tr key={log._id} className="table-row">
                <td className="px-5 py-3 text-xs font-mono text-surface-500">{format(new Date(log.createdAt), 'dd/MM/yy HH:mm:ss')}</td>
                <td className="px-5 py-3"><p className="font-medium text-surface-800">{log.utilisateurRef?.nom || '—'}</p><p className="text-xs text-surface-400">{log.utilisateurRef?.role}</p></td>
                <td className="px-5 py-3"><span className={`${COLORS[log.action] || 'badge-gray'} text-xs font-mono`}>{log.action}</span></td>
                <td className="px-5 py-3 text-surface-500 text-xs">{log.entite || '—'}</td>
                <td className="px-5 py-3 text-surface-400 text-xs font-mono">{log.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-surface-100"><Pagination page={page} pages={pages} onPage={setPage}/></div>
      </div>
    </div>
  )
}
