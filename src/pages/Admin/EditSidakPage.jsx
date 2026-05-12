import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, CheckCheck, CheckCircle2, Building2, User, Calendar, Plus, X, Eraser, Edit3 } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { getSidakById, updateSidak } from '../../services/sidakService'
import { getAspek, getAllSubAspekByAspek } from '../../services/aspekService'
import { calcNilaiSubAspek, calcNilaiAspek, calcTotalNilai, determineStatus } from '../../utils/calculateScore'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const RO_OPTIONS = [
    "RO 1/Medan",
    "RO 2/ Pekanbaru",
    "RO 3/Padang",
    "RO 4/Palembang",
    "RO 5/ Bandar Lampung",
    "RO 6/ Jakarta 1",
    "RO 7/ Jakarta 2",
    "RO 8/ Jakarta 3",
    "RO 9/Bandung",
    "RO 10/Semarang",
    "RO 11/Yogyakarta",
    "RO 12/Surabaya",
    "RO 13/Malang",
    "RO 14/Banjarmasin",
    "RO 15/Makassar",
    "RO 16/Manado",
    "RO 17/Denpasar",
    "RO 18/Jayapura"
];

export default function EditSidakPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const isAdmin = location.pathname.startsWith('/admin')

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [aspekList, setAspekList] = useState([])
    const [subAspekList, setSubAspekList] = useState([])

    // Form state
    const [identity, setIdentity] = useState({
        nama_ro: '',
        nama_kl: '',
        vendor: '',
        tanggal_kunjungan: '',
        tim_kunjungan: [''],
        ttd_kepala_kl: ''
    })
    const [details, setDetails] = useState([])
    const [showCanvas, setShowCanvas] = useState(false)
    const sigCanvas = useRef({})

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        setLoading(true)
        try {
            const [sidak, aspek, subAspek] = await Promise.all([
                getSidakById(id),
                getAspek(),
                getAllSubAspekByAspek()
            ])

            setIdentity({
                nama_ro: sidak.nama_ro,
                nama_kl: sidak.nama_kl,
                vendor: sidak.vendor || '',
                tanggal_kunjungan: sidak.tanggal_kunjungan,
                tim_kunjungan: sidak.tim_kunjungan ? sidak.tim_kunjungan.split(', ') : [''],
                ttd_kepala_kl: sidak.ttd_kepala_kl || ''
            })

            if (!sidak.ttd_kepala_kl) {
                setShowCanvas(true)
            }

            // Map existing details, ensuring we have all sub_aspek even if missing in previous save
            const rows = subAspek.map(sa => {
                const existing = (sidak.sidak_detail || []).find(d => d.sub_aspek_id === sa.id)
                return {
                    sub_aspek_id: sa.id,
                    aspek_id: sa.aspek_id,
                    jumlah_unit: existing?.jumlah_unit ?? 0,
                    kelengkapan: existing?.kelengkapan ?? 'Tidak Sesuai',
                    keterangan: existing?.keterangan ?? '',
                    bobot_sub_aspek: sa.bobot_sub_aspek,
                    nama_sub_aspek: sa.nama_sub_aspek,
                    nilai: existing?.nilai ?? 0,
                    is_unit_required: !!sa.is_unit_required
                }
            })

            setAspekList(aspek)
            setSubAspekList(subAspek)
            setDetails(rows)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
            navigate('/admin/results')
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

    function updateTim(index, value) {
        setIdentity(prev => {
            const newTim = [...prev.tim_kunjungan];
            newTim[index] = value;
            return { ...prev, tim_kunjungan: newTim };
        });
    }

    function addTim() {
        if (identity.tim_kunjungan.length < 5) {
            setIdentity(prev => ({ ...prev, tim_kunjungan: [...prev.tim_kunjungan, ''] }));
        }
    }

    function removeTim(index) {
        setIdentity(prev => {
            const newTim = prev.tim_kunjungan.filter((_, i) => i !== index);
            return { ...prev, tim_kunjungan: newTim.length > 0 ? newTim : [''] };
        });
    }

    const totalNilai = calcTotalNilai(details)
    const status = determineStatus(totalNilai)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!identity.nama_ro || !identity.nama_kl || !identity.tanggal_kunjungan) {
            toast.error('Harap lengkapi informasi identitas')
            return
        }

        setSubmitting(true)

        try {
            // Validation: tim_kunjungan
            const timArray = identity.tim_kunjungan.map(t => t.trim()).filter(t => t !== '');
            if (timArray.length === 0) {
                toast.error('Minimal 1 anggota tim kunjungan wajib diisi')
                setSubmitting(false)
                return
            }

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

            // Validation: Signature
            let finalTtd = identity.ttd_kepala_kl;
            if (showCanvas) {
                if (!sigCanvas.current || typeof sigCanvas.current.isEmpty !== 'function') {
                    throw new Error('Canvas tanda tangan tidak terinisialisasi dengan baik')
                }
                if (sigCanvas.current.isEmpty()) {
                    toast.error('Tanda Tangan Kepala Kantor Layanan wajib diisi');
                    setSubmitting(false)
                    return;
                }
                finalTtd = sigCanvas.current.getCanvas().toDataURL('image/png');
            }

            const payloadIdentity = {
                ...identity,
                tim_kunjungan: timArray.join(', '),
                ttd_kepala_kl: finalTtd
            };
            await updateSidak(id, { identity: payloadIdentity, details })
            toast.success('Laporan SIDAK berhasil diperbarui!')
            navigate(isAdmin ? '/admin/results' : '/')
        } catch (err) {
            console.error('Submit Error:', err)
            toast.error('Gagal memperbarui: ' + (err.message || 'Terjadi kesalahan sistem'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={() => navigate(isAdmin ? '/admin/results' : '/')} className="btn-secondary px-2 sm:px-4">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Edit Laporan SIDAK</h1>
                    <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5">Lakukan perubahan pada data identitas atau hasil checklist</p>
                </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identity Section */}
                <div className="card space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="form-label mb-1.5 flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                Regional Office
                            </label>
                            <select
                                value={identity.nama_ro}
                                onChange={e => setIdentity({ ...identity, nama_ro: e.target.value })}
                                className="form-input"
                                required
                            >
                                <option value="">Pilih Regional Office</option>
                                {RO_OPTIONS.map((ro) => (
                                    <option key={ro} value={ro}>{ro}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label mb-1.5 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                Kantor Layanan
                            </label>
                            <input
                                type="text"
                                value={identity.nama_kl}
                                onChange={e => setIdentity({ ...identity, nama_kl: e.target.value })}
                                className="form-input"
                                placeholder="Contoh: KL Sudirman"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1.5 flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                Vendor Pelaksana
                            </label>
                            <select
                                value={identity.vendor}
                                onChange={e => setIdentity({ ...identity, vendor: e.target.value })}
                                className="form-input"
                                required
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
                        <div>
                            <label className="form-label mb-1.5 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                Tanggal Kunjungan
                            </label>
                            <input
                                type="date"
                                value={identity.tanggal_kunjungan}
                                onChange={e => setIdentity({ ...identity, tanggal_kunjungan: e.target.value })}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Tim Kunjungan */}
                    <div className="pt-2 border-t border-gray-100">
                        <label className="form-label mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                Tim Kunjungan
                            </span>
                            <span className="text-xs font-normal text-gray-500">{identity.tim_kunjungan.length}/5 orang</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {identity.tim_kunjungan.map((tim, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="flex-grow">
                                        <input
                                            type="text"
                                            value={tim}
                                            onChange={e => updateTim(index, e.target.value)}
                                            className="form-input"
                                            placeholder={`Anggota Tim ${index + 1}`}
                                            required={index === 0}
                                        />
                                    </div>
                                    {identity.tim_kunjungan.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTim(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-red-100"
                                            title="Hapus"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {identity.tim_kunjungan.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addTim}
                                    className="flex items-center justify-center gap-2 h-[42px] border-2 border-dashed border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Tambah
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Score Summary Banner */}
                {isAdmin && (
                    <div className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm transition-all ${status === 'Comply' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
                        }`}>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-medium opacity-80 uppercase tracking-wider">Total Skor Akhir</p>
                                <p className="text-3xl sm:text-4xl font-black">{totalNilai.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="text-center sm:text-right w-full sm:w-auto">
                            <p className="text-[10px] sm:text-xs opacity-80 mb-1 uppercase tracking-wider">Status Kelulusan</p>
                            <div className="flex items-center justify-center sm:justify-end gap-2 bg-white/20 px-4 py-1.5 rounded-full">
                                <span className="text-base sm:text-lg font-bold">{status === 'Comply' ? 'LULUS' : 'TIDAK LULUS'}</span>
                            </div>
                            <p className="text-[10px] opacity-60 mt-1.5 italic">*Batas minimum 80.00</p>
                        </div>
                    </div>
                )}


                {/* Checklist Sections */}
                {aspekList.map((aspek) => {
                    const aspekSubAspek = subAspekList.filter((sa) => sa.aspek_id === aspek.id)
                    const aspekDetails = details.filter((d) => d.aspek_id === aspek.id)
                    const nilaiAspek = calcNilaiAspek(details, aspek.id)

                    return (
                        <div key={aspek.id} className="card p-0 overflow-hidden border-2 border-red-100">
                            {/* Aspek Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 bg-red-900 border-b border-red-800 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-white/30 rounded-full" />
                                    <div>
                                        <h3 className="font-bold text-white text-sm sm:text-base">{aspek.nama_aspek}</h3>
                                        {isAdmin && (
                                            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                                                Bobot: {Number(aspek.bobot_aspek).toFixed(2)}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                    {isAdmin && (
                                        <div className="text-left sm:text-right">
                                            <p className="text-[10px] text-white/60 font-bold uppercase tracking-tight">Capaian</p>
                                            <p className="text-xl sm:text-2xl font-black text-white">{nilaiAspek.toFixed(2)}</p>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setAllSesuai(aspek.id)}
                                        className="btn-secondary bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-xs py-1.5 border-white/20"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Auto Sesuai
                                    </button>
                                </div>
                            </div>


                            {/* Sub Aspek Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="table-th py-3 min-w-[150px]">Sub Aspek</th>
                                            <th className="table-th py-3 w-32 sm:w-40 text-center">Hasil</th>
                                            <th className="table-th py-3 w-20 sm:w-24 text-center hidden md:table-cell">Unit</th>
                                            <th className="table-th py-3 hidden lg:table-cell">Keterangan</th>
                                            {isAdmin && <th className="table-th py-3 w-16 sm:w-20 text-center">Nilai</th>}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {aspekDetails.map((d) => (
                                            <tr key={d.sub_aspek_id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="table-td py-3 font-medium text-gray-700">{d.nama_sub_aspek}</td>
                                                <td className="table-td py-3">
                                                    <select
                                                        value={d.kelengkapan}
                                                        onChange={(e) => updateDetail(d.sub_aspek_id, 'kelengkapan', e.target.value)}
                                                        className={`w-full px-2 sm:px-3 py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold transition-all focus:ring-2 focus:ring-brand-500 outline-none ${d.kelengkapan === 'Sesuai' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                                                            }`}
                                                    >
                                                        <option value="Sesuai">Sesuai</option>
                                                        <option value="Tidak Sesuai">Tidak</option>
                                                    </select>
                                                </td>
                                                <td className="table-td py-3 text-center hidden md:table-cell">
                                                    <input
                                                        type="number"
                                                        value={d.jumlah_unit || ''}
                                                        onChange={(e) => updateDetail(d.sub_aspek_id, 'jumlah_unit', e.target.value)}
                                                        className={`w-16 px-2 py-1.5 text-center border rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all ${d.is_unit_required && (!d.jumlah_unit || Number(d.jumlah_unit) <= 0)
                                                            ? 'border-amber-400 bg-amber-50/30'
                                                            : 'border-gray-200'
                                                            }`}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="table-td py-3 hidden lg:table-cell">
                                                    <input
                                                        type="text"
                                                        value={d.keterangan || ''}
                                                        onChange={(e) => updateDetail(d.sub_aspek_id, 'keterangan', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                                                        placeholder="Catatan..."
                                                    />
                                                </td>
                                                {isAdmin && (
                                                    <td className="table-td py-3 text-center font-black text-brand-600">
                                                        {d.nilai.toFixed(2)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                })}

                {/* Signature Pad Section */}
                <div className="card space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900">Tanda Tangan Kepala Kantor Layanan <span className="text-red-500">*</span></h3>
                            <p className="text-xs text-gray-500 mt-1">Harap tanda tangan di dalam kotak di bawah ini sebelum menyimpan perubahan.</p>
                        </div>
                        {!showCanvas && (
                            <button 
                                type="button" 
                                onClick={() => setShowCanvas(true)}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                                Ganti Tanda Tangan
                            </button>
                        )}
                    </div>

                    {!showCanvas && identity.ttd_kepala_kl ? (
                        <div className="border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center p-4 w-full h-48 overflow-hidden">
                            <img src={identity.ttd_kepala_kl} alt="Tanda Tangan Saat Ini" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        </div>
                    ) : (
                        <>
                            <div className="border-2 border-dashed border-brand-300 rounded-xl overflow-hidden bg-white hover:border-brand-400 transition-colors shadow-inner">
                                <SignatureCanvas 
                                    ref={sigCanvas}
                                    penColor="black"
                                    canvasProps={{
                                        className: 'w-full h-48 cursor-crosshair touch-none'
                                    }}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                {identity.ttd_kepala_kl && (
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCanvas(false)}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        Batal Ganti
                                    </button>
                                )}
                                <button 
                                    type="button" 
                                    onClick={() => sigCanvas.current.clear()}
                                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                                >
                                    <Eraser className="w-4 h-4" />
                                    Hapus Tanda Tangan
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 pb-12">
                    <button type="button" onClick={() => navigate(isAdmin ? '/admin/results' : '/')} className="btn-secondary w-full sm:w-auto px-8 justify-center">
                        Batal
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto px-12 py-3 text-sm sm:text-base shadow-lg shadow-brand-200 justify-center">
                        {submitting ? (
                            <>
                                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                Memperbarui...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    )
}
