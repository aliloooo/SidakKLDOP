import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, FileText, ClipboardCheck, Menu, X } from 'lucide-react'

export default function PublicSidebar({ isSidebarOpen, closeSidebar }) {
    return (
        <>
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-50 
                transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand Header */}
                <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
                    <Link to="/" onClick={closeSidebar} className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 flex-shrink-0">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 text-sm leading-none block uppercase">SIDAK DOP</span>
                        </div>
                    </Link>
                    {/* Close button for mobile */}
                    <button onClick={closeSidebar} className="p-1 lg:hidden text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">

                    {/* Dashboard */}
                    <div>
                        <NavLink
                            to="/"
                            end
                            onClick={closeSidebar}
                            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </NavLink>
                    </div>

                    {/* Formulir & Input Group */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-4">
                            Formulir & Input
                        </p>
                        <div className="space-y-1">
                            <NavLink
                                to="/input-sidak"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    window.location.pathname.startsWith('/input-sidak') || window.location.pathname.startsWith('/checklist')
                                        ? 'sidebar-link-active'
                                        : 'sidebar-link'
                                }
                            >
                                <FileText className="w-4 h-4" />
                                Input Checklist KL
                            </NavLink>
                            <NavLink
                                to="/input-temuan"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    window.location.pathname.startsWith('/input-temuan') || window.location.pathname.startsWith('/form-temuan')
                                        ? 'sidebar-link-active'
                                        : 'sidebar-link'
                                }
                            >
                                <FileText className="w-4 h-4" />
                                Input Berita Acara
                            </NavLink>
                            <NavLink
                                to="/input-cpc"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    window.location.pathname.startsWith('/input-cpc') || window.location.pathname.startsWith('/form-cpc')
                                        ? 'sidebar-link-active'
                                        : 'sidebar-link'
                                }
                            >
                                <FileText className="w-4 h-4" />
                                Input Laporan CPC
                            </NavLink>
                            <NavLink
                                to="/input-tid"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    window.location.pathname.startsWith('/input-tid') || window.location.pathname.startsWith('/form-tid')
                                        ? 'sidebar-link-active'
                                        : 'sidebar-link'
                                }
                            >
                                <FileText className="w-4 h-4" />
                                Input Laporan TID
                            </NavLink>
                        </div>
                    </div>

                </nav>
            </aside>
        </>
    )
}
