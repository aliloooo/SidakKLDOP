import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import {
    getAspek,
    getSubAspek,
    createSubAspek,
    updateSubAspek,
    deleteSubAspek,
} from '../../services/aspekService'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function SubAspekPage() {
    const [aspekList, setAspekList] = useState([])
    const [subAspekList, setSubAspekList] = useState([])
    const [filterAspek, setFilterAspek] = useState('all')
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [deleteItem, setDeleteItem] = useState(null)
    const [form, setForm] = useState({ aspek_id: '', nama_sub_aspek: '', bobot_sub_aspek: '', is_unit_required: false })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [aspek, sub] = await Promise.all([getAspek(), getSubAspek()])
            setAspekList(aspek)
            setSubAspekList(sub)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const filtered = filterAspek === 'all'
        ? subAspekList
        : subAspekList.filter((sa) => sa.aspek_id === filterAspek)

    function openAdd() {
        setEditItem(null)
        setForm({ aspek_id: aspekList[0]?.id || '', nama_sub_aspek: '', bobot_sub_aspek: '', is_unit_required: false })
        setModalOpen(true)
    }

    function openEdit(item) {
        setEditItem(item)
        setForm({
            aspek_id: item.aspek_id,
            nama_sub_aspek: item.nama_sub_aspek,
            bobot_sub_aspek: item.bobot_sub_aspek,
            is_unit_required: !!item.is_unit_required
        })
        setModalOpen(true)
    }

    // Validate: sum of sub_aspek bobot for selected aspek should not exceed aspek's bobot
    function validateBobot() {
        const aspek = aspekList.find((a) => a.id === form.aspek_id)
        if (!aspek) return true
        const otherSum = subAspekList
            .filter((sa) => sa.aspek_id === form.aspek_id && sa.id !== editItem?.id)
            .reduce((s, sa) => s + Number(sa.bobot_sub_aspek), 0)
        const newTotal = otherSum + Number(form.bobot_sub_aspek)
        if (newTotal > Number(aspek.bobot_aspek)) {
            toast.error(`Total bobot sub aspek (${newTotal}%) melebihi bobot aspek (${aspek.bobot_aspek}%)`)
            return false
        }
        return true
    }

    async function handleSave(e) {
        e.preventDefault()
        if (!form.nama_sub_aspek.trim()) return toast.error('Nama sub aspek wajib diisi')
        if (!form.bobot_sub_aspek || isNaN(form.bobot_sub_aspek)) return toast.error('Bobot harus berupa angka')

        // Decimal validation (max 2 decimal places)
        const bobotStr = form.bobot_sub_aspek.toString()
        if (bobotStr.includes('.') && bobotStr.split('.')[1].length > 2) {
            return toast.error('Bobot maksimal 2 angka di belakang koma')
        }

        if (!validateBobot()) return
        setSaving(true)
        try {
            const payload = {
                aspek_id: form.aspek_id,
                nama_sub_aspek: form.nama_sub_aspek,
                bobot_sub_aspek: Number(form.bobot_sub_aspek),
                is_unit_required: form.is_unit_required
            }
            if (editItem) {
                await updateSubAspek(editItem.id, payload)
                toast.success('Sub aspek diperbarui!')
            } else {
                await createSubAspek(payload)
                toast.success('Sub aspek ditambahkan!')
            }
            setModalOpen(false)
            loadData()
        } catch (err) {
            toast.error('Gagal menyimpan: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        setSaving(true)
        try {
            await deleteSubAspek(deleteItem.id)
            toast.success('Sub aspek dihapus!')
            setDeleteModalOpen(false)
            loadData()
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Sub Aspek</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola sub aspek penilaian untuk setiap aspek</p>
                </div>
                <button onClick={openAdd} disabled={aspekList.length === 0} className="btn-primary w-full sm:w-auto justify-center">
                    <Plus className="w-4 h-4" /> Tambah Sub Aspek
                </button>
            </div>


            {aspekList.length === 0 && !loading && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700">Silakan tambahkan aspek terlebih dahulu sebelum menambahkan sub aspek.</p>
                </div>
            )}

            {/* Bobot summary per aspek */}
            {aspekList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {aspekList.map((a) => {
                        const sum = subAspekList
                            .filter((sa) => sa.aspek_id === a.id)
                            .reduce((s, sa) => s + Number(sa.bobot_sub_aspek), 0)
                        const over = sum > Number(a.bobot_aspek)
                        return (
                            <div 
                                key={a.id} 
                                onClick={() => setFilterAspek(filterAspek === a.id ? 'all' : a.id)}
                                className={`rounded-xl border p-3 text-sm cursor-pointer transition-all ${
                                    filterAspek === a.id
                                        ? over 
                                            ? 'ring-2 ring-red-500 border-red-500 bg-red-50' 
                                            : 'ring-2 ring-brand-500 border-brand-500 bg-brand-50'
                                        : over 
                                            ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <p className={`font-medium truncate ${
                                    filterAspek === a.id 
                                        ? over ? 'text-red-800' : 'text-brand-800' 
                                        : 'text-gray-700'
                                }`}>
                                    {a.nama_aspek}
                                </p>
                                <p className={`text-xs mt-1 ${
                                    over 
                                        ? filterAspek === a.id ? 'text-red-700 font-medium' : 'text-red-600' 
                                        : filterAspek === a.id ? 'text-brand-600 font-medium' : 'text-gray-500'
                                }`}>
                                    {sum.toFixed(2)} / {Number(a.bobot_aspek).toFixed(2)}%
                                </p>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filter Aspek:</label>
                <select
                    value={filterAspek}
                    onChange={(e) => setFilterAspek(e.target.value)}
                    className="form-input w-auto"
                >
                    <option value="all">Semua</option>
                    {aspekList.map((a) => (
                        <option key={a.id} value={a.id}>{a.nama_aspek}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-gray-400">Belum ada sub aspek ditemukan.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th w-10 hidden sm:table-cell">No</th>
                                    <th className="table-th min-w-[120px]">Aspek</th>
                                    <th className="table-th min-w-[150px]">Nama Sub Aspek</th>
                                    <th className="table-th w-24 text-center">Bobot</th>
                                    <th className="table-th w-24 text-center">Unit Wajib</th>
                                    <th className="table-th w-32 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((sa, idx) => (
                                    <tr key={sa.id} className="hover:bg-gray-50">
                                        <td className="table-td text-gray-400 w-10 hidden sm:table-cell">{idx + 1}</td>

                                        <td className="table-td">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
                                                {sa.aspek?.nama_aspek || '-'}
                                            </span>
                                        </td>
                                        <td className="table-td font-medium text-gray-900">{sa.nama_sub_aspek}</td>
                                        <td className="table-td text-center text-gray-600">{Number(sa.bobot_sub_aspek).toFixed(2)}%</td>
                                        <td className="table-td text-center">
                                            {sa.is_unit_required ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">Wajib</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="table-td text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(sa)} className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setDeleteItem(sa); setDeleteModalOpen(true) }} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Add/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Sub Aspek' : 'Tambah Sub Aspek'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="form-label">Aspek <span className="text-red-500">*</span></label>
                        <select
                            className="form-input"
                            value={form.aspek_id}
                            onChange={(e) => setForm({ ...form, aspek_id: e.target.value })}
                        >
                            {aspekList.map((a) => (
                                <option key={a.id} value={a.id}>{a.nama_aspek} ({a.bobot_aspek}%)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Nama Sub Aspek <span className="text-red-500">*</span></label>
                        <input
                            className="form-input"
                            value={form.nama_sub_aspek}
                            onChange={(e) => setForm({ ...form, nama_sub_aspek: e.target.value })}
                            placeholder="Contoh: Keramahan Petugas"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Bobot Sub Aspek (%) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="form-input"
                                value={form.bobot_sub_aspek}
                                onChange={(e) => setForm({ ...form, bobot_sub_aspek: e.target.value })}
                                placeholder="Contoh: 10.55"
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-all select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                    checked={form.is_unit_required}
                                    onChange={(e) => setForm({ ...form, is_unit_required: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Unit Wajib Diisi</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Sub Aspek" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Yakin ingin menghapus sub aspek <strong>"{deleteItem?.nama_sub_aspek}"</strong>?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">Batal</button>
                        <button onClick={handleDelete} disabled={saving} className="btn-danger">
                            {saving ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
