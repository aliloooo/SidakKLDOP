import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, GripVertical, Pencil, X } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MasterIndikatorCPC() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingItem, setEditingItem] = useState(null)
    const [newItem, setNewItem] = useState({ label: '', ket_label: '', options: 'Ada,Tidak', is_heading: false })

    useEffect(() => {
        loadItems()
    }, [])

    async function loadItems() {
        setLoading(true)
        const { data, error } = await supabase
            .from('master_indikator_cpc')
            .select('*')
            .order('order_index', { ascending: true })
        
        if (error) toast.error(error.message)
        else setItems(data)
        setLoading(false)
    }

    async function handleAdd() {
        if (!newItem.label) return toast.error('Label wajib diisi')
        
        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) + 1 : 1
        const { error } = await supabase
            .from('master_indikator_cpc')
            .insert({ ...newItem, order_index: nextOrder })

        if (error) toast.error(error.message)
        else {
            toast.success('Berhasil menambah indikator')
            setNewItem({ label: '', ket_label: '', options: 'Ada,Tidak', is_heading: false })
            loadItems()
        }
    }

    async function handleDelete(id) {
        if (!confirm('Hapus indikator ini?')) return
        const { error } = await supabase
            .from('master_indikator_cpc')
            .delete()
            .eq('id', id)

        if (error) toast.error(error.message)
        else {
            toast.success('Berhasil dihapus')
            loadItems()
        }
    }

    async function handleUpdate() {
        const { error } = await supabase
            .from('master_indikator_cpc')
            .update({ 
                label: editingItem.label, 
                ket_label: editingItem.ket_label,
                options: editingItem.options,
                is_heading: editingItem.is_heading
            })
            .eq('id', editingItem.id)

        if (error) toast.error(error.message)
        else {
            toast.success('Berhasil diperbarui')
            setEditingItem(null)
            loadItems()
        }
    }

    if (loading) return <div className="py-20"><LoadingSpinner /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Master Indikator CPC</h1>
                <p className="text-sm text-gray-500">Kelola poin pemeriksaan laporan CPC</p>
            </div>

            {/* Add New Section */}
            <div className="card space-y-4">
                <h3 className="text-sm font-bold text-brand-600 uppercase tracking-widest">Tambah Indikator Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                        placeholder="Nama Item (Misal: Jumlah CPC)" 
                        className="form-input text-sm"
                        value={newItem.label}
                        onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                    />
                    <input 
                        placeholder="Label Keterangan (Misal: Jumlah :)" 
                        className="form-input text-sm"
                        value={newItem.ket_label}
                        onChange={(e) => setNewItem({...newItem, ket_label: e.target.value})}
                    />
                    <div className="flex gap-2">
                        <input 
                            placeholder="Opsi (Pisah koma: Ada,Tidak)" 
                            className="form-input text-sm"
                            disabled={newItem.is_heading}
                            value={newItem.is_heading ? '' : newItem.options}
                            onChange={(e) => setNewItem({...newItem, options: e.target.value})}
                        />
                        <button onClick={handleAdd} className="btn-primary p-2 flex-shrink-0">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="is_heading"
                        checked={newItem.is_heading}
                        onChange={(e) => setNewItem({...newItem, is_heading: e.target.checked})}
                        className="w-4 h-4 text-brand-600 rounded border-gray-300"
                    />
                    <label htmlFor="is_heading" className="text-sm font-bold text-gray-600">Jadikan Baris Judul (Heading)</label>
                </div>
            </div>

            {/* List Table */}
            <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-4 py-3 text-left w-12">No.</th>
                            <th className="px-4 py-3 text-left">Label Indikator</th>
                            <th className="px-4 py-3 text-left">Ket. Label</th>
                            <th className="px-4 py-3 text-left">Pilihan</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-400 font-bold">{idx + 1}</td>
                                <td className="px-4 py-3">
                                    {editingItem?.id === item.id ? (
                                        <div className="flex flex-col gap-2">
                                            <input 
                                                className="form-input text-xs" 
                                                value={editingItem.label}
                                                onChange={(e) => setEditingItem({...editingItem, label: e.target.value})}
                                            />
                                            <label className="flex items-center gap-2 text-[10px]">
                                                <input 
                                                    type="checkbox"
                                                    checked={editingItem.is_heading}
                                                    onChange={(e) => setEditingItem({...editingItem, is_heading: e.target.checked})}
                                                />
                                                Jadikan Judul
                                            </label>
                                        </div>
                                    ) : (
                                        <span className={`font-medium ${item.is_heading ? 'text-brand-700 font-bold' : 'text-gray-900'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {editingItem?.id === item.id ? (
                                        <input 
                                            className="form-input text-xs" 
                                            value={editingItem.ket_label}
                                            onChange={(e) => setEditingItem({...editingItem, ket_label: e.target.value})}
                                        />
                                    ) : (
                                        <span className="text-gray-500 italic">{item.ket_label || '-'}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {editingItem?.id === item.id ? (
                                        <input 
                                            className="form-input text-xs" 
                                            value={editingItem.options}
                                            onChange={(e) => setEditingItem({...editingItem, options: e.target.value})}
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {item.options.split(',').map(opt => (
                                                <span key={opt} className="px-1.5 py-0.5 bg-gray-100 text-[10px] rounded border border-gray-200">{opt}</span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                        {editingItem?.id === item.id ? (
                                            <>
                                                <button onClick={handleUpdate} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingItem(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditingItem(item)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
