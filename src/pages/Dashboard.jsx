import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, CheckCircle2, XCircle, ClipboardList, TrendingUp, AlertTriangle, Search, Pencil } from 'lucide-react'
import { getSidakList } from '../services/sidakService'
import { getLatestTemplate } from '../services/templateService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
    const [sidakList, setSidakList] = useState([])
    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [sidak, tmpl] = await Promise.all([
                getSidakList(),
                getLatestTemplate(),
            ])
            setSidakList(sidak)
            setTemplate(tmpl)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    // Filtered list based on search
    const filteredList = sidakList.filter(s =>
        s.nama_ro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nama_kl.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard SIDAK</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Ringkasan hasil pengisian checklist kantor layanan</p>
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
                    <Link to="/input-sidak" className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Input SIDAK
                    </Link>
                </div>
            </div>

            {/* RO Stats Section */}
            {sidakList.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <TrendingUp className="w-5 h-5 text-brand-600" />
                        <h2 className="text-base font-bold text-gray-900">Statistik Input per Regional Office</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Object.entries(
                            sidakList.reduce((acc, curr) => {
                                acc[curr.nama_ro] = (acc[curr.nama_ro] || 0) + 1;
                                return acc;
                            }, {})
                        ).sort((a, b) => b[1] - a[1]).map(([roName, count]) => (
                            <div key={roName} className="card p-3 flex flex-col items-center justify-center text-center border-brand-100/50 hover:border-brand-200 transition-colors">
                                <span className="text-[10px] font-bold text-brand-600/70 uppercase tracking-widest mb-1">{roName}</span>
                                <span className="text-2xl font-black text-gray-900">{count}</span>
                                <span className="text-[10px] text-gray-400 font-medium">Laporan Kunjungan</span>
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
                        <span className="text-xs text-gray-400">{sidakList.length} entri</span>
                    </div>
                </div>

                {/* Search Bar - only show if list has items */}
                {sidakList.length > 0 && (
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

                {sidakList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertTriangle className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada data SIDAK</p>
                        <p className="text-gray-400 text-sm mt-1">Klik "Input SIDAK" untuk menambahkan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th rounded-tl-none">No</th>
                                    <th className="table-th text-left">Nama RO</th>
                                    <th className="table-th text-left">Nama KL</th>
                                    <th className="table-th text-left">Tanggal Kunjungan</th>
                                    <th className="table-th text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="table-td text-center py-10 text-gray-500 italic">
                                            Tidak ada hasil yang sesuai dengan pencarian "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : (
                                    filteredList.map((sidak, idx) => (
                                        <tr key={sidak.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="table-td text-gray-400 font-medium w-10">{idx + 1}</td>
                                            <td className="table-td font-medium text-gray-900">{sidak.nama_ro}</td>
                                            <td className="table-td">{sidak.nama_kl}</td>
                                            <td className="table-td whitespace-nowrap">
                                                {new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="table-td text-center">
                                                <Link
                                                    to={`/edit-sidak/${sidak.id}`}
                                                    className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
