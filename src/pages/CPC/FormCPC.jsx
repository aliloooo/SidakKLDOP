import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eraser } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../../services/supabaseClient'
import useCPCStore from '../../store/useCPCStore'
import { createCPCReport } from '../../services/cpcService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const CPC_ITEMS = [
    { name: 'Jumlah CPC', label: '1) Jumlah CPC', options: ['Ada', 'Tidak'], ketLabel: 'Jumlah :' },
    { name: 'Telepon Kantor', label: '2) Telepon Kantor', options: ['Ada', 'Tidak'], ketLabel: 'Tlp :' },
    { name: 'Facsimile', label: '3) Facsimile', options: ['Ada', 'Tidak'], ketLabel: 'Fax :' },
    { name: 'Luas Tanah', label: '4) a. Luas Tanah', options: ['Ada', 'Tidak'], ketLabel: 'Ukuran :' },
    { name: 'Luas Bangunan', label: 'b. Luas Bangunan', options: ['Ada', 'Tidak'], ketLabel: 'Ukuran :' },
    { name: 'Size Khazanah', label: 'c. Size Khazanah', options: ['Ada', 'Tidak'], ketLabel: 'Ukuran :' },
    { name: 'Status Kepemilikan', label: 'd. Status Kepemilikan', options: ['Milik Sendiri', 'Sewa'], ketLabel: '' },
]

export default function FormCPC() {
    const navigate = useNavigate()
    const { identity, resetIdentity } = useCPCStore()
    
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [masterItems, setMasterItems] = useState([])
    const [details, setDetails] = useState([])
    const [signInfo, setSignInfo] = useState({
        nama_kepala_kl: '',
        nama_perusahaan: identity.nama_vendor || '',
        nama_ro_user: '',
        nama_dop_user: ''
    })

    const sigVendor = useRef({})
    const sigRO = useRef({})
    const sigDOP = useRef({})

    useEffect(() => {
        loadMasterItems()
    }, [])

    async function loadMasterItems() {
        const { data, error } = await supabase
            .from('master_indikator_cpc')
            .select('*')
            .order('order_index', { ascending: true })
        
        if (error) {
            toast.error('Gagal memuat indikator: ' + error.message)
        } else {
            setMasterItems(data)
            setDetails(data.map(item => ({
                item_name: item.label,
                kondisi: '',
                keterangan: ''
            })))
        }
        setLoading(false)
    }

    if (!identity.nama_vendor) {
        navigate('/input-cpc')
        return null
    }

    const updateDetail = (idx, field, value) => {
        const newDetails = [...details]
        newDetails[idx][field] = value
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

            const payloadIdentity = {
                ...identity,
                ...signInfo,
                ttd_kepala_kl: ttdVendor,
                ttd_ro: ttdRO,
                ttd_bo: null, // Bo merged to RO
                ttd_dop: ttdDOP
            }

            await createCPCReport({ identity: payloadIdentity, details })
            toast.success('Laporan CPC berhasil disimpan!')
            resetIdentity()
            navigate('/')
        } catch (err) {
            toast.error('Gagal menyimpan: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/input-cpc')} className="btn-secondary px-3 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hasil Kunjungan CPC</h1>
                    <p className="text-sm text-gray-500">Langkah 2: Detail Kondisi & Otorisasi</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-800 text-white uppercase text-[10px] tracking-widest">
                                <th className="px-4 py-3 text-center w-12">No.</th>
                                <th className="px-4 py-3 text-left">Keterangan</th>
                                <th className="px-4 py-3 text-center w-64">Kondisi</th>
                                <th className="px-4 py-3 text-left">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {masterItems.map((item, idx) => (
                                <tr key={idx} className={item.is_heading ? "bg-gray-50/80 font-bold" : "hover:bg-gray-50/50"}>
                                    <td className="px-4 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                    <td className="px-4 py-4" colSpan={item.is_heading ? 3 : 1}>
                                        <div className={item.is_heading ? "text-brand-700 uppercase tracking-wide" : "font-semibold"}>{item.label}</div>
                                    </td>
                                    {!item.is_heading && (
                                        <>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center gap-4">
                                                    {item.options?.split(',').map(opt => (
                                                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                            <input 
                                                                type="radio" 
                                                                name={`kondisi-${idx}`} 
                                                                required
                                                                checked={details[idx]?.kondisi === opt}
                                                                onChange={() => updateDetail(idx, 'kondisi', opt)}
                                                                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                                                            />
                                                            <span className="text-xs">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.ket_label && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap uppercase">{item.ket_label}</span>
                                                        <input 
                                                            type="text" 
                                                            value={details[idx]?.keterangan || ''}
                                                            onChange={(e) => updateDetail(idx, 'keterangan', e.target.value)}
                                                            className="w-full bg-transparent border-b border-gray-200 focus:border-brand-500 outline-none text-xs"
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Signatures Section */}
                <div className="card space-y-8">
                    <h3 className="font-bold text-gray-900 border-b pb-2 text-lg">Otorisasi & Tanda Tangan</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. Vendor/KL */}
                        <div className="space-y-4 flex flex-col h-full border-r pr-8 last:border-0">
                            <div className="flex-1 space-y-4">
                                <label className="form-label text-[10px] uppercase text-gray-400 font-bold">Pihak Vendor / KL</label>
                                <input 
                                    required
                                    value={signInfo.nama_kepala_kl}
                                    onChange={(e) => setSignInfo({...signInfo, nama_kepala_kl: e.target.value})}
                                    className="form-input text-xs bg-gray-50/50" 
                                    placeholder="Nama Kepala KL..."
                                />
                                <input 
                                    required
                                    value={signInfo.nama_perusahaan}
                                    onChange={(e) => setSignInfo({...signInfo, nama_perusahaan: e.target.value})}
                                    className="form-input text-xs bg-gray-50/50" 
                                    placeholder="Nama Perusahaan..."
                                />
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Tanda Tangan</span>
                                    <button type="button" onClick={() => sigVendor.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus</button>
                                </div>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <SignatureCanvas ref={sigVendor} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Branch Office / Regional Office */}
                        <div className="space-y-4 flex flex-col h-full border-r pr-8 last:border-0">
                            <div className="flex-1 space-y-4">
                                <label className="form-label text-[10px] uppercase text-gray-400 font-bold">Branch Office / Regional Office</label>
                                <input 
                                    required
                                    value={signInfo.nama_ro_user}
                                    onChange={(e) => setSignInfo({...signInfo, nama_ro_user: e.target.value})}
                                    className="form-input text-xs bg-gray-50/50" 
                                    placeholder="Nama Pejabat BO / RO..."
                                />
                                <div className="h-[42px] px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg text-[10px] text-brand-600 flex items-center italic font-medium">
                                    BO / RO {identity.nama_ro || '-'}
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Tanda Tangan</span>
                                    <button type="button" onClick={() => sigRO.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus</button>
                                </div>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <SignatureCanvas ref={sigRO} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                                </div>
                            </div>
                        </div>

                        {/* 3. Digital Operation */}
                        <div className="space-y-4 flex flex-col h-full">
                            <div className="flex-1 space-y-4">
                                <label className="form-label text-[10px] uppercase text-gray-400 font-bold">Digital Operation</label>
                                <input 
                                    required
                                    value={signInfo.nama_dop_user}
                                    onChange={(e) => setSignInfo({...signInfo, nama_dop_user: e.target.value})}
                                    className="form-input text-xs bg-gray-50/50" 
                                    placeholder="Nama Petugas DOP..."
                                />
                                <div className="h-[42px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-400 flex items-center italic">
                                    Digital Operation (DOP)
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Tanda Tangan</span>
                                    <button type="button" onClick={() => sigDOP.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus</button>
                                </div>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <SignatureCanvas ref={sigDOP} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-12">
                    <button type="button" onClick={() => navigate('/input-cpc')} className="btn-secondary">
                        Kembali
                    </button>
                    <button type="submit" disabled={submitting} className="btn-success px-12 h-[52px]">
                        {submitting ? 'Menyimpan...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan Laporan CPC
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
