import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eraser, User, Building2, MapPin, Calendar, ClipboardList } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { getCPCReportById, updateCPCReport } from '../../services/cpcService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const VENDOR_OPTIONS = ["BGI", "Advantage", "SSI", "Kejar", "TAG", "UG", "Lainnya"]
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
]

export default function EditCPCPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    
    const [identity, setIdentity] = useState({
        petugas_names: '',
        nama_ro: '',
        nama_vendor: '',
        alamat_cpc: '',
        tanggal_kunjungan: '',
        tujuan_kunjungan: '',
        vendor_pelaksana: '',
        nama_kepala_kl: '',
        nama_perusahaan: '',
        nama_ro_user: '',
        nama_dop_user: '',
        ttd_kepala_kl: '',
        ttd_ro: '',
        ttd_dop: ''
    })

    const [details, setDetails] = useState([])
    const sigVendor = useRef({})
    const sigRO = useRef({})
    const sigDOP = useRef({})

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        try {
            const data = await getCPCReportById(id)
            setIdentity({
                petugas_names: data.petugas_names,
                nama_ro: data.nama_ro,
                nama_vendor: data.nama_vendor,
                alamat_cpc: data.alamat_cpc,
                tanggal_kunjungan: data.tanggal_kunjungan,
                tujuan_kunjungan: data.tujuan_kunjungan,
                vendor_pelaksana: data.vendor_pelaksana,
                nama_kepala_kl: data.nama_kepala_kl,
                nama_perusahaan: data.nama_perusahaan,
                nama_ro_user: data.nama_ro_user || '',
                nama_dop_user: data.nama_dop_user || '',
                ttd_kepala_kl: data.ttd_kepala_kl,
                ttd_ro: data.ttd_ro || '',
                ttd_dop: data.ttd_dop || ''
            })
            setDetails(data.laporan_cpc_detail || [])
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
            navigate('/admin/results-cpc')
        } finally {
            setLoading(false)
        }
    }

    const updateDetail = (idx, field, value) => {
        const newDetails = [...details]
        newDetails[idx][field] = value
        setDetails(newDetails)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const ttdVendor = sigVendor.current.isEmpty() ? identity.ttd_kepala_kl : sigVendor.current.getCanvas().toDataURL('image/png')
            const ttdRO = sigRO.current.isEmpty() ? identity.ttd_ro : sigRO.current.getCanvas().toDataURL('image/png')
            const ttdDOP = sigDOP.current.isEmpty() ? identity.ttd_dop : sigDOP.current.getCanvas().toDataURL('image/png')

            const payloadIdentity = {
                ...identity,
                ttd_kepala_kl: ttdVendor,
                ttd_ro: ttdRO,
                ttd_bo: null,
                ttd_dop: ttdDOP
            }

            await updateCPCReport(id, { identity: payloadIdentity, details })
            toast.success('Laporan berhasil diperbarui!')
            navigate('/admin/results-cpc')
        } catch (err) {
            toast.error('Gagal memperbarui: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center"><LoadingSpinner /></div>

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/results-cpc')} className="btn-secondary px-3 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Laporan CPC</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Info Section */}
                <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="form-label text-xs uppercase text-gray-400">Nama Petugas BRI</label>
                        <input 
                            value={identity.petugas_names}
                            onChange={(e) => setIdentity({...identity, petugas_names: e.target.value})}
                            className="form-input text-xs" 
                        />
                    </div>
                    <div>
                        <label className="form-label text-xs uppercase text-gray-400">Regional Office (RO)</label>
                        <select 
                            value={identity.nama_ro}
                            onChange={(e) => setIdentity({...identity, nama_ro: e.target.value})}
                            className="form-input text-xs"
                        >
                            <option value="">Pilih RO...</option>
                            {RO_OPTIONS.map(ro => <option key={ro} value={ro}>{ro}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label text-xs uppercase text-gray-400">Nama Kantor Layanan</label>
                        <input 
                            value={identity.nama_vendor}
                            onChange={(e) => setIdentity({...identity, nama_vendor: e.target.value})}
                            className="form-input text-xs" 
                        />
                    </div>
                    <div>
                        <label className="form-label text-xs uppercase text-gray-400">Vendor Pelaksana (Stempel)</label>
                        <select 
                            value={identity.vendor_pelaksana}
                            onChange={(e) => setIdentity({...identity, vendor_pelaksana: e.target.value})}
                            className="form-input text-xs"
                        >
                            <option value="">Pilih Vendor...</option>
                            {VENDOR_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="form-label text-xs uppercase text-gray-400">Alamat CPC</label>
                        <input 
                            value={identity.alamat_cpc}
                            onChange={(e) => setIdentity({...identity, alamat_cpc: e.target.value})}
                            className="form-input text-xs" 
                        />
                    </div>
                    <div>
                        <label className="form-label text-xs uppercase text-gray-400">Tanggal Kunjungan</label>
                        <input 
                            type="date"
                            value={identity.tanggal_kunjungan}
                            onChange={(e) => setIdentity({...identity, tanggal_kunjungan: e.target.value})}
                            className="form-input text-xs" 
                        />
                    </div>
                    <div>
                        <label className="form-label text-xs uppercase text-gray-400">Tujuan Kunjungan</label>
                        <input 
                            value={identity.tujuan_kunjungan}
                            onChange={(e) => setIdentity({...identity, tujuan_kunjungan: e.target.value})}
                            className="form-input text-xs" 
                        />
                    </div>
                </div>

                {/* Table Details */}
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-white">
                            <tr className="uppercase text-[10px] tracking-widest">
                                <th className="px-4 py-3 text-left">Keterangan</th>
                                <th className="px-4 py-3 text-center w-64">Kondisi</th>
                                <th className="px-4 py-3 text-left">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {details.map((detail, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-4 font-medium">{detail.item_name}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-4">
                                            {['Sesuai', 'Tidak Sesuai', 'Ada', 'Tidak', 'Milik Sendiri', 'Sewa'].filter(opt => {
                                                if (detail.item_name.includes('Status')) return opt === 'Milik Sendiri' || opt === 'Sewa'
                                                if (detail.item_name.includes('Lain-lain')) return opt === 'Ada' || opt === 'Tidak'
                                                return opt === 'Sesuai' || opt === 'Tidak Sesuai'
                                            }).map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        checked={detail.kondisi === opt}
                                                        onChange={() => updateDetail(idx, 'kondisi', opt)}
                                                        className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                                                    />
                                                    <span className="text-xs">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <input 
                                            type="text" 
                                            value={detail.keterangan || ''}
                                            onChange={(e) => updateDetail(idx, 'keterangan', e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-200 focus:border-brand-500 outline-none text-xs"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Signatures Section */}
                <div className="card space-y-8">
                    <h3 className="font-bold text-gray-900 border-b pb-2 text-lg">Edit Otorisasi & Tanda Tangan</h3>
                    <p className="text-[10px] text-amber-600 italic">*Biarkan area tanda tangan kosong jika tidak ingin mengubah tanda tangan yang sudah ada.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. Vendor / KL */}
                        <div className="space-y-4 border-r pr-8 last:border-0">
                            <label className="form-label text-[10px] uppercase text-gray-400 font-bold">Pihak Vendor / KL</label>
                            <input 
                                value={identity.nama_kepala_kl}
                                onChange={(e) => setIdentity({...identity, nama_kepala_kl: e.target.value})}
                                className="form-input text-xs bg-gray-50/50" placeholder="Nama..."
                            />
                            <input 
                                value={identity.nama_perusahaan}
                                onChange={(e) => setIdentity({...identity, nama_perusahaan: e.target.value})}
                                className="form-input text-xs bg-gray-50/50" placeholder="Perusahaan..."
                            />
                            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white mt-4">
                                <SignatureCanvas ref={sigVendor} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                            </div>
                            <button type="button" onClick={() => sigVendor.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus Canvas</button>
                            {identity.ttd_kepala_kl && (
                                <div className="mt-2 text-center">
                                    <p className="text-[8px] text-gray-400 uppercase mb-1">TTD Saat Ini:</p>
                                    <img src={identity.ttd_kepala_kl} alt="TTD Lama" className="h-10 opacity-50 mix-blend-multiply mx-auto" />
                                </div>
                            )}
                        </div>

                        {/* 2. BO / RO */}
                        <div className="space-y-4 border-r pr-8 last:border-0">
                            <label className="form-label text-[10px] uppercase text-gray-400 font-bold">Branch Office / Regional Office</label>
                            <input 
                                value={identity.nama_ro_user}
                                onChange={(e) => setIdentity({...identity, nama_ro_user: e.target.value})}
                                className="form-input text-xs bg-gray-50/50" placeholder="Nama..."
                            />
                            <div className="h-[42px] px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg text-[10px] text-brand-600 flex items-center italic font-medium">
                                BO / RO {identity.nama_ro || '-'}
                            </div>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white mt-4">
                                <SignatureCanvas ref={sigRO} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                            </div>
                            <button type="button" onClick={() => sigRO.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus Canvas</button>
                            {identity.ttd_ro && (
                                <div className="mt-2 text-center">
                                    <p className="text-[8px] text-gray-400 uppercase mb-1">TTD Saat Ini:</p>
                                    <img src={identity.ttd_ro} alt="TTD Lama" className="h-10 opacity-50 mix-blend-multiply mx-auto" />
                                </div>
                            )}
                        </div>

                        {/* 3. DOP */}
                        <div className="space-y-4">
                            <label className="form-label text-[10px] uppercase text-gray-400 font-bold">Digital Operation</label>
                            <input 
                                value={identity.nama_dop_user}
                                onChange={(e) => setIdentity({...identity, nama_dop_user: e.target.value})}
                                className="form-input text-xs bg-gray-50/50" placeholder="Nama..."
                            />
                            <div className="h-[42px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-400 flex items-center italic">
                                Digital Operation (DOP)
                            </div>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white mt-4">
                                <SignatureCanvas ref={sigDOP} penColor="black" canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} />
                            </div>
                            <button type="button" onClick={() => sigDOP.current.clear()} className="text-[10px] text-red-500 hover:underline">Hapus Canvas</button>
                            {identity.ttd_dop && (
                                <div className="mt-2 text-center">
                                    <p className="text-[8px] text-gray-400 uppercase mb-1">TTD Saat Ini:</p>
                                    <img src={identity.ttd_dop} alt="TTD Lama" className="h-10 opacity-50 mix-blend-multiply mx-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-12">
                    <button type="button" onClick={() => navigate('/admin/results-cpc')} className="btn-secondary">
                        Batal
                    </button>
                    <button type="submit" disabled={submitting} className="btn-success px-12 h-[52px]">
                        {submitting ? 'Menyimpan...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Perbarui Laporan CPC
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
