import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import useTIDStore from '../../store/useTIDStore'
import { createTIDReport } from '../../services/tidService'
import { supabase } from '../../services/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function FormTID() {
    const navigate = useNavigate()
    const { identity, resetIdentity } = useTIDStore()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [details, setDetails] = useState([])

    const [signInfo, setSignInfo] = useState({
        nama_kepala_kl: '',
        nama_perusahaan: identity.nama_vendor || '',
        nama_ro_user: '',
        nama_dop_user: '',
        catatan_lain: ''
    })

    const sigVendor = useRef({})
    const sigRO = useRef({})
    const sigDOP = useRef({})

    useEffect(() => {
        loadIndikators()
    }, [])

    async function loadIndikators() {
        try {
            const { data, error } = await supabase
                .from('master_indikator_tid')
                .select('*')
                .order('order_index', { ascending: true })

            if (error) throw error

            // Transform master data to form state
            const initialDetails = data.map(item => ({
                id: item.id,
                no: item.order_index,
                name: item.label,
                type: item.input_type || 'radio',
                options: item.options?.split(',').map(o => o.trim()) || ['Ada', 'Tidak'],
                keteranganType: item.keterangan_type || 'none',
                is_heading: item.is_heading,
                kondisi: item.input_type === 'checkbox' ? [] : '',
                keterangan: (item.keterangan_type === 'camera')
                    ? { terlama: '', terbaru: '' }
                    : ''
            }))

            setDetails(initialDetails)
        } catch (err) {
            toast.error('Gagal memuat indikator: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!identity.nama_vendor) {
        navigate('/input-tid')
        return null
    }

    const updateKondisi = (idx, value) => {
        const newDetails = [...details]
        const item = newDetails[idx]

        if (item.type === 'checkbox') {
            const current = item.kondisi || []
            if (current.includes(value)) {
                item.kondisi = current.filter(v => v !== value)
            } else {
                item.kondisi = [...current, value]
            }
        } else {
            item.kondisi = value
        }
        setDetails(newDetails)
    }

    const updateKeterangan = (idx, field, value) => {
        const newDetails = [...details]
        if (typeof newDetails[idx].keterangan === 'object') {
            newDetails[idx].keterangan[field] = value
        } else {
            newDetails[idx].keterangan = value
        }
        setDetails(newDetails)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (sigVendor.current.isEmpty() || sigRO.current.isEmpty() || sigDOP.current.isEmpty()) {
            toast.error('Semua tanda tangan wajib diisi')
            return
        }

        setSubmitting(true)
        try {
            const ttdVendor = sigVendor.current.getCanvas().toDataURL('image/png')
            const ttdRO = sigRO.current.getCanvas().toDataURL('image/png')
            const ttdDOP = sigDOP.current.getCanvas().toDataURL('image/png')

            // Prepare details for saving (filter out headings)
            const finalDetails = details
                .filter(d => !d.is_heading)
                .map(d => {
                    let ketStr = ''
                    if (d.keteranganType === 'camera') {
                        ketStr = `Terlama: ${d.keterangan.terlama}, Terbaru: ${d.keterangan.terbaru}`
                    } else if (d.keteranganType === 'jumlah') {
                        ketStr = `Jumlah: ${d.keterangan}`
                    } else {
                        ketStr = d.keterangan || ''
                    }

                    return {
                        item_name: d.name,
                        kondisi: Array.isArray(d.kondisi) ? d.kondisi.join(', ') : d.kondisi,
                        keterangan: ketStr
                    }
                })

            const payloadIdentity = {
                ...identity,
                ...signInfo,
                catatan_lain: signInfo.catatan_lain, // Pastikan terambil dari state terbaru
                ttd_kepala_kl: ttdVendor,
                ttd_ro: ttdRO,
                ttd_dop: ttdDOP
            }

            await createTIDReport({ identity: payloadIdentity, details: finalDetails })
            toast.success('Laporan TID berhasil disimpan!')
            resetIdentity()
            navigate('/')
        } catch (err) {
            toast.error('Gagal menyimpan: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="py-20"><LoadingSpinner /></div>

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/input-tid')} className="btn-secondary px-3 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hasil Kunjungan TID</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card p-0 overflow-hidden shadow-xl border-brand-100 ring-1 ring-brand-900/5">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="px-4 py-4 text-center w-12 font-black uppercase text-[10px] tracking-widest">No</th>
                                <th className="px-4 py-4 text-left font-black uppercase text-[10px] tracking-widest border-l border-gray-800">List Pengecekan</th>
                                <th className="px-4 py-4 text-center w-1/3 font-black uppercase text-[10px] tracking-widest border-l border-gray-800">Kondisi</th>
                                <th className="px-4 py-4 text-left w-1/4 font-black uppercase text-[10px] tracking-widest border-l border-gray-800">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {details.map((item, idx) => (
                                item.is_heading ? (
                                    <tr key={`heading-${idx}`} className="bg-brand-50/50">
                                        <td colSpan={4} className="px-6 py-3 font-black text-brand-700 uppercase tracking-widest text-[10px]">
                                            {item.name}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-5 text-center font-bold text-brand-600 align-top">{idx + 1}.</td>
                                        <td className="px-4 py-5 font-semibold text-gray-900 align-top border-l border-gray-50">{item.name}</td>
                                        <td className="px-4 py-5 border-l border-gray-50 align-top">
                                            <div className="space-y-3">
                                                {item.options.map(opt => (
                                                    <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center mt-0.5">
                                                            <input
                                                                type={item.type}
                                                                name={`kondisi-${idx}`}
                                                                required={item.type === 'radio'}
                                                                checked={item.type === 'checkbox' ? item.kondisi.includes(opt) : item.kondisi === opt}
                                                                onChange={() => updateKondisi(idx, opt)}
                                                                className={`w-5 h-5 border-2 border-gray-300 ${item.type === 'radio' ? 'rounded-full' : 'rounded'} checked:border-brand-600 checked:bg-brand-600 focus:ring-brand-500 transition-all`}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-700 group-hover:text-brand-700 transition-colors">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 border-l border-gray-50 align-top">
                                            {item.keteranganType === 'camera' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tgl Rekaman Terlama</label>
                                                        <input
                                                            type="date"
                                                            value={item.keterangan.terlama}
                                                            onChange={(e) => updateKeterangan(idx, 'terlama', e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rekaman Terbaru</label>
                                                        <input
                                                            type="date"
                                                            value={item.keterangan.terbaru}
                                                            onChange={(e) => updateKeterangan(idx, 'terbaru', e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {item.keteranganType === 'jumlah' && (
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Jumlah</label>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.keterangan}
                                                        onChange={(e) => updateKeterangan(idx, null, e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                                                    />
                                                </div>
                                            )}
                                            {item.keteranganType === 'text' && (
                                                <textarea
                                                    placeholder="Keterangan..."
                                                    value={item.keterangan}
                                                    onChange={(e) => updateKeterangan(idx, null, e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs h-20 outline-none focus:border-brand-500"
                                                />
                                            )}
                                            {item.keteranganType === 'none' && (
                                                <span className="text-xs text-gray-300 italic">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2 text-lg text-brand-600 flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Catatan Lain (Opsional)
                    </h3>
                    <textarea 
                        value={signInfo.catatan_lain}
                        onChange={(e) => setSignInfo({...signInfo, catatan_lain: e.target.value})}
                        className="form-input min-h-[120px] bg-gray-50/50"
                        placeholder="Masukkan catatan tambahan jika ada..."
                    />
                </div>

                <div className="card space-y-8">
                    <h3 className="font-bold text-gray-900 border-b pb-2 text-lg">Otorisasi & Tanda Tangan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <label className="form-label text-[10px] uppercase text-gray-400 font-bold tracking-widest">Pihak Vendor / KL</label>
                            <input
                                required value={signInfo.nama_kepala_kl}
                                onChange={(e) => setSignInfo({ ...signInfo, nama_kepala_kl: e.target.value })}
                                className="form-input text-xs" placeholder="Nama Kepala KL..."
                            />
                            <div className="space-y-2 pt-2">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <SignatureCanvas ref={sigVendor} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                                </div>
                                <button type="button" onClick={() => sigVendor.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus TTD</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="form-label text-[10px] uppercase text-gray-400 font-bold tracking-widest">Branch / Regional Office</label>
                            <input
                                required value={signInfo.nama_ro_user}
                                onChange={(e) => setSignInfo({ ...signInfo, nama_ro_user: e.target.value })}
                                className="form-input text-xs" placeholder="Nama Pejabat BO / RO..."
                            />
                            <div className="space-y-2 pt-2">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <SignatureCanvas ref={sigRO} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                                </div>
                                <button type="button" onClick={() => sigRO.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus TTD</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="form-label text-[10px] uppercase text-gray-400 font-bold tracking-widest">Digital Operation</label>
                            <input
                                required value={signInfo.nama_dop_user}
                                onChange={(e) => setSignInfo({ ...signInfo, nama_dop_user: e.target.value })}
                                className="form-input text-xs" placeholder="Nama Petugas DOP..."
                            />
                            <div className="space-y-2 pt-2">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <SignatureCanvas ref={sigDOP} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                                </div>
                                <button type="button" onClick={() => sigDOP.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus TTD</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="submit" disabled={submitting} className="btn-success px-12 h-[52px] shadow-lg shadow-green-900/10 transition-transform active:scale-95">
                        {submitting ? 'Menyimpan...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan Laporan TID
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
