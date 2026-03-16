import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refreshToken')
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh })
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  logout:         ()     => api.post('/auth/logout'),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
}

// Users
export const usersAPI = {
  getAll:        (params) => api.get('/users', { params }),
  getOne:        (id)     => api.get(`/users/${id}`),
  create:        (data)   => api.post('/users', data),
  update:        (id, data) => api.put(`/users/${id}`, data),
  toggleActif:   (id)     => api.patch(`/users/${id}/toggle-actif`),
  resetPassword: (id, data) => api.patch(`/users/${id}/reset-password`, data),
}

// Medicines
export const medicinesAPI = {
  getAll:    (params) => api.get('/medicines', { params }),
  getOne:    (id)     => api.get(`/medicines/${id}`),
  create:    (data)   => api.post('/medicines', data),
  update:    (id, data) => api.put(`/medicines/${id}`, data),
  remove:    (id)     => api.delete(`/medicines/${id}`),
  exportXLSX: ()      => api.get('/medicines/export', { responseType: 'blob' }),
  importCSV:  (form)  => api.post('/medicines/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// Stock & Lots
export const stockAPI = {
  summary:  ()       => api.get('/stock/summary'),
  addLot:   (data)   => api.post('/stock/entry', data),
  getLots:  (params) => api.get('/lots', { params }),
  updateLot:(id, data) => api.patch(`/lots/${id}`, data),
}

// Sales
export const salesAPI = {
  getAll:    (params) => api.get('/sales', { params }),
  getOne:    (id)     => api.get(`/sales/${id}`),
  create:    (data)   => api.post('/sales', data),
  cancel:    (id, data) => api.post(`/sales/${id}/annuler`, data),
  getRecu:   (id)     => api.get(`/sales/${id}/recu`, { responseType: 'blob' }),
}

// Alerts
export const alertsAPI = {
  getLowStock:  ()       => api.get('/alerts/low-stock'),
  getExpiring:  (params) => api.get('/alerts/expiring', { params }),
  getAll:       (params) => api.get('/alerts', { params }),
  markRead:     (id)     => api.patch(`/alerts/${id}/lu`),
  markAllRead:  ()       => api.patch('/alerts/mark-all-read'),
}

// Dashboard
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
}

// Reports
export const reportsAPI = {
  monthly: (params) => api.get('/reports/monthly', { params }),
  stock:   (params) => api.get('/reports/stock', { params }),
  monthlyPDF: (params) => api.get('/reports/monthly', { params: { ...params, format: 'pdf' }, responseType: 'blob' }),
  stockXLSX:  ()       => api.get('/reports/stock', { params: { format: 'xlsx' }, responseType: 'blob' }),
}

// Activity
export const activityAPI = {
  getAll: (params) => api.get('/activity', { params }),
}

export default api

// Commandes (Pharmacien → Caissier)
export const commandesAPI = {
  getAll:   (params) => api.get('/commandes', { params }),
  getOne:   (id)     => api.get(`/commandes/${id}`),
  create:   (data)   => api.post('/commandes', data),
  update:   (id, data) => api.patch(`/commandes/${id}`, data),
  send:     (id)     => api.patch(`/commandes/${id}/envoyer`),
  cancel:   (id)     => api.patch(`/commandes/${id}/annuler`),
  encaisser:(id, data) => api.post(`/commandes/${id}/encaisser`, data),
}
