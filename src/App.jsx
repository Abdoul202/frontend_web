import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Shared
import ProfilePage from './pages/shared/ProfilePage'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminMedicines  from './pages/admin/AdminMedicines'
import AdminStock      from './pages/admin/AdminStock'
import AdminSales      from './pages/admin/AdminSales'
import AdminAlerts     from './pages/admin/AdminAlerts'
import AdminReports    from './pages/admin/AdminReports'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminActivity   from './pages/admin/AdminActivity'
import MedicineDetail  from './pages/shared/MedicineDetail'

// Pharmacien pages
import PharmaDashboard from './pages/pharmacien/PharmaDashboard'
import PharmaMedicines from './pages/pharmacien/PharmaMedicines'
import PharmaStock     from './pages/pharmacien/PharmaStock'
import PharmaOrdonnance from './pages/pharmacien/PharmaOrdonnance'
import PharmaCommandes from './pages/pharmacien/PharmaCommandes'
import PharmaAlerts    from './pages/pharmacien/PharmaAlerts'
import PharmaReports   from './pages/pharmacien/PharmaReports'

// Caissier pages
import CaissierDashboard  from './pages/caissier/CaissierDashboard'
import CaissierCommandes  from './pages/caissier/CaissierCommandes'
import CaissierVente      from './pages/caissier/CaissierVente'
import CaissierHistorique from './pages/caissier/CaissierHistorique'
import CaissierStock      from './pages/caissier/CaissierStock'

function Guard({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/" element={<Guard><Layout /></Guard>}>

        {/* ── ADMIN ─────────────────────────────── */}
        <Route index element={
          <Guard>
            {user?.role === 'admin'      ? <AdminDashboard /> :
             user?.role === 'pharmacien' ? <PharmaDashboard /> :
                                          <CaissierDashboard />}
          </Guard>
        } />

        {/* Admin routes */}
        <Route path="admin/medicines"  element={<Guard roles={['admin']}><AdminMedicines /></Guard>} />
        <Route path="admin/stock"      element={<Guard roles={['admin']}><AdminStock /></Guard>} />
        <Route path="admin/sales"      element={<Guard roles={['admin']}><AdminSales /></Guard>} />
        <Route path="admin/alerts"     element={<Guard roles={['admin']}><AdminAlerts /></Guard>} />
        <Route path="admin/reports"    element={<Guard roles={['admin']}><AdminReports /></Guard>} />
        <Route path="admin/users"      element={<Guard roles={['admin']}><AdminUsers /></Guard>} />
        <Route path="admin/activity"   element={<Guard roles={['admin']}><AdminActivity /></Guard>} />

        {/* Pharmacien routes */}
        <Route path="pharma/medicines"   element={<Guard roles={['pharmacien']}><PharmaMedicines /></Guard>} />
        <Route path="pharma/stock"       element={<Guard roles={['pharmacien']}><PharmaStock /></Guard>} />
        <Route path="pharma/ordonnance"  element={<Guard roles={['pharmacien']}><PharmaOrdonnance /></Guard>} />
        <Route path="pharma/commandes"   element={<Guard roles={['pharmacien']}><PharmaCommandes /></Guard>} />
        <Route path="pharma/alerts"      element={<Guard roles={['pharmacien']}><PharmaAlerts /></Guard>} />
        <Route path="pharma/reports"     element={<Guard roles={['pharmacien']}><PharmaReports /></Guard>} />

        {/* Caissier routes */}
        <Route path="caissier/commandes"  element={<Guard roles={['caissier']}><CaissierCommandes /></Guard>} />
        <Route path="caissier/vente/:id"  element={<Guard roles={['caissier']}><CaissierVente /></Guard>} />
        <Route path="caissier/vente/new"  element={<Guard roles={['caissier']}><CaissierVente /></Guard>} />
        <Route path="caissier/historique" element={<Guard roles={['caissier']}><CaissierHistorique /></Guard>} />
        <Route path="caissier/stock"      element={<Guard roles={['caissier']}><CaissierStock /></Guard>} />

        {/* Shared */}
        <Route path="medicines/:id" element={<Guard><MedicineDetail /></Guard>} />
        <Route path="profile"       element={<Guard><ProfilePage /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px', borderRadius: '12px' },
          success: { iconTheme: { primary: '#2e9466', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
