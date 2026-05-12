import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Edit2, Trash2, Calendar, Building2, MapPin } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ResultsTIDPage() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadReports()
    }, [])

    async function loadReports() {
        try {
            const { data, error } = await supabase
                .from('laporan_tid_header')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setReports(data)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return

        try {
            const { error } = await supabase
                .from('laporan_tid_header')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Laporan berhasil dihapus')
            setReports(reports.filter(r => r.id !== id))
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        }
    }

    const filteredReports = reports.filter(r => 
        r.nama_vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nama_ro?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hasil Laporan TID</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola dan pantau seluruh laporan kunjungan TID</p>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan RO atau Kantor Layanan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-6 py-4 text-center w-12 font-bold text-gray-400 uppercase text-[10px] tracking-widest">No</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Kantor Layanan</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Regional Office</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Tanggal Kunjungan</th>
                                <th className="px-6 py-4 text-center font-bold text-gray-400 uppercase text-[10px] tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredReports.map((report, idx) => (
                                <tr key={report.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-center font-bold text-gray-300">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{report.nama_vendor}</span>
                                            <span className="text-[10px] text-gray-400 uppercase font-medium truncate max-w-[200px]">{report.alamat_tid}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">{report.nama_ro}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="font-medium">
                                                {new Date(report.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                to={`/detail-tid/${report.id}`}
                                                className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                to={`/admin/results-tid/edit/${report.id}`}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Edit Laporan"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(report.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus Laporan"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        Tidak ada laporan yang ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
