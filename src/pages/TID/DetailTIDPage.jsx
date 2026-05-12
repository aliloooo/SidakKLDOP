import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { getTIDReportById } from '../../services/tidService'
import DigitalStamp from '../../components/DigitalStamp'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'

export default function DetailTIDPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const printRef = useRef()

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        try {
            const data = await getTIDReportById(id)
            setReport(data)
        } catch (err) {
            toast.error('Gagal memuat detail: ' + err.message)
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Laporan_TID_${id?.substring(0, 8)}`,
    })

    if (loading) return <div className="py-20"><LoadingSpinner /></div>
    if (!report) return null

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between gap-4 sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn-secondary px-3 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Detail Laporan TID</h1>
                        <p className="text-xs text-gray-500 font-medium">ID: {report.id.substring(0, 8)}</p>
                    </div>
                </div>
                <button onClick={handlePrint} className="btn-primary px-6 h-11">
                    <Download className="w-4 h-4" />
                    Cetak Laporan
                </button>
            </div>

            <div ref={printRef} className="bg-white shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100 print:shadow-none print:border-0 print:p-0 relative overflow-hidden">
                <div className="absolute top-8 right-8 z-20 hidden md:block print:block">
                    <DigitalStamp vendor={report.nama_vendor} date={report.tanggal_kunjungan} reportId={report.id?.substring(0, 8)} />
                </div>

                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Laporan Kunjungan TID</h2>
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Sidak Kantor Layanan - DOP</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12 mb-12 bg-gray-50 p-8 rounded-2xl border border-gray-100 print:bg-white print:border-gray-200">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Regional Office</p>
                        <p className="font-bold text-gray-900">{report.nama_ro}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kantor Layanan</p>
                        <p className="font-bold text-gray-900">{report.nama_vendor}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Kunjungan</p>
                        <p className="font-bold text-gray-900">{new Date(report.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1 col-span-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Petugas BRI</p>
                        <p className="font-bold text-gray-900">{report.petugas_names}</p>
                    </div>
                </div>

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
                            {report.laporan_tid_detail?.map((detail, idx) => (
                                <tr key={idx} className="print:break-inside-avoid">
                                    <td className="px-6 py-4 text-center font-bold text-gray-400 border-r border-gray-100">{idx + 1}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 border-r border-gray-100">{detail.item_name}</td>
                                    <td className="px-6 py-4 border-r border-gray-100 text-center">
                                        <span className="text-xs font-bold text-gray-700">{detail.kondisi}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 italic text-xs">
                                        {detail.keterangan || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {report.catatan_lain && (
                    <div className="mb-12 p-6 bg-brand-50/50 rounded-xl border-2 border-brand-100 print:bg-white print:border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Catatan Lain / Rekomendasi</p>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                            {report.catatan_lain}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t">
                    <div className="flex flex-col items-center px-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Pihak Vendor / Kantor Layanan</p>
                        <img src={report.ttd_kepala_kl} alt="TTD Vendor" className="h-20 mix-blend-multiply" />
                        <p className="text-sm font-bold text-gray-900 underline mt-4">{report.nama_kepala_kl}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{report.nama_perusahaan}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Branch / Regional Office</p>
                        <img src={report.ttd_ro} alt="TTD RO" className="h-20 mix-blend-multiply" />
                        <p className="text-sm font-bold text-gray-900 underline mt-4">{report.nama_ro_user}</p>
                        <p className="text-[10px] text-gray-500 uppercase">BO / RO {report.nama_ro}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Digital Operation (DOP)</p>
                        <img src={report.ttd_dop} alt="TTD DOP" className="h-20 mix-blend-multiply" />
                        <p className="text-sm font-bold text-gray-900 underline mt-4">{report.nama_dop_user}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Digital Operation</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
