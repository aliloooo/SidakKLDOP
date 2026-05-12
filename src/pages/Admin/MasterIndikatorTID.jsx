import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Settings2 } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MasterIndikatorTID() {
    const [indikators, setIndikators] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({ 
        label: '', 
        ket_label: '', 
        options: 'Ada,Tidak', 
        order_index: 0, 
        is_heading: false,
        input_type: 'radio',
        keterangan_type: 'none'
    })

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
            setIndikators(data)
        } catch (err) {
            toast.error('Gagal memuat: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.label) return toast.error('Label wajib diisi')
        try {
            if (editingId) {
                const { error } = await supabase.from('master_indikator_tid').update(formData).eq('id', editingId)
                if (error) throw error
                toast.success('Indikator diperbarui')
            } else {
                const maxOrder = indikators.length > 0 ? Math.max(...indikators.map(i => i.order_index)) : 0
                const { error } = await supabase.from('master_indikator_tid').insert({ ...formData, order_index: maxOrder + 1 })
                if (error) throw error
                toast.success('Indikator ditambahkan')
            }
            setEditingId(null)
            setFormData({ label: '', ket_label: '', options: 'Ada,Tidak', order_index: 0, is_heading: false, input_type: 'radio', keterangan_type: 'none' })
            loadIndikators()
        } catch (err) {
            toast.error('Gagal menyimpan: ' + err.message)
        }
    }

    const handleEdit = (item) => {
        setEditingId(item.id)
        setFormData({ 
            label: item.label, 
            ket_label: item.ket_label || '', 
            options: item.options || 'Ada,Tidak', 
            order_index: item.order_index,
            is_heading: item.is_heading || false,
            input_type: item.input_type || 'radio',
            keterangan_type: item.keterangan_type || 'none'
        })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus indikator ini?')) return
        try {
            const { error } = await supabase.from('master_indikator_tid').delete().eq('id', id)
            if (error) throw error
            toast.success('Dihapus')
            loadIndikators()
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Master Indikator TID</h1>
                    <p className="text-sm text-gray-500">Kelola daftar pengecekan dinamis untuk Laporan TID</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="card space-y-4 sticky top-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Settings2 className="w-4 h-4 text-brand-600" />
                            <h3 className="font-bold text-gray-900">{editingId ? 'Edit Indikator' : 'Tambah Indikator'}</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="form-label text-[10px] uppercase font-black text-gray-400 tracking-widest">Label Indikator</label>
                                <input 
                                    value={formData.label}
                                    onChange={e => setFormData({...formData, label: e.target.value})}
                                    className="form-input" placeholder="Masukkan label..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label text-[10px] uppercase font-black text-gray-400 tracking-widest">Tipe Input</label>
                                    <select 
                                        value={formData.input_type}
                                        onChange={e => setFormData({...formData, input_type: e.target.value})}
                                        className="form-input text-xs"
                                    >
                                        <option value="radio">Radio Button</option>
                                        <option value="checkbox">Checkbox (Multi)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label text-[10px] uppercase font-black text-gray-400 tracking-widest">Tipe Ket.</label>
                                    <select 
                                        value={formData.keterangan_type}
                                        onChange={e => setFormData({...formData, keterangan_type: e.target.value})}
                                        className="form-input text-xs"
                                    >
                                        <option value="none">Tanpa Ket.</option>
                                        <option value="text">Teks Biasa</option>
                                        <option value="camera">Kamera (Tgl)</option>
                                        <option value="jumlah">Jumlah Unit</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label text-[10px] uppercase font-black text-gray-400 tracking-widest">Opsi Jawaban (pisahkan koma)</label>
                                <input 
                                    value={formData.options}
                                    onChange={e => setFormData({...formData, options: e.target.value})}
                                    className="form-input" placeholder="Ada,Tidak,Rusak"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox"
                                    checked={formData.is_heading}
                                    onChange={e => setFormData({...formData, is_heading: e.target.checked})}
                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                <span className="text-xs font-bold text-gray-600">Jadikan Header Bagian</span>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button onClick={handleSave} className="btn-primary flex-1">
                                <Save className="w-4 h-4" />
                                {editingId ? 'Simpan Perubahan' : 'Tambah Indikator'}
                            </button>
                            {editingId && (
                                <button onClick={() => { setEditingId(null); setFormData({ label: '', ket_label: '', options: 'Ada,Tidak', order_index: 0, is_heading: false, input_type: 'radio', keterangan_type: 'none' }) }} className="btn-secondary">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card p-0 overflow-hidden border-brand-100 shadow-xl shadow-brand-900/5">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-center w-16 text-[10px] tracking-widest uppercase">No</th>
                                    <th className="px-6 py-4 text-left text-[10px] tracking-widest uppercase">Indikator & Tipe</th>
                                    <th className="px-6 py-4 text-left text-[10px] tracking-widest uppercase">Opsi Jawaban</th>
                                    <th className="px-6 py-4 text-center text-[10px] tracking-widest uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {indikators.map((item, idx) => (
                                    <tr key={item.id} className={`${item.is_heading ? 'bg-brand-50/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                                        <td className="px-6 py-4 text-center font-black text-brand-600">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${item.is_heading ? 'text-brand-700 underline underline-offset-4' : 'text-gray-900'}`}>{item.label}</span>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase">{item.input_type}</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-bold uppercase">{item.keterangan_type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.options?.split(',').map(opt => (
                                                    <span key={opt} className="px-2 py-0.5 border border-gray-200 text-gray-500 rounded text-[10px] font-medium">{opt.trim()}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
