import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eraser } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { getIndikator, createTemuan } from '../../services/temuanService'
import useTemuanStore from '../../store/useTemuanStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function FormTemuan() {
    const navigate = useNavigate()
    const { identity, resetIdentity } = useTemuanStore()

    const [indikatorList, setIndikatorList] = useState([])
    const [details, setDetails] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Three Signature Refs
    const sigSpvTie = useRef({})
    const sigPetBri = useRef({})
    const sigPetCro = useRef({})
    
    useEffect(() => {
        if (!identity.nama_ro) {
            toast.error('Silakan isi informasi awal terlebih dahulu')
            navigate('/input-temuan')
            return
        }
        loadData()
    }, [])

    async function loadData() {
        try {
            const indikators = await getIndikator()
            setIndikatorList(indikators)

            const rows = indikators.map(ind => ({
                indikator_id: ind.id,
                nama_indikator: ind.nama_indikator,
                keterangan: '',
                evaluasi: ''
            }))
            setDetails(rows)
        } catch (err) {
            toast.error('Gagal memuat indikator: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    function updateDetail(id, field, value) {
        setDetails(prev => prev.map(d => {
            if (d.indikator_id !== id) return d
            return { ...d, [field]: value }
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)

        try {
            // Check signatures
            if (!sigSpvTie.current || typeof sigSpvTie.current.isEmpty !== 'function' ||
                !sigPetBri.current || typeof sigPetBri.current.isEmpty !== 'function' ||
                !sigPetCro.current || typeof sigPetCro.current.isEmpty !== 'function') {
                throw new Error('Canvas tanda tangan tidak terinisialisasi dengan baik')
            }

            if (sigSpvTie.current.isEmpty() || sigPetBri.current.isEmpty() || sigPetCro.current.isEmpty()) {
                toast.error('Ketiga Tanda Tangan wajib diisi')
                setSubmitting(false)
                return
            }

            // Get Base64 without trim to avoid vite build error
            const ttd1 = sigSpvTie.current.getCanvas().toDataURL('image/png')
            const ttd2 = sigPetBri.current.getCanvas().toDataURL('image/png')
            const ttd3 = sigPetCro.current.getCanvas().toDataURL('image/png')
            
            const payloadIdentity = {
                ...identity,
                ttd_spv_tie: ttd1,
                ttd_pet_bri: ttd2,
                ttd_pet_cro: ttd3
            }

            await createTemuan({ identity: payloadIdentity, details })
            toast.success('Form Temuan berhasil disimpan!')
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

    if (indikatorList.length === 0) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <p className="text-gray-500 font-medium">Belum ada indikator temuan.</p>
                <p className="text-gray-400 text-sm mt-1">Admin perlu menambahkan indikator temuan terlebih dahulu.</p>
                <button onClick={() => navigate('/')} className="btn-secondary mt-4">Kembali ke Dashboard</button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/input-temuan')} className="btn-secondary mt-1">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">2</span>
                        <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">Langkah 2 dari 2</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Form Temuan Hasil Kunjungan</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-700">{identity.nama_ro}</span> / {identity.nama_kl} — {identity.tanggal_kunjungan}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Table Section */}
                <div className="card p-0 overflow-hidden border-2 border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-brand-600 text-white">
                                    <th className="table-th text-center w-12 font-semibold">No</th>
                                    <th className="table-th text-left w-64 font-semibold">Indikator</th>
                                    <th className="table-th text-left font-semibold">Keterangan</th>
                                    <th className="table-th text-left font-semibold">Evaluasi, Tindak Lanjut Vendor & Batas Waktu Perbaikan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {details.map((d, idx) => (
                                    <tr key={d.indikator_id} className="hover:bg-gray-50/50 transition-colors align-top">
                                        <td className="table-td text-center font-medium text-gray-500 pt-4">{idx + 1}</td>
                                        <td className="table-td font-semibold text-gray-800 pt-4">{d.nama_indikator}</td>
                                        <td className="table-td p-2">
                                            <textarea
                                                rows={4}
                                                value={d.keterangan}
                                                onChange={(e) => updateDetail(d.indikator_id, 'keterangan', e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-y"
                                                placeholder="Keterangan..."
                                            />
                                        </td>
                                        <td className="table-td p-2">
                                            <textarea
                                                rows={4}
                                                value={d.evaluasi}
                                                onChange={(e) => updateDetail(d.indikator_id, 'evaluasi', e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-y"
                                                placeholder="Evaluasi dan Tindak Lanjut..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Signatures Section */}
                <div className="card space-y-6">
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 text-lg">Tanda Tangan Kehadiran</h3>
                        <p className="text-xs text-gray-500 mt-1">Harap ditandatangani oleh ketiga pihak terkait sebelum menyimpan form.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* TTD 1 */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-800 flex justify-between items-center">
                                <span>SPV Tie Kanwil <span className="text-red-500">*</span></span>
                            </h4>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-brand-300 transition-colors">
                                <SignatureCanvas 
                                    ref={sigSpvTie}
                                    penColor="black"
                                    canvasProps={{ className: 'w-full h-40 cursor-crosshair touch-none' }}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => sigSpvTie.current.clear()} className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50">
                                    <Eraser className="w-3 h-3" /> Hapus
                                </button>
                            </div>
                        </div>

                        {/* TTD 2 */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-800 flex justify-between items-center">
                                <span>Pet BRI <span className="text-red-500">*</span></span>
                            </h4>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-brand-300 transition-colors">
                                <SignatureCanvas 
                                    ref={sigPetBri}
                                    penColor="black"
                                    canvasProps={{ className: 'w-full h-40 cursor-crosshair touch-none' }}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => sigPetBri.current.clear()} className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50">
                                    <Eraser className="w-3 h-3" /> Hapus
                                </button>
                            </div>
                        </div>

                        {/* TTD 3 */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-800 flex justify-between items-center">
                                <span>Pet CRO <span className="text-red-500">*</span></span>
                            </h4>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-brand-300 transition-colors">
                                <SignatureCanvas 
                                    ref={sigPetCro}
                                    penColor="black"
                                    canvasProps={{ className: 'w-full h-40 cursor-crosshair touch-none' }}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => sigPetCro.current.clear()} className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50">
                                    <Eraser className="w-3 h-3" /> Hapus
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => navigate('/input-temuan')} className="btn-secondary">
                        Kembali
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
                                Simpan Form Temuan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
