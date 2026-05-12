import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, CheckCircle2, XCircle, ClipboardList, TrendingUp, AlertTriangle, Search, Eye } from 'lucide-react'
import { getCombinedReports, getDashboardStats } from '../services/sidakService'
import { getLatestTemplate } from '../services/templateService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
    const [sidakList, setSidakList] = useState([])
    const [statsList, setStatsList] = useState({}) // For RO stats cards
    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRo, setFilterRo] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 10


    useEffect(() => {
        loadData()
    }, [currentPage, filterRo])

    // Fetch stats and template only once
    useEffect(() => {
        const init = async () => {
            try {
                const [stats, tmpl] = await Promise.all([
                    getDashboardStats(),
                    getLatestTemplate(),
                ])
                setStatsList(stats)
                setTemplate(tmpl)
            } catch (err) {
                console.error('Initial load error:', err)
            }
        }
        init()
    }, [])

    // Reset page when search or filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterRo])

    // Refetch data when search changes (with debounce if needed, but here direct)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadData()
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])

    async function loadData() {
        setLoading(true)
        try {
            const { data, count } = await getCombinedReports({
                page: currentPage,
                pageSize,
                searchQuery,
                roFilter: filterRo
            })
            setSidakList(data)
            setTotalCount(count)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }


    // No more client-side filtering needed as it's handled server-side
    const totalPages = Math.ceil(totalCount / pageSize)


    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard SIDAK DOP</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Ringkasan hasil pengisian sidak kantor layanan</p>
                </div>
                <div className="flex items-center gap-3">
                    {template && (
                        <a
                            href={template.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </a>
                    )}
                </div>
            </div>

            {/* RO Stats Section */}
            {Object.keys(statsList).length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <TrendingUp className="w-5 h-5 text-brand-600" />
                        <h2 className="text-base font-bold text-gray-900">Statistik Input per Regional Office</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Object.entries(statsList).sort((a, b) => b[1] - a[1]).map(([roName, count]) => (

                            <div
                                key={roName}
                                onClick={() => setFilterRo(filterRo === roName ? '' : roName)}
                                className={`card p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${filterRo === roName
                                    ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-50'
                                    : 'border-brand-100/50 hover:border-brand-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${filterRo === roName ? 'text-brand-800' : 'text-brand-600/70'}`}>{roName}</span>
                                <span className={`text-2xl font-black ${filterRo === roName ? 'text-brand-700' : 'text-gray-900'}`}>{count}</span>
                                <span className={`text-[10px] font-medium ${filterRo === roName ? 'text-brand-600' : 'text-gray-400'}`}>Laporan Kunjungan</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Daftar Hasil SIDAK</h2>
                        <span className="text-xs text-gray-400">{totalCount} entri</span>
                    </div>
                </div>


                {/* Search Bar - only show if there's data or we're searching */}
                {(Object.keys(statsList).length > 0 || searchQuery) && (

                    <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan RO atau Kantor Layanan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                )}

                {totalCount === 0 && !loading ? (

                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertTriangle className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada data SIDAK</p>
                        <p className="text-gray-400 text-sm mt-1">Silakan gunakan menu di sidebar untuk melakukan pengisian</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th rounded-tl-none">No</th>
                                    <th className="table-th text-left">Nama RO</th>
                                    <th className="table-th text-left">Nama KL</th>
                                    <th className="table-th text-left">Tipe Laporan</th>
                                    <th className="table-th text-left">Tanggal Kunjungan</th>
                                    <th className="table-th text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sidakList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="table-td text-center py-10 text-gray-500 italic">
                                            Tidak ada hasil yang sesuai dengan pencarian "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : (
                                    sidakList.map((sidak, idx) => (
                                        <tr key={sidak.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="table-td text-gray-400 font-medium w-10">
                                                {(currentPage - 1) * pageSize + idx + 1}
                                            </td>

                                            <td className="table-td font-medium text-gray-900">{sidak.nama_ro}</td>
                                            <td className="table-td">
                                                {sidak.tipe_laporan?.toUpperCase().includes('CPC') && sidak.nama_kl?.startsWith('CPC - ') 
                                                    ? sidak.nama_kl.replace('CPC - ', '') 
                                                    : sidak.nama_kl}
                                            </td>
                                            <td className="table-td">
                                                <div className="flex items-center gap-1.5">
                                                    {sidak.tipe_laporan?.toUpperCase().includes('TEMUAN') ? (
                                                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Temuan Kunjungan</span>
                                                        </div>
                                                    ) : sidak.tipe_laporan?.toUpperCase().includes('CPC') ? (
                                                        <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-100">
                                                            <ClipboardList className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Laporan CPC CRO</span>
                                                        </div>
                                                    ) : sidak.tipe_laporan?.toUpperCase().includes('TID') ? (
                                                        <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">
                                                            <ClipboardList className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Laporan TID</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                                                            <ClipboardList className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Checklist KL</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="table-td whitespace-nowrap">
                                                {new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="table-td text-center">
                                                <Link
                                                    to={
                                                        sidak.tipe_laporan?.toUpperCase().includes('TEMUAN') ? `/detail-temuan/${sidak.id}` : 
                                                        sidak.tipe_laporan?.toUpperCase().includes('CPC') ? `/detail-cpc/${sidak.id}` : 
                                                        sidak.tipe_laporan?.toUpperCase().includes('TID') ? `/detail-tid/${sidak.id}` : 
                                                        `/detail-sidak/${sidak.id}`
                                                    }
                                                    className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-700"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                        <p className="text-xs text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</span> sampai <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalCount)}</span> dari <span className="font-semibold text-gray-900">{totalCount}</span> laporan
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sebelumnya
                            </button>
                            <div className="flex items-center gap-1 mx-2">
                                <span className="text-xs font-medium text-gray-900">{currentPage}</span>
                                <span className="text-xs text-gray-400">/</span>
                                <span className="text-xs text-gray-500">{totalPages || 1}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
