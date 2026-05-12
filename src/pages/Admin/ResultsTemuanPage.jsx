import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, AlertTriangle, Building2, Calendar, User, Download, MapPin, X, Pencil } from 'lucide-react'
import { getTemuanList, getTemuanById, deleteTemuan } from '../../services/temuanService'
import { generatePDF } from '../../utils/pdfGenerator'
import DigitalStamp from '../../components/DigitalStamp'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const RO_OPTIONS = [
    "RO 1/Medan", "RO 2/ Pekanbaru", "RO 3/Padang", "RO 4/Palembang",
    "RO 5/ Bandar Lampung", "RO 6/ Jakarta 1", "RO 7/ Jakarta 2",
    "RO 8/ Jakarta 3", "RO 9/Bandung", "RO 10/Semarang",
    "RO 11/Yogyakarta", "RO 12/Surabaya", "RO 13/Malang",
    "RO 14/Banjarmasin", "RO 15/Makassar", "RO 16/Manado",
    "RO 17/Denpasar", "RO 18/Jayapura"
]

export default function ResultsTemuanPage() {
    const [temuanList, setTemuanList] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRo, setFilterRo] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 10

    // Modal state
    const [viewData, setViewData] = useState(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)

    useEffect(() => {
        loadData()
    }, [currentPage, filterRo])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterRo])

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadData()
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])

    async function loadData() {
        setLoading(true)
        try {
            const { data, count } = await getTemuanList({
                page: currentPage,
                pageSize,
                searchQuery,
                roFilter: filterRo
            })
            setTemuanList(data)
            setTotalCount(count)
        } catch (err) {
            toast.error('Gagal memuat data')
        } finally {
            setLoading(false)
        }
    }

    async function handleView(id) {
        setLoadingDetail(true)
        setIsViewModalOpen(true)
        try {
            const data = await getTemuanById(id)
            setViewData(data)
        } catch (err) {
            toast.error('Gagal memuat detail')
            setIsViewModalOpen(false)
        } finally {
            setLoadingDetail(false)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Yakin ingin menghapus data temuan ini? Semua data terkait akan terhapus permanen.')) return
        try {
            await deleteTemuan(id)
            toast.success('Data temuan berhasil dihapus')
            loadData()
        } catch (err) {
            toast.error('Gagal menghapus data')
        }
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hasil Temuan Kunjungan</h1>
                    <p className="text-sm text-gray-500 mt-1">Daftar laporan form temuan kunjungan yang telah masuk</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama RO atau Kantor Layanan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
                <div className="sm:w-64">
                    <select
                        value={filterRo}
                        onChange={(e) => setFilterRo(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                        <option value="">Semua Regional Office</option>
                        {RO_OPTIONS.map(ro => (
                            <option key={ro} value={ro}>{ro}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                {totalCount === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertTriangle className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada laporan temuan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th w-16 text-center">No</th>
                                    <th className="table-th text-left">Regional Office</th>
                                    <th className="table-th text-left">Kantor Layanan</th>
                                    <th className="table-th text-left">Tanggal</th>
                                    <th className="table-th text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && temuanList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center"><LoadingSpinner /></td>
                                    </tr>
                                ) : (
                                    temuanList.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="table-td text-center text-gray-400 font-medium">
                                                {(currentPage - 1) * pageSize + idx + 1}
                                            </td>
                                            <td className="table-td font-medium text-gray-900">{item.nama_ro}</td>
                                            <td className="table-td text-gray-600">{item.nama_kl}</td>
                                            <td className="table-td whitespace-nowrap text-gray-500">
                                                {new Date(item.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="table-td">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleView(item.id)} className="btn-secondary px-3 py-1.5 text-xs">
                                                        <Eye className="w-3.5 h-3.5" /> Detail
                                                    </button>
                                                    <Link to={`/admin/results-temuan/edit/${item.id}`} className="btn-secondary px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50">
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </Link>
                                                    <button onClick={() => handleDelete(item.id)} className="btn-secondary px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200">
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {totalCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-xs text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalCount)}</span> dari <span className="font-semibold text-gray-900">{totalCount}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg disabled:opacity-50"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-xs font-medium px-2">{currentPage} / {totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg disabled:opacity-50"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail View */}
            {isViewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-5xl my-8 shadow-2xl relative flex flex-col max-h-[90vh]">
                        {loadingDetail ? (
                            <div className="p-12"><LoadingSpinner /></div>
                        ) : viewData ? (
                            <>
                                {/* Modal Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{viewData.nama_kl}</h2>
                                            <p className="text-xs font-medium text-brand-600">{viewData.nama_ro}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div id="report-content-temuan" className="p-8 overflow-y-auto flex-1 bg-white relative">
                                    {/* Digital Stamp (Top Right) */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <DigitalStamp 
                                            vendor={viewData.nama_kl} 
                                            date={viewData.tanggal_kunjungan} 
                                            reportId={viewData.id?.substring(0, 8)} 
                                        />
                                    </div>
                                    
                                    {/* Brand Header for PDF */}
                                    <div className="pdf-only border-b-2 border-brand-600 pb-4 mb-6 flex items-center justify-between" style={{ display: 'none' }}>
                                        <div>
                                            <h1 className="text-xl font-black text-brand-700 uppercase tracking-tighter">SIDAK DOP</h1>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Laporan Hasil Temuan Kunjungan</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400">Dihasilkan pada: {new Date().toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-5 h-5 text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Tanggal Kunjungan</p>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {new Date(viewData.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Tim Kunjungan</p>
                                                <p className="font-semibold text-gray-900 text-sm">{viewData.tim_kunjungan || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail Table */}
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Rincian Temuan</h3>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-brand-50 border-b border-gray-200">
                                                    <th className="py-3 px-4 text-center font-bold text-brand-900 w-12 border-r border-gray-200">No</th>
                                                    <th className="py-3 px-4 text-left font-bold text-brand-900 w-1/4 border-r border-gray-200">Indikator</th>
                                                    <th className="py-3 px-4 text-left font-bold text-brand-900 w-1/3 border-r border-gray-200">Keterangan</th>
                                                    <th className="py-3 px-4 text-left font-bold text-brand-900">Evaluasi / Tindak Lanjut</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewData.temuan_detail.map((d, idx) => (
                                                    <tr key={d.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                                        <td className="py-3 px-4 text-center text-gray-500 font-medium border-r border-gray-100 align-top">{idx + 1}</td>
                                                        <td className="py-3 px-4 text-gray-900 font-semibold border-r border-gray-100 align-top">{d.nama_indikator}</td>
                                                        <td className="py-3 px-4 text-gray-700 whitespace-pre-wrap border-r border-gray-100 align-top">{d.keterangan || '-'}</td>
                                                        <td className="py-3 px-4 text-gray-700 whitespace-pre-wrap align-top">{d.evaluasi || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Signatures */}
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide text-center">Tanda Tangan Kehadiran</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">SPV Tie Kanwil</p>
                                            <div className="w-full h-32 border border-gray-200 rounded-lg flex items-center justify-center p-2 bg-gray-50">
                                                {viewData.ttd_spv_tie ? (
                                                    <img src={viewData.ttd_spv_tie} alt="TTD SPV Tie Kanwil" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                                ) : <span className="text-gray-300 text-xs">Kosong</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Pet BRI</p>
                                            <div className="w-full h-32 border border-gray-200 rounded-lg flex items-center justify-center p-2 bg-gray-50">
                                                {viewData.ttd_pet_bri ? (
                                                    <img src={viewData.ttd_pet_bri} alt="TTD Pet BRI" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                                ) : <span className="text-gray-300 text-xs">Kosong</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Pet CRO</p>
                                            <div className="w-full h-32 border border-gray-200 rounded-lg flex items-center justify-center p-2 bg-gray-50">
                                                {viewData.ttd_pet_cro ? (
                                                    <img src={viewData.ttd_pet_cro} alt="TTD Pet CRO" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                                ) : <span className="text-gray-300 text-xs">Kosong</span>}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Digital Stamp removed from bottom */}
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-xl">
                                    <button 
                                        onClick={() => generatePDF('report-content-temuan', `Temuan_${viewData.nama_kl}_${viewData.tanggal_kunjungan}.pdf`)} 
                                        className="btn-primary py-2 text-xs"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download PDF
                                    </button>
                                    <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">
                                        Tutup Detail
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}
