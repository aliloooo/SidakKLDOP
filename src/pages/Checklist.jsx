import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowLeft, Save, CheckCheck, Eraser } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { getAspek, getAllSubAspekByAspek } from '../services/aspekService'
import { createSidak } from '../services/sidakService'
import useSidakStore from '../store/useSidakStore'
import { calcNilaiSubAspek, calcNilaiAspek, calcTotalNilai, determineStatus } from '../utils/calculateScore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Checklist() {
    const navigate = useNavigate()
    const { identity, setIdentity, resetIdentity } = useSidakStore()

    const [aspekList, setAspekList] = useState([])
    const [subAspekList, setSubAspekList] = useState([])
    const [details, setDetails] = useState([]) // array of { sub_aspek_id, aspek_id, jumlah_unit, keterangan, nilai, bobot_sub_aspek }
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const sigCanvas = useRef({})
    
    // Guard: if no identity, redirect back
    useEffect(() => {
        if (!identity.nama_ro) {
            toast.error('Silakan isi informasi awal terlebih dahulu')
            navigate('/input-sidak')
            return
        }
        loadChecklistData()
    }, [])

    async function loadChecklistData() {
        try {
            const [aspek, subAspek] = await Promise.all([getAspek(), getAllSubAspekByAspek()])
            setAspekList(aspek)
            setSubAspekList(subAspek)

            // Initialize detail rows
            const rows = subAspek.map((sa) => ({
                sub_aspek_id: sa.id,
                aspek_id: sa.aspek_id,
                jumlah_unit: 0,
                kelengkapan: 'Tidak Sesuai',
                keterangan: '',
                nilai: 0,
                bobot_sub_aspek: sa.bobot_sub_aspek,
                nama_sub_aspek: sa.nama_sub_aspek,
                is_unit_required: !!sa.is_unit_required,
            }))
            setDetails(rows)
        } catch (err) {
            toast.error('Gagal memuat checklist: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    function updateDetail(sub_aspek_id, field, value) {
        setDetails((prev) =>
            prev.map((d) => {
                if (d.sub_aspek_id !== sub_aspek_id) return d
                const updated = { ...d, [field]: value }
                // Recalculate nilai based on kelengkapan
                updated.nilai = calcNilaiSubAspek(updated.bobot_sub_aspek, updated.kelengkapan)
                return updated
            })
        )
    }

    function setAllSesuai(aspekId) {
        setDetails((prev) =>
            prev.map((d) => {
                if (d.aspek_id !== aspekId) return d
                const updated = { ...d, kelengkapan: 'Sesuai' }
                updated.nilai = calcNilaiSubAspek(updated.bobot_sub_aspek, updated.kelengkapan)
                return updated
            })
        )
        toast.success('Semua item di aspek ini diatur ke Sesuai')
    }

    const totalNilai = calcTotalNilai(details)
    const status = determineStatus(totalNilai)

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        
        try {
            // Validation: check for required units conditionally
            const missingUnits = details.filter(d =>
                d.is_unit_required &&
                d.kelengkapan === 'Sesuai' &&
                (!d.jumlah_unit || Number(d.jumlah_unit) <= 0)
            )
            if (missingUnits.length > 0) {
                const names = missingUnits.map(m => m.nama_sub_aspek).join(', ')
                toast.error(`Jumlah unit wajib diisi untuk item yang 'Sesuai': ${names}`, { duration: 5000 })
                setSubmitting(false)
                return
            }

            if (!sigCanvas.current || typeof sigCanvas.current.isEmpty !== 'function') {
                throw new Error('Canvas tanda tangan tidak terinisialisasi dengan baik')
            }

            if (sigCanvas.current.isEmpty()) {
                toast.error('Tanda Tangan Kepala Kantor Layanan wajib diisi')
                setSubmitting(false)
                return
            }

            const ttdBase64 = sigCanvas.current.getCanvas().toDataURL('image/png')
            
            const payloadIdentity = {
                ...identity,
                ttd_kepala_kl: ttdBase64
            }

            await createSidak({ identity: payloadIdentity, details })
            toast.success('SIDAK berhasil disimpan!')
            resetIdentity()
            navigate('/')
        } catch (err) {
            console.error('Submit Error:', err)
            toast.error('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan sistem'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <LoadingSpinner />

    if (aspekList.length === 0) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <p className="text-gray-500 font-medium">Belum ada aspek penilaian.</p>
                <p className="text-gray-400 text-sm mt-1">Admin perlu menambahkan aspek & sub aspek terlebih dahulu.</p>
                <button onClick={() => navigate('/')} className="btn-secondary mt-4">Kembali ke Dashboard</button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/input-sidak')} className="btn-secondary mt-1">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">2</span>
                        <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">Langkah 2 dari 2</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengisian Checklist</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-700">{identity.nama_ro}</span> / {identity.nama_kl} — {identity.tanggal_kunjungan}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>

            {/* Aspek Tables */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {aspekList.map((aspek) => {
                    const aspekSubAspek = subAspekList.filter((sa) => sa.aspek_id === aspek.id)
                    const aspekDetails = details.filter((d) => d.aspek_id === aspek.id)

                    return (
                        <div key={aspek.id} className="card p-0 overflow-hidden">
                            {/* Aspek Header */}
                            <div className="flex items-center justify-between px-6 py-3.5 bg-red-900">
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-semibold text-sm">{aspek.nama_aspek}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAllSesuai(aspek.id)}
                                        className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all font-medium text-xs shadow-sm active:scale-95"
                                        title="Set Sesuai untuk semua item di aspek ini"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Set Sesuai Semua
                                    </button>
                                </div>
                            </div>

                            {/* Sub Aspek Table */}
                            <div className="overflow-x-auto">
                                {aspekSubAspek.length === 0 ? (
                                    <p className="text-gray-400 text-sm px-6 py-4 italic">Belum ada sub aspek.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr>
                                                <th className="table-th text-left">Sub Aspek</th>
                                                <th className="table-th w-36 text-center">Kelengkapan</th>
                                                <th className="table-th w-32 text-center">Jumlah Unit</th>
                                                <th className="table-th text-left">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aspekSubAspek.map((sa) => {
                                                const detail = aspekDetails.find((d) => d.sub_aspek_id === sa.id)
                                                return (
                                                    <tr key={sa.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="table-td font-medium text-gray-800">{sa.nama_sub_aspek}</td>
                                                        <td className="table-td text-center">
                                                            <select
                                                                value={detail?.kelengkapan ?? 'Tidak Sesuai'}
                                                                onChange={(e) => updateDetail(sa.id, 'kelengkapan', e.target.value)}
                                                                className={`w-full px-2 py-1.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${(detail?.kelengkapan ?? 'Tidak Sesuai') === 'Sesuai'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                                    }`}
                                                            >
                                                                <option value="Sesuai" className="bg-white text-gray-900 font-normal">Sesuai</option>
                                                                <option value="Tidak Sesuai" className="bg-white text-gray-900 font-normal">Tidak Sesuai</option>
                                                            </select>
                                                        </td>
                                                        <td className="table-td text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={detail?.jumlah_unit ?? ''}
                                                                onChange={(e) => updateDetail(sa.id, 'jumlah_unit', e.target.value)}
                                                                className={`w-24 px-2 py-1.5 text-center border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${detail?.is_unit_required && (!detail?.jumlah_unit || Number(detail?.jumlah_unit) <= 0)
                                                                    ? 'border-amber-400 bg-amber-50/30'
                                                                    : 'border-gray-300'
                                                                    }`}
                                                            />
                                                        </td>
                                                        <td className="table-td text-left">
                                                            <input
                                                                type="text"
                                                                placeholder="Opsional..."
                                                                value={detail?.keterangan ?? ''}
                                                                onChange={(e) => updateDetail(sa.id, 'keterangan', e.target.value)}
                                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )
                })}
                
                {/* Catatan Lain Section */}
                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2 text-lg text-brand-600 flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Catatan Lain (Opsional)
                    </h3>
                    <textarea 
                        value={identity.catatan_lain || ''}
                        onChange={(e) => setIdentity({ ...identity, catatan_lain: e.target.value })}
                        className="form-input min-h-[120px] bg-gray-50/50"
                        placeholder="Masukkan catatan tambahan jika ada..."
                    />
                </div>

                {/* Signature Pad Section */}
                <div className="card space-y-4">
                    <div>
                        <h3 className="font-bold text-gray-900">Tanda Tangan Kepala Kantor Layanan <span className="text-red-500">*</span></h3>
                        <p className="text-xs text-gray-500 mt-1">Harap tanda tangan di dalam kotak di bawah ini sebelum menyimpan laporan.</p>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-brand-300 transition-colors">
                        <SignatureCanvas 
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{
                                className: 'w-full h-48 cursor-crosshair touch-none'
                            }}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={() => sigCanvas.current.clear()}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                            <Eraser className="w-4 h-4" />
                            Hapus Tanda Tangan
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => navigate('/')} className="btn-secondary">
                        Batal
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary px-8">
                        {submitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan SIDAK
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
