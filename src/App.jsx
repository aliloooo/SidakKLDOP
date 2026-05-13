import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AdminRoute from './components/AdminRoute'
import PublicSidebar from './components/PublicSidebar'
import { Menu, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'

// Public pages
import Dashboard from './pages/Dashboard'
import InputSidak from './pages/InputSidak'
import Checklist from './pages/Checklist'
import DetailSidakPage from './pages/DetailSidakPage'
import InputTemuan from './pages/Temuan/InputTemuan'
import FormTemuan from './pages/Temuan/FormTemuan'
import DetailTemuanPage from './pages/Temuan/DetailTemuanPage'
import InputCPCInfo from './pages/CPC/InputCPCInfo'
import FormCPC from './pages/CPC/FormCPC'
import DetailCPCPage from './pages/CPC/DetailCPCPage'
import InputTIDInfo from './pages/TID/InputTIDInfo'
import FormTID from './pages/TID/FormTID'
import DetailTIDPage from './pages/TID/DetailTIDPage'

// Admin pages
import AdminLogin from './pages/Admin/AdminLogin'
import AdminLayout from './pages/Admin/AdminLayout'
import AspekPage from './pages/Admin/AspekPage'
import SubAspekPage from './pages/Admin/SubAspekPage'
import TemplatePage from './pages/Admin/TemplatePage'
import ResultsPage from './pages/Admin/ResultsPage'
import EditSidakPage from './pages/Admin/EditSidakPage'
import IndikatorTemuanPage from './pages/Admin/IndikatorTemuanPage'
import ResultsTemuanPage from './pages/Admin/ResultsTemuanPage'
import EditTemuanPage from './pages/Admin/EditTemuanPage'
import ResultsCPCPage from './pages/Admin/ResultsCPCPage'
import EditCPCPage from './pages/Admin/EditCPCPage'
import MasterIndikatorCPC from './pages/Admin/MasterIndikatorCPC'
import ResultsTIDPage from './pages/Admin/ResultsTIDPage'
import EditTIDPage from './pages/Admin/EditTIDPage'
import MasterIndikatorTID from './pages/Admin/MasterIndikatorTID'

function PublicLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar Component */}
      <PublicSidebar isSidebarOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile Top Header (replaces Navbar on mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">SIDAK DOP</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
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
          <Route path="/detail-sidak/:id" element={<PublicLayout><DetailSidakPage /></PublicLayout>} />
          <Route path="/edit-sidak/:id" element={<PublicLayout><EditSidakPage /></PublicLayout>} />
          
          <Route path="/input-temuan" element={<PublicLayout><InputTemuan /></PublicLayout>} />
          <Route path="/form-temuan" element={<PublicLayout><FormTemuan /></PublicLayout>} />
          <Route path="/detail-temuan/:id" element={<PublicLayout><DetailTemuanPage /></PublicLayout>} />
          <Route path="/edit-temuan/:id" element={<PublicLayout><EditTemuanPage /></PublicLayout>} />
          
          <Route path="/input-cpc" element={<PublicLayout><InputCPCInfo /></PublicLayout>} />
          <Route path="/form-cpc" element={<PublicLayout><FormCPC /></PublicLayout>} />
          <Route path="/detail-cpc/:id" element={<PublicLayout><DetailCPCPage /></PublicLayout>} />
          <Route path="/edit-cpc/:id" element={<PublicLayout><EditCPCPage /></PublicLayout>} />

          <Route path="/input-tid" element={<PublicLayout><InputTIDInfo /></PublicLayout>} />
          <Route path="/form-tid" element={<PublicLayout><FormTID /></PublicLayout>} />
          <Route path="/detail-tid/:id" element={<PublicLayout><DetailTIDPage /></PublicLayout>} />
          <Route path="/edit-tid/:id" element={<PublicLayout><EditTIDPage /></PublicLayout>} />

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
            <Route path="indikator-temuan" element={<IndikatorTemuanPage />} />
            <Route path="results-temuan" element={<ResultsTemuanPage />} />
            <Route path="results-temuan/edit/:id" element={<EditTemuanPage />} />
            <Route path="results-cpc" element={<ResultsCPCPage />} />
            <Route path="results-cpc/edit/:id" element={<EditCPCPage />} />
            <Route path="master-indikator-cpc" element={<MasterIndikatorCPC />} />
            <Route path="results-tid" element={<ResultsTIDPage />} />
            <Route path="results-tid/edit/:id" element={<EditTIDPage />} />
            <Route path="master-indikator-tid" element={<MasterIndikatorTID />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
