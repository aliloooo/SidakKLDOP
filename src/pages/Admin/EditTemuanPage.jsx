import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eraser, AlertCircle } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { getTemuanById, updateTemuan } from '../../services/temuanService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function EditTemuanPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [identity, setIdentity] = useState(null)
    const [details, setDetails] = useState([])

    // Three Signature Refs
    const sigSpvTie = useRef({})
    const sigPetBri = useRef({})
    const sigPetCro = useRef({})

    // Track if signatures were changed
    const [sigChanged, setSigChanged] = useState({
        spv: false,
        bri: false,
        cro: false
    })
    
    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        try {
            const data = await getTemuanById(id)
            setIdentity({
                nama_ro: data.nama_ro,
                nama_kl: data.nama_kl,
                vendor: data.vendor || '',
                tanggal_kunjungan: data.tanggal_kunjungan,
                tim_kunjungan: data.tim_kunjungan,
                ttd_spv_tie: data.ttd_spv_tie,
                ttd_pet_bri: data.ttd_pet_bri,
                ttd_pet_cro: data.ttd_pet_cro
            })
            setDetails(data.temuan_detail.map(d => ({
                id: d.id, // Detail ID for updating
                indikator_id: d.indikator_id,
                nama_indikator: d.nama_indikator,
                keterangan: d.keterangan || '',
                evaluasi: d.evaluasi || ''
            })))
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
            navigate('/admin/results-temuan')
        } finally {
            setLoading(false)
        }
    }

    function updateDetail(indikator_id, field, value) {
        setDetails(prev => prev.map(d => {
            if (d.indikator_id !== indikator_id) return d
            return { ...d, [field]: value }
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)

        try {
            const payloadIdentity = { ...identity }

            // Handle Signatures: Only update if changed
            if (sigChanged.spv && !sigSpvTie.current.isEmpty()) {
                payloadIdentity.ttd_spv_tie = sigSpvTie.current.getCanvas().toDataURL('image/png')
            }
            if (sigChanged.bri && !sigPetBri.current.isEmpty()) {
                payloadIdentity.ttd_pet_bri = sigPetBri.current.getCanvas().toDataURL('image/png')
            }
            if (sigChanged.cro && !sigPetCro.current.isEmpty()) {
                payloadIdentity.ttd_pet_cro = sigPetCro.current.getCanvas().toDataURL('image/png')
            }

            await updateTemuan(id, { identity: payloadIdentity, details })
            toast.success('Laporan Temuan berhasil diperbarui!')
            navigate('/admin/results-temuan')
        } catch (err) {
            console.error('Update Error:', err)
            toast.error('Gagal memperbarui: ' + (err.message || 'Terjadi kesalahan sistem'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="py-20"><LoadingSpinner /></div>

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/admin/results-temuan')} className="btn-secondary mt-1">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Laporan Temuan</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Memperbarui laporan untuk <span className="font-semibold text-brand-600">{identity.nama_kl}</span> — {identity.nama_ro}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Identity Info Readonly */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="card p-4 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">RO</p>
                        <p className="text-sm font-semibold text-gray-700">{identity.nama_ro}</p>
                    </div>
                    <div className="card p-4 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kantor Layanan</p>
                        <p className="text-sm font-semibold text-gray-700">{identity.nama_kl}</p>
                    </div>
                    <div className="card p-4 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vendor</p>
                        <select 
                            value={identity.vendor}
                            onChange={(e) => setIdentity({...identity, vendor: e.target.value})}
                            className="w-full text-sm font-semibold text-gray-700 bg-transparent border-b border-gray-200 focus:border-brand-500 outline-none"
                        >
                            <option value="">Pilih Vendor</option>
                            <option value="BGI">BGI</option>
                            <option value="Advantage">Advantage</option>
                            <option value="SSI">SSI</option>
                            <option value="Kejar">Kejar</option>
                            <option value="TAG">TAG</option>
                            <option value="UG">UG</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div className="card p-4 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tanggal</p>
                        <p className="text-sm font-semibold text-gray-700">{identity.tanggal_kunjungan}</p>
                    </div>
                    <div className="card p-4 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tim</p>
                        <input 
                            type="text"
                            value={identity.tim_kunjungan}
                            onChange={(e) => setIdentity({...identity, tim_kunjungan: e.target.value})}
                            className="w-full text-sm font-semibold text-gray-700 bg-transparent border-b border-gray-200 focus:border-brand-500 outline-none"
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="card p-0 overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="px-4 py-3 text-center w-12 font-semibold uppercase tracking-wider text-[10px]">No</th>
                                    <th className="px-4 py-3 text-left w-64 font-semibold uppercase tracking-wider text-[10px]">Indikator</th>
                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Keterangan</th>
                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Evaluasi & Tindak Lanjut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {details.map((d, idx) => (
                                    <tr key={d.indikator_id} className="hover:bg-gray-50/30 transition-colors align-top">
                                        <td className="px-4 py-4 text-center font-medium text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-4 font-bold text-gray-800 leading-tight">{d.nama_indikator}</td>
                                        <td className="px-2 py-2">
                                            <textarea
                                                rows={3}
                                                value={d.keterangan}
                                                onChange={(e) => updateDetail(d.indikator_id, 'keterangan', e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none resize-y"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <textarea
                                                rows={3}
                                                value={d.evaluasi}
                                                onChange={(e) => updateDetail(d.indikator_id, 'evaluasi', e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none resize-y"
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
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">Tanda Tangan Kehadiran</h3>
                            <p className="text-xs text-gray-500">Kosongkan jika tidak ingin mengubah tanda tangan yang sudah ada.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* TTD 1 */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest">SPV Tie Kanwil</h4>
                            <div className="relative group">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                                    {!sigChanged.spv && identity.ttd_spv_tie ? (
                                        <div className="w-full h-40 flex items-center justify-center p-4 bg-white">
                                            <img src={identity.ttd_spv_tie} alt="Current TTD" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => setSigChanged({...sigChanged, spv: true})} className="btn-primary text-xs">Ubah Tanda Tangan</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <SignatureCanvas 
                                            ref={sigSpvTie}
                                            penColor="black"
                                            canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
                                        />
                                    )}
                                </div>
                                {sigChanged.spv && (
                                    <div className="flex justify-between items-center mt-1">
                                        <button type="button" onClick={() => { setSigChanged({...sigChanged, spv: false}); sigSpvTie.current.clear(); }} className="text-[10px] text-gray-400 hover:text-gray-600">Batal Ubah</button>
                                        <button type="button" onClick={() => sigSpvTie.current.clear()} className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                            <Eraser className="w-3 h-3" /> Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TTD 2 */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Petugas BRI</h4>
                            <div className="relative group">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                                    {!sigChanged.bri && identity.ttd_pet_bri ? (
                                        <div className="w-full h-40 flex items-center justify-center p-4 bg-white">
                                            <img src={identity.ttd_pet_bri} alt="Current TTD" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => setSigChanged({...sigChanged, bri: true})} className="btn-primary text-xs">Ubah Tanda Tangan</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <SignatureCanvas 
                                            ref={sigPetBri}
                                            penColor="black"
                                            canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
                                        />
                                    )}
                                </div>
                                {sigChanged.bri && (
                                    <div className="flex justify-between items-center mt-1">
                                        <button type="button" onClick={() => { setSigChanged({...sigChanged, bri: false}); sigPetBri.current.clear(); }} className="text-[10px] text-gray-400 hover:text-gray-600">Batal Ubah</button>
                                        <button type="button" onClick={() => sigPetBri.current.clear()} className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                            <Eraser className="w-3 h-3" /> Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TTD 3 */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Petugas CRO</h4>
                            <div className="relative group">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                                    {!sigChanged.cro && identity.ttd_pet_cro ? (
                                        <div className="w-full h-40 flex items-center justify-center p-4 bg-white">
                                            <img src={identity.ttd_pet_cro} alt="Current TTD" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => setSigChanged({...sigChanged, cro: true})} className="btn-primary text-xs">Ubah Tanda Tangan</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <SignatureCanvas 
                                            ref={sigPetCro}
                                            penColor="black"
                                            canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
                                        />
                                    )}
                                </div>
                                {sigChanged.cro && (
                                    <div className="flex justify-between items-center mt-1">
                                        <button type="button" onClick={() => { setSigChanged({...sigChanged, cro: false}); sigPetCro.current.clear(); }} className="text-[10px] text-gray-400 hover:text-gray-600">Batal Ubah</button>
                                        <button type="button" onClick={() => sigPetCro.current.clear()} className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                            <Eraser className="w-3 h-3" /> Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pb-12">
                    <button type="button" onClick={() => navigate('/admin/results-temuan')} className="btn-secondary">
                        Batal
                    </button>
                    <button type="submit" disabled={submitting} className="btn-success px-10">
                        {submitting ? 'Menyimpan...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
