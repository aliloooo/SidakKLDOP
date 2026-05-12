import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, Trash2, Edit3, Eye, Calendar, MapPin, Building2, User, Filter, ArrowUpDown } from 'lucide-react'
import { getCPCReports, deleteCPCReport } from '../../services/cpcService'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'
import { generatePDF } from '../../utils/pdfGenerator'
import DigitalStamp from '../../components/DigitalStamp'

export default function ResultsCPCPage() {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewItem, setViewItem] = useState(null)
    const [deleteId, setDeleteId] = useState(null)

    useEffect(() => {
        loadReports()
    }, [])

    async function loadReports() {
        try {
            const data = await getCPCReports()
            setReports(data)
        } catch (err) {
            toast.error('Gagal memuat laporan: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteCPCReport(deleteId)
            toast.success('Laporan berhasil dihapus')
            setReports(reports.filter(r => r.id !== deleteId))
            setDeleteId(null)
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        }
    }

    const handleView = async (report) => {
        setLoading(true)
        try {
            const { getCPCReportById } = await import('../../services/cpcService')
            const fullReport = await getCPCReportById(report.id)
            setViewItem(fullReport)
        } catch (err) {
            toast.error('Gagal memuat detail: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredReports = reports.filter(r => 
        r.nama_vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nama_ro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vendor_pelaksana?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="py-20"><LoadingSpinner /></div>

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hasil Kunjungan CPC</h1>
                    <p className="text-sm text-gray-500">Manajemen laporan inspeksi CPC Kantor Layanan.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Cari laporan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pl-10 text-sm w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden p-0 border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                <th className="px-6 py-4">Regional Office</th>
                                <th className="px-6 py-4">Kantor Layanan</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredReports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{report.nama_ro}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-700">{report.nama_vendor}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded text-[10px] font-bold">{report.vendor_pelaksana}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                        {new Date(report.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleView(report)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Lihat Detail">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => navigate(`/admin/edit-cpc/${report.id}`)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteId(report.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Detail Laporan CPC" size="xl">
                {viewItem && (
                    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2" id="report-content-cpc">
                        <div className="bg-white p-2 md:p-8 relative overflow-hidden">
                            {/* Digital Stamp (Top Right) */}
                            <div className="absolute top-8 right-8 z-20 hidden md:block print:block">
                                <DigitalStamp
                                    vendor={viewItem.nama_vendor}
                                    date={viewItem.tanggal_kunjungan}
                                    reportId={viewItem.id?.substring(0, 8)}
                                />
                            </div>

                            {/* Header Print */}
                            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Laporan Kunjungan CPC</h2>
                                    <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Sidak Kantor Layanan - DOP</p>
                                </div>
                                <div className="text-right text-[10px] font-bold text-gray-400 space-y-0.5">
                                    <p>DIPERBARUI PADA:</p>
                                    <p className="text-gray-900">{new Date(viewItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            {/* Identity Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12 mb-12 bg-gray-50 p-8 rounded-2xl border border-gray-100 print:bg-white print:border-gray-200">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Regional Office</p>
                                    <p className="font-bold text-gray-900">{viewItem.nama_ro}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kantor Layanan</p>
                                    <p className="font-bold text-gray-900">{viewItem.nama_vendor}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor Pelaksana</p>
                                    <p className="font-bold text-brand-600">{viewItem.vendor_pelaksana}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Kunjungan</p>
                                    <p className="font-bold text-gray-900">{new Date(viewItem.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Petugas BRI</p>
                                    <p className="font-bold text-gray-900">{viewItem.petugas_names}</p>
                                </div>
                                <div className="space-y-1 col-span-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat CPC</p>
                                    <p className="font-medium text-gray-600 leading-relaxed">{viewItem.alamat_cpc}</p>
                                </div>
                                <div className="space-y-1 col-span-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tujuan Kunjungan</p>
                                    <p className="font-bold text-gray-900">{viewItem.tujuan_kunjungan}</p>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="mb-12 overflow-hidden border border-gray-200 rounded-xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900 text-white">
                                        <tr className="uppercase text-[10px] tracking-widest">
                                            <th className="px-6 py-4 text-center w-12 border-r border-gray-800">No.</th>
                                            <th className="px-6 py-4 text-left border-r border-gray-800">Item Penilaian</th>
                                            <th className="px-6 py-4 text-center w-40 border-r border-gray-800">Kondisi</th>
                                            <th className="px-6 py-4 text-left">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {viewItem.laporan_cpc_detail?.map((detail, idx) => (
                                            <tr key={idx} className="print:break-inside-avoid">
                                                <td className="px-6 py-4 text-center font-bold text-gray-400 border-r border-gray-100">{idx + 1}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900 border-r border-gray-100">{detail.item_name}</td>
                                                <td className="px-6 py-4 border-r border-gray-100">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${detail.kondisi === 'Ada' || detail.kondisi === 'Sesuai' || detail.kondisi === 'Milik Sendiri'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {detail.kondisi}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 italic text-xs">
                                                    {detail.keterangan || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t">
                                {/* 1. Vendor / KL */}
                                <div className="flex flex-col items-center border-r border-gray-100 last:border-0 px-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Pihak Vendor / Kantor Layanan</p>
                                    <div className="h-32 flex items-center justify-center mb-4">
                                        {viewItem.ttd_kepala_kl ? (
                                            <img src={viewItem.ttd_kepala_kl} alt="Signature Vendor" className="max-h-full mix-blend-multiply" />
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">Belum Ditandatangani</span>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900 underline uppercase">{viewItem.nama_kepala_kl || '-'}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{viewItem.nama_perusahaan || '-'}</p>
                                    </div>
                                </div>

                                {/* 2. BO / RO */}
                                <div className="flex flex-col items-center border-r border-gray-100 last:border-0 px-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Branch Office / Regional Office</p>
                                    <div className="h-32 flex items-center justify-center mb-4">
                                        {viewItem.ttd_ro ? (
                                            <img src={viewItem.ttd_ro} alt="Signature BO/RO" className="max-h-full mix-blend-multiply" />
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">Belum Ditandatangani</span>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900 underline uppercase">{viewItem.nama_ro_user || '-'}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">BO / RO {viewItem.nama_ro}</p>
                                    </div>
                                </div>

                                {/* 3. DOP */}
                                <div className="flex flex-col items-center border-r border-gray-100 last:border-0 px-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Digital Operation (DOP)</p>
                                    <div className="h-32 flex items-center justify-center mb-4">
                                        {viewItem.ttd_dop ? (
                                            <img src={viewItem.ttd_dop} alt="Signature DOP" className="max-h-full mix-blend-multiply" />
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">Belum Ditandatangani</span>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900 underline uppercase">{viewItem.nama_dop_user || '-'}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Digital Operation</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="pt-6 border-t flex justify-end gap-3 no-print">
                            <button 
                                onClick={() => generatePDF('report-content-cpc', `Laporan_CPC_${viewItem.nama_vendor}_${viewItem.tanggal_kunjungan}.pdf`)}
                                className="btn-primary text-xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                            </button>
                            <button onClick={() => setViewItem(null)} className="btn-secondary text-xs">Tutup</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteId(null)} className="btn-secondary text-xs">Batal</button>
                        <button onClick={handleDelete} className="btn-danger text-xs px-6">Hapus Laporan</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
