import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'

// Public pages
import Dashboard from './pages/Dashboard'
import InputSidak from './pages/InputSidak'
import Checklist from './pages/Checklist'

// Admin pages
import AdminLogin from './pages/Admin/AdminLogin'
import AdminLayout from './pages/Admin/AdminLayout'
import AspekPage from './pages/Admin/AspekPage'
import SubAspekPage from './pages/Admin/SubAspekPage'
import TemplatePage from './pages/Admin/TemplatePage'
import ResultsPage from './pages/Admin/ResultsPage'
import EditSidakPage from './pages/Admin/EditSidakPage'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #e5e7eb' },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout><Dashboard /></PublicLayout>} />
          <Route path="/input-sidak" element={<PublicLayout><InputSidak /></PublicLayout>} />
          <Route path="/checklist" element={<PublicLayout><Checklist /></PublicLayout>} />
          <Route path="/edit-sidak/:id" element={<PublicLayout><EditSidakPage /></PublicLayout>} />

          {/* Admin login (no guard needed) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin protected routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/aspek" replace />} />
            <Route path="aspek" element={<AspekPage />} />
            <Route path="sub-aspek" element={<SubAspekPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="results/edit/:id" element={<EditSidakPage />} />
            <Route path="template" element={<TemplatePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
