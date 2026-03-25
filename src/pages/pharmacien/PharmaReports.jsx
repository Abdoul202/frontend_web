import { useState } from 'react'
import { reportsAPI } from '../../services/api'
import { PageHeader } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { Download, BarChart2, Package } from 'lucide-react'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function PharmaReports() {
  const [year, setYear]     = useState(new Date().getFullYear())
  const [month, setMonth]   = useState(new Date().getMonth() + 1)
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadMonthly = async () => {
    setLoading(true)
    try { const { data } = await reportsAPI.monthly({ year, month }); setMonthly(data.data) }
    catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  const downloadPDF = async () => {
    try {
      const { data } = await reportsAPI.monthlyPDF({ year, month })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a'); a.href = url; a.download = `rapport-${year}-${month}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Erreur PDF') }
  }

  const downloadStockXLSX = async () => {
    try {
      const { data } = await reportsAPI.stockXLSX()
      const url = URL.createObjectURL(data)
      const a = document.createElement('a'); a.href = url; a.download = 'rapport-stock.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Erreur XLSX') }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Rapports" subtitle="Analyse mensuelle et exports"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><BarChart2 size={18} className="text-primary-600"/><h3 className="font-display font-semibold text-surface-800">Rapport mensuel</h3></div>
          <div className="flex gap-3 mb-4">
            <select className="select" value={month} onChange={e => setMonth(parseInt(e.target.value))}>{MONTHS_FR.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select>
            <select className="select w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>{Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={loadMonthly} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Chargement…' : 'Afficher'}</button>
            <button onClick={downloadPDF} className="btn-secondary"><Download size={15}/> PDF</button>
          </div>
          {monthly && (
            <div className="pt-4 border-t border-surface-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary-50 rounded-xl p-3 text-center"><p className="text-xl font-display font-bold text-primary-700">{monthly.totalCA?.toLocaleString()}</p><p className="text-xs text-primary-500 mt-0.5">FCFA — CA</p></div>
                <div className="bg-surface-50 rounded-xl p-3 text-center"><p className="text-xl font-display font-bold text-surface-700">{monthly.totalVentes}</p><p className="text-xs text-surface-400 mt-0.5">Ventes</p></div>
              </div>
              {monthly.topProducts?.length > 0 && (
                <div><p className="text-xs font-medium text-surface-500 mb-2">Top produits</p>
                  {monthly.topProducts.slice(0,5).map((p,i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-surface-100 last:border-0">
                      <span className="text-surface-700">{p.nom}</span><span className="text-surface-500">{p.qte} unités</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><Package size={18} className="text-primary-600"/><h3 className="font-display font-semibold text-surface-800">Rapport de stock</h3></div>
          <p className="text-sm text-surface-500 mb-6">Export Excel complet — état du stock, lots actifs, expirations.</p>
          <button onClick={downloadStockXLSX} className="btn-primary w-full justify-center"><Download size={15}/> Exporter Excel (.xlsx)</button>
        </div>
      </div>
    </div>
  )
}
