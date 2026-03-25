import { lazy, Suspense, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'

// Lazy-loaded pages (F3/F20: code splitting)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'))
const MedicineDetail = lazy(() => import('./pages/shared/MedicineDetail'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminMedicines = lazy(() => import('./pages/admin/AdminMedicines'))
const AdminStock = lazy(() => import('./pages/admin/AdminStock'))
const AdminSales = lazy(() => import('./pages/admin/AdminSales'))
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity'))

const PharmaDashboard = lazy(() => import('./pages/pharmacien/PharmaDashboard'))
const PharmaMedicines = lazy(() => import('./pages/pharmacien/PharmaMedicines'))
const PharmaStock = lazy(() => import('./pages/pharmacien/PharmaStock'))
const PharmaOrdonnance = lazy(() => import('./pages/pharmacien/PharmaOrdonnance'))
const PharmaCommandes = lazy(() => import('./pages/pharmacien/PharmaCommandes'))
const PharmaAlerts = lazy(() => import('./pages/pharmacien/PharmaAlerts'))
const PharmaReports = lazy(() => import('./pages/pharmacien/PharmaReports'))

const CaissierDashboard = lazy(() => import('./pages/caissier/CaissierDashboard'))
const CaissierCommandes = lazy(() => import('./pages/caissier/CaissierCommandes'))
const CaissierVente = lazy(() => import('./pages/caissier/CaissierVente'))
const CaissierHistorique = lazy(() => import('./pages/caissier/CaissierHistorique'))
const CaissierStock = lazy(() => import('./pages/caissier/CaissierStock'))

const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

// F2: Error Boundary — prevents white screen on JS errors
class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Une erreur est survenue</h1>
            <p className="text-sm text-slate-500 mb-4">L'application a rencontré un problème inattendu.</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
              className="btn-primary inline-flex">
              Retour à l'accueil
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function Guard({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route path="/" element={<Guard><Layout /></Guard>}>
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

          {/* Caissier routes — F4: /new BEFORE /:id to avoid route conflict */}
          <Route path="caissier/commandes"  element={<Guard roles={['caissier']}><CaissierCommandes /></Guard>} />
          <Route path="caissier/vente/new"  element={<Guard roles={['caissier']}><CaissierVente /></Guard>} />
          <Route path="caissier/vente/:id"  element={<Guard roles={['caissier']}><CaissierVente /></Guard>} />
          <Route path="caissier/historique" element={<Guard roles={['caissier']}><CaissierHistorique /></Guard>} />
          <Route path="caissier/stock"      element={<Guard roles={['caissier']}><CaissierStock /></Guard>} />

          {/* Shared */}
          <Route path="medicines/:id" element={<Guard><MedicineDetail /></Guard>} />
          <Route path="profile"       element={<Guard><ProfilePage /></Guard>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px', borderRadius: '12px' },
          success: { iconTheme: { primary: '#2e9466', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
