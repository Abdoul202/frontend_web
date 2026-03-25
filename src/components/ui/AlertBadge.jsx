import { useEffect, useState } from 'react'
import { alertsAPI, commandesAPI } from '../../services/api'

export default function AlertBadge({ role, navKey }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const loadCount = async () => {
      try {
        if (navKey?.includes('commandes') && role === 'caissier') {
          const { data } = await commandesAPI.getAll({ statut: 'envoye', limit: 1 })
          setCount(data.pagination?.total || 0)
        } else if (navKey?.includes('alerts') || navKey?.includes('alertes')) {
          const { data } = await alertsAPI.getAll({ lu: false, limit: 1 })
          setCount(data.unreadCount || 0)
        }
      } catch {}
    }
    loadCount()
    const t = setInterval(loadCount, 60000)
    return () => clearInterval(t)
  }, [role, navKey])

  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
      {count > 9 ? '9+' : count}
    </span>
  )
}
