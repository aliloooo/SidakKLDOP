import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, Building2, MapPin, Calendar, ClipboardList } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function EditTIDPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [report, setReport] = useState(null)
    const [details, setDetails] = useState([])

    useEffect(() => {
        loadReport()
    }, [id])

    async function loadReport() {
        try {
            const { data, error } = await supabase
                .from('laporan_tid_header')
                .select('*, laporan_tid_detail(*)')
                .eq('id', id)
                .single()

            if (error) throw error
            setReport(data)
            
            // Map details to include display logic
            const mappedDetails = data.laporan_tid_detail.map(d => {
                // Check if it's camera type (has "Terlama:" in keterangan)
                const isCamera = d.item_name.toLowerCase().includes('camera')
                let keteranganObj = d.keterangan
                if (isCamera && d.keterangan?.includes('Terlama:')) {
                    const parts = d.keterangan.split(', ')
                    keteranganObj = {
                        terlama: parts[0]?.replace('Terlama: ', '') || '',
                        terbaru: parts[1]?.replace('Terbaru: ', '') || ''
                    }
                }

                // Check if it's multi-condition (has comma)
                const isMulti = d.item_name.toLowerCase().includes('kartu tertelan')
                
                return {
                    ...d,
                    type: isMulti ? 'checkbox' : 'radio',
                    kondisiArray: isMulti ? (d.kondisi?.split(', ') || []) : d.kondisi,
                    keteranganObj: keteranganObj,
                    isCamera: isCamera,
                    isJumlah: d.item_name.toLowerCase().includes('cctv') || isMulti
                }
            })
            setDetails(mappedDetails)
        } catch (err) {
            toast.error('Gagal memuat laporan: ' + err.message)
            navigate('/admin/results-tid')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateDetail = (idx, field, value) => {
        const newDetails = [...details]
        if (field === 'kondisiArray') {
            const current = newDetails[idx].kondisiArray || []
            if (current.includes(value)) {
                newDetails[idx].kondisiArray = current.filter(v => v !== value)
            } else {
                newDetails[idx].kondisiArray = [...current, value]
            }
        } else if (field === 'keterangan_terlama') {
            newDetails[idx].keteranganObj.terlama = value
        } else if (field === 'keterangan_terbaru') {
            newDetails[idx].keteranganObj.terbaru = value
        } else if (field === 'keterangan_jumlah') {
            newDetails[idx].keterangan = value
        } else {
            newDetails[idx][field] = value
        }
        setDetails(newDetails)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // 1. Update Header
            const { error: headerError } = await supabase
                .from('laporan_tid_header')
                .update({
                    nama_ro: report.nama_ro,
                    nama_vendor: report.nama_vendor,
                    alamat_tid: report.alamat_tid,
                    tanggal_kunjungan: report.tanggal_kunjungan,
                    tujuan_kunjungan: report.tujuan_kunjungan,
                    petugas_names: report.petugas_names,
                    nama_kepala_kl: report.nama_kepala_kl,
                    nama_perusahaan: report.nama_perusahaan,
                    nama_ro_user: report.nama_ro_user,
                    nama_dop_user: report.nama_dop_user,
                    vendor_pelaksana: report.vendor_pelaksana,
                    catatan_lain: report.catatan_lain
                })
                .eq('id', id)

            if (headerError) throw headerError

            // 2. Update Details (Delete and Re-insert is safer)
            await supabase.from('laporan_tid_detail').delete().eq('tid_id', id)

            const detailsToInsert = details.map(d => {
                let finalKet = d.keterangan
                if (d.isCamera && typeof d.keteranganObj === 'object') {
                    finalKet = `Terlama: ${d.keteranganObj.terlama}, Terbaru: ${d.keteranganObj.terbaru}`
                } else if (d.isJumlah && !d.isCamera) {
                    finalKet = d.keterangan?.includes('Jumlah:') ? d.keterangan : `Jumlah: ${d.keterangan}`
                }

                return {
                    tid_id: id,
                    item_name: d.item_name,
                    kondisi: Array.isArray(d.kondisiArray) ? d.kondisiArray.join(', ') : d.kondisi,
                    keterangan: finalKet
                }
            })

            const { error: detailError } = await supabase
                .from('laporan_tid_detail')
                .insert(detailsToInsert)

            if (detailError) throw detailError

            toast.success('Laporan berhasil diperbarui')
            navigate('/admin/results-tid')
        } catch (err) {
            toast.error('Gagal memperbarui: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/results-tid')} className="btn-secondary px-3 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Laporan TID</h1>
                    <p className="text-sm text-gray-500">Sesuaikan informasi laporan kunjungan</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card space-y-5">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Informasi Umum</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Regional Office</label>
                            <input 
                                value={report.nama_ro} 
                                onChange={e => setReport({...report, nama_ro: e.target.value})}
                                className="form-input" 
                            />
                        </div>
                        <div>
                            <label className="form-label">Kantor Layanan</label>
                            <input 
                                value={report.nama_vendor} 
                                onChange={e => setReport({...report, nama_vendor: e.target.value})}
                                className="form-input" 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Alamat TID</label>
                            <input 
                                value={report.alamat_tid} 
                                onChange={e => setReport({...report, alamat_tid: e.target.value})}
                                className="form-input" 
                            />
                        </div>
                        <div>
                            <label className="form-label">Tanggal Kunjungan</label>
                            <input 
                                type="date"
                                value={report.tanggal_kunjungan} 
                                onChange={e => setReport({...report, tanggal_kunjungan: e.target.value})}
                                className="form-input" 
                            />
                        </div>
                        <div>
                            <label className="form-label">Tujuan Kunjungan</label>
                            <input 
                                value={report.tujuan_kunjungan} 
                                onChange={e => setReport({...report, tujuan_kunjungan: e.target.value})}
                                className="form-input" 
                            />
                        </div>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-800 text-white uppercase text-[10px] tracking-widest">
                                <th className="px-4 py-3 text-center w-12">No</th>
                                <th className="px-4 py-3 text-left">Item Penilaian</th>
                                <th className="px-4 py-3 text-center w-64">Kondisi</th>
                                <th className="px-4 py-3 text-left">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {details.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                    <td className="px-4 py-4 font-semibold text-gray-900">{item.item_name}</td>
                                    <td className="px-4 py-4">
                                        {item.type === 'radio' ? (
                                            <input 
                                                type="text" 
                                                value={item.kondisi}
                                                onChange={e => handleUpdateDetail(idx, 'kondisi', e.target.value)}
                                                className="form-input text-xs"
                                            />
                                        ) : (
                                            <textarea 
                                                value={Array.isArray(item.kondisiArray) ? item.kondisiArray.join(', ') : item.kondisi}
                                                onChange={e => handleUpdateDetail(idx, 'kondisi', e.target.value)}
                                                className="form-input text-xs h-20"
                                                placeholder="Pisahkan dengan koma..."
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        {item.isCamera ? (
                                            <div className="space-y-2">
                                                <input 
                                                    type="date" 
                                                    value={item.keteranganObj?.terlama || ''}
                                                    onChange={e => handleUpdateDetail(idx, 'keterangan_terlama', e.target.value)}
                                                    className="form-input text-[10px] py-1"
                                                />
                                                <input 
                                                    type="date" 
                                                    value={item.keteranganObj?.terbaru || ''}
                                                    onChange={e => handleUpdateDetail(idx, 'keterangan_terbaru', e.target.value)}
                                                    className="form-input text-[10px] py-1"
                                                />
                                            </div>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={item.keterangan || ''}
                                                onChange={e => handleUpdateDetail(idx, 'keterangan', e.target.value)}
                                                className="form-input text-xs"
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Catatan Lain (Admin Edit)</h3>
                    <textarea 
                        value={report.catatan_lain || ''}
                        onChange={e => setReport({...report, catatan_lain: e.target.value})}
                        className="form-input min-h-[120px]"
                        placeholder="Tambahkan catatan administratif jika diperlukan..."
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/admin/results-tid')} className="btn-secondary">Batal</button>
                    <button type="submit" disabled={submitting} className="btn-primary px-8 h-12">
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
