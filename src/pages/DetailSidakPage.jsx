import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Building2, Calendar, User, ArrowLeft, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { getSidakById } from '../services/sidakService'
import { getAspek } from '../services/aspekService'
import DigitalStamp from '../components/DigitalStamp'
import { calcNilaiAspek, calcTotalNilai, determineStatus } from '../utils/calculateScore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import html2pdf from 'html2pdf.js'

export default function DetailSidakPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const printRef = useRef()
    const [data, setData] = useState(null)
    const [aspekList, setAspekList] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDownloading, setIsDownloading] = useState(false)

    useEffect(() => {
        const loadDetail = async () => {
            try {
                const [sidak, aspek] = await Promise.all([
                    getSidakById(id),
                    getAspek()
                ])
                setData(sidak)
                setAspekList(aspek)
            } catch (err) {
                toast.error('Gagal memuat detail sidak')
                navigate('/')
            } finally {
                setLoading(false)
            }
        }
        loadDetail()
    }, [id, navigate])

    if (loading) return <div className="py-20 text-center"><LoadingSpinner /></div>
    if (!data) return null

    const totalNilai = calcTotalNilai(data.sidak_detail || [])
    const status = determineStatus(totalNilai)

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Laporan_SIDAK_${id?.substring(0, 8)}`,
        onAfterPrint: () => {
            if (location.search.includes('download=true')) {
                navigate(location.pathname, { replace: true })
            }
        }
    })

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        const element = printRef.current;
        const opt = {
            margin: [10, 10],
            filename: `Laporan_SIDAK_${data?.nama_kl || id?.substring(0, 8)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        const toastId = toast.loading('Menyiapkan PDF...');
        try {
            // Wait a bit for the isDownloading state to render the print-only elements
            await new Promise(resolve => setTimeout(resolve, 500));
            await html2pdf().set(opt).from(element).save();
            toast.success('PDF berhasil diunduh', { id: toastId });
            if (location.search.includes('download=true')) {
                navigate(location.pathname, { replace: true });
            }
        } catch (err) {
            toast.error('Gagal mengunduh PDF', { id: toastId });
            console.error(err);
        } finally {
            setIsDownloading(false);
        }
    }

    useEffect(() => {
        if (!loading && data && location.search.includes('download=true')) {
            const timer = setTimeout(() => {
                handleDownloadPDF();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, data, location.search]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
            {/* Digital Stamp (Top Right) */}
            <div className="absolute top-0 right-0 z-20 hidden md:block">
                <DigitalStamp 
                    vendor={data.nama_kl} 
                    date={data.tanggal_kunjungan} 
                    reportId={data.id?.substring(0, 8)} 
                />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button 
                    onClick={() => navigate('/')} 
                    className="btn-secondary self-start px-3 py-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                            Laporan Checklist SIDAK
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Hasil SIDAK</h1>
                    <p className="text-sm text-gray-500">Hasil penilaian kantor layanan {data.nama_kl}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={handleDownloadPDF} className="btn-primary px-6 h-11 bg-red-600 hover:bg-red-700 border-red-600">
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                    <button onClick={handlePrint} className="btn-secondary px-6 h-11">
                        Cetak Laporan
                    </button>
                </div>
            </div>

            <div ref={printRef} className={`print:p-0 print:bg-transparent space-y-6 relative ${isDownloading ? 'bg-white p-8' : ''}`}>
                {/* Digital Stamp (Top Right) for Print/Download */}
                <div className={`absolute top-0 right-0 z-20 ${isDownloading ? 'block' : 'hidden print:block'}`}>
                    <DigitalStamp 
                        vendor={data.nama_kl} 
                        date={data.tanggal_kunjungan} 
                        reportId={data.id?.substring(0, 8)} 
                    />
                </div>
                
                {/* Print Header (Only visible when printing/downloading) */}
                <div className={`${isDownloading ? 'block' : 'hidden print:block'} border-b-2 border-gray-900 pb-8 mb-8`}>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Laporan Checklist SIDAK</h2>
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Sidak Kantor Layanan - DOP</p>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4 bg-white border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Kantor Layanan</p>
                        <p className="font-semibold text-gray-900 text-sm">{data.nama_kl}</p>
                        <p className="text-[10px] text-brand-600 font-medium uppercase">{data.nama_ro}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-white border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Tanggal Kunjungan</p>
                        <p className="font-semibold text-gray-900 text-sm">
                            {new Date(data.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-white border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Tim Kunjungan</p>
                        <p className="font-semibold text-gray-900 text-sm truncate" title={data.tim_kunjungan}>{data.tim_kunjungan || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Checklist Details */}
            <div className="space-y-8">
                {aspekList.map((aspek) => {
                    const aspekDetails = (data.sidak_detail || []).filter(d => d.aspek_id === aspek.id)
                    const nilaiAspek = calcNilaiAspek(data.sidak_detail || [], aspek.id)

                    return (
                        <div key={aspek.id} className="card p-0 overflow-hidden shadow-sm border-gray-200">
                            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">{aspek.nama_aspek}</h3>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr className="border-b border-gray-100">
                                            <th className="py-3 px-6 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px] w-1/2">Sub Aspek</th>
                                            <th className="py-3 px-6 text-center font-bold text-gray-400 uppercase tracking-widest text-[10px]">Hasil</th>
                                            <th className="py-3 px-6 text-center font-bold text-gray-400 uppercase tracking-widest text-[10px]">Unit</th>
                                            <th className="py-3 px-6 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {aspekDetails.map((d) => (
                                            <tr key={d.sub_aspek_id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 font-semibold text-gray-900">{d.sub_aspek?.nama_sub_aspek || 'N/A'}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                            d.kelengkapan === 'Sesuai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {d.kelengkapan}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center text-gray-600 font-medium">{d.jumlah_unit || '-'}</td>
                                                <td className="py-4 px-6 text-gray-500 italic text-xs">{d.keterangan || '-'}</td>
                                            </tr>
                                        ))}
                                        {aspekDetails.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">Tidak ada data untuk aspek ini</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            {data.catatan_lain && (
                <div className="mb-12 p-6 bg-brand-50/50 rounded-xl border-2 border-brand-100 print:bg-white print:border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Catatan Lain / Rekomendasi</p>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                        {data.catatan_lain}
                    </p>
                </div>
            )}

            {/* Signature Pad Section */}
            <div className="card p-8 bg-white border-gray-200 shadow-sm flex flex-col items-center gap-6">
                <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm border-b pb-2">Otorisasi Laporan</h3>
                <div className="w-full max-w-md space-y-4">
                    <div className="aspect-[16/9] border-2 border-gray-100 rounded-2xl bg-gray-50/50 flex items-center justify-center p-6 overflow-hidden">
                        {data.ttd_kepala_kl ? (
                            <img src={data.ttd_kepala_kl} alt="TTD Kepala KL" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                        ) : (
                            <span className="text-gray-300 italic text-xs">Tanpa Tanda Tangan</span>
                        )}
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-black text-gray-900 underline uppercase tracking-tight decoration-brand-500 decoration-2 underline-offset-4">{data.nama_kl}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kepala Kantor Layanan</p>
                    </div>
                </div>
            </div>
            </div>

            {/* Note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    Halaman ini menampilkan hasil penilaian SIDAK yang telah disimpan secara permanen. Perubahan data hanya dapat dilakukan oleh Administrator melalui Panel Admin.
                </p>
            </div>
        </div>
    )
}
