import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ClipboardCheck, LayoutDashboard, Layers, List, FileSpreadsheet, LogOut, Menu, X, Target, FileSearch } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const navItems = [
    { 
        group: 'SIDAK',
        items: [
            { to: '/admin/aspek', label: 'Aspek', icon: Layers },
            { to: '/admin/sub-aspek', label: 'Sub Aspek', icon: List },
            { to: '/admin/results', label: 'Hasil SIDAK', icon: ClipboardCheck },
        ]
    },
    { 
        group: 'Temuan Kunjungan',
        items: [
            { to: '/admin/indikator-temuan', label: 'Master Indikator', icon: Target },
            { to: '/admin/results-temuan', label: 'Hasil Temuan', icon: FileSearch },
        ]
    },
    { 
        group: 'Laporan CPC CRO',
        items: [
            { to: '/admin/master-indikator-cpc', label: 'Master Indikator', icon: Target },
            { to: '/admin/results-cpc', label: 'Hasil Laporan CPC', icon: FileSearch },
        ]
    },
    { 
        group: 'Laporan TID',
        items: [
            { to: '/admin/master-indikator-tid', label: 'Master Indikator', icon: Target },
            { to: '/admin/results-tid', label: 'Hasil Laporan TID', icon: FileSearch },
        ]
    },
    { 
        group: 'Lainnya',
        items: [
            { to: '/admin/template', label: 'Template Excel', icon: FileSpreadsheet },
        ]
    }
]

export default function AdminLayout() {
    const { signOut } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await signOut()
        toast.success('Logout berhasil')
        window.location.href = '/'
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
    const closeSidebar = () => setIsSidebarOpen(false)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-50 
                transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand */}
                <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 text-sm">SIDAK Admin</span>
                            <span className="text-xs text-gray-400 block">Panel Manajemen</span>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={closeSidebar} className="p-1 lg:hidden text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-3 mt-4">Utama</p>
                    <NavLink to="/" onClick={closeSidebar} className="sidebar-link">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </NavLink>
                    
                    {navItems.map((group, idx) => (
                        <div key={idx} className="mt-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2">{group.group}</p>
                            {group.items.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    onClick={closeSidebar}
                                    className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Top Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">SIDAK</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

