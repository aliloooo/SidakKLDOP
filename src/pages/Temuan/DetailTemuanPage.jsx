import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, Calendar, User, ArrowLeft, AlertTriangle } from 'lucide-react'
import { getTemuanById } from '../../services/temuanService'
import DigitalStamp from '../../components/DigitalStamp'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function DetailTemuanPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadDetail = async () => {
            try {
                const res = await getTemuanById(id)
                setData(res)
            } catch (err) {
                toast.error('Gagal memuat detail temuan')
                navigate('/')
            } finally {
                setLoading(false)
            }
        }
        loadDetail()
    }, [id, navigate])

    if (loading) return <div className="py-20 text-center"><LoadingSpinner /></div>
    if (!data) return null

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Digital Stamp (Top Right) */}
            <div className="absolute top-0 right-0 z-20">
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
                        <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                            Temuan Kunjungan
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Laporan Temuan</h1>
                    <p className="text-sm text-gray-500">Hasil inspeksi kantor layanan {data.nama_kl}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4 bg-white border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Kantor Layanan</p>
                        <p className="font-semibold text-gray-900 text-sm">{data.nama_kl}</p>
                        <p className="text-xs text-brand-600 font-medium">{data.nama_ro}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 bg-white border-gray-100">
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
                <div className="card p-4 flex items-center gap-4 bg-white border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Tim Kunjungan</p>
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[150px]">{data.tim_kunjungan || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card p-0 overflow-hidden shadow-sm border-gray-200/60">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Rincian Hasil Temuan</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="py-3 px-6 text-center font-bold text-gray-400 w-12 border-r border-gray-100 uppercase tracking-tighter text-[10px]">No</th>
                                <th className="py-3 px-6 text-left font-bold text-gray-900 w-1/3 border-r border-gray-100">Indikator</th>
                                <th className="py-3 px-6 text-left font-bold text-gray-900 border-r border-gray-100">Keterangan</th>
                                <th className="py-3 px-6 text-left font-bold text-gray-900">Evaluasi / Tindak Lanjut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.temuan_detail.map((d, idx) => (
                                <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                    <td className="py-4 px-6 text-center text-gray-400 font-medium border-r border-gray-50 align-top">{idx + 1}</td>
                                    <td className="py-4 px-6 text-gray-900 font-semibold border-r border-gray-50 align-top">{d.nama_indikator}</td>
                                    <td className="py-4 px-6 text-gray-600 whitespace-pre-wrap border-r border-gray-50 align-top leading-relaxed">{d.keterangan || '-'}</td>
                                    <td className="py-4 px-6 text-gray-600 whitespace-pre-wrap align-top leading-relaxed">{d.evaluasi || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Signatures */}
            <div className="card p-6 bg-white border-gray-200/60 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide text-center">Lembar Tanda Tangan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                        <div className="w-full aspect-[4/3] border border-gray-100 rounded-xl flex items-center justify-center p-3 bg-gray-50/50 mb-3 overflow-hidden">
                            {data.ttd_spv_tie ? (
                                <img src={data.ttd_spv_tie} alt="TTD SPV" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                            ) : <span className="text-gray-300 text-xs italic">Tidak ada ttd</span>}
                        </div>
                        <p className="text-xs font-bold text-gray-900 uppercase">SPV Tie Kanwil</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-full aspect-[4/3] border border-gray-100 rounded-xl flex items-center justify-center p-3 bg-gray-50/50 mb-3 overflow-hidden">
                            {data.ttd_pet_bri ? (
                                <img src={data.ttd_pet_bri} alt="TTD BRI" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                            ) : <span className="text-gray-300 text-xs italic">Tidak ada ttd</span>}
                        </div>
                        <p className="text-xs font-bold text-gray-900 uppercase">Petugas BRI</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-full aspect-[4/3] border border-gray-100 rounded-xl flex items-center justify-center p-3 bg-gray-50/50 mb-3 overflow-hidden">
                            {data.ttd_pet_cro ? (
                                <img src={data.ttd_pet_cro} alt="TTD CRO" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                            ) : <span className="text-gray-300 text-xs italic">Tidak ada ttd</span>}
                        </div>
                        <p className="text-xs font-bold text-gray-900 uppercase">Petugas CRO</p>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    Dokumen ini adalah data resmi hasil temuan kunjungan SIDAK. Segala bentuk perubahan hanya dapat dilakukan melalui otoritas admin pusat.
                </p>
            </div>
        </div>
    )
}
