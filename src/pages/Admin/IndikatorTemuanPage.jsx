import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Target } from 'lucide-react'
import { getIndikator, addIndikator, updateIndikator, deleteIndikator } from '../../services/temuanService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function IndikatorTemuanPage() {
    const [indikatorList, setIndikatorList] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [namaIndikator, setNamaIndikator] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const data = await getIndikator()
            setIndikatorList(data)
        } catch (err) {
            toast.error('Gagal memuat indikator')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            if (editingId) {
                await updateIndikator(editingId, namaIndikator)
                toast.success('Indikator berhasil diperbarui')
            } else {
                await addIndikator(namaIndikator)
                toast.success('Indikator berhasil ditambahkan')
            }
            closeModal()
            loadData()
        } catch (err) {
            toast.error(err.message)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Yakin ingin menghapus indikator ini?')) return
        try {
            await deleteIndikator(id)
            toast.success('Indikator berhasil dihapus')
            loadData()
        } catch (err) {
            toast.error('Gagal menghapus indikator')
        }
    }

    function openModal(indikator = null) {
        if (indikator) {
            setEditingId(indikator.id)
            setNamaIndikator(indikator.nama_indikator)
        } else {
            setEditingId(null)
            setNamaIndikator('')
        }
        setIsModalOpen(true)
    }

    function closeModal() {
        setIsModalOpen(false)
        setEditingId(null)
        setNamaIndikator('')
    }

    const filteredList = indikatorList.filter(i => 
        i.nama_indikator.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Master Indikator Temuan</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola indikator untuk pengisian form temuan kunjungan</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Tambah Indikator
                </button>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari indikator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="table-th w-16 text-center">No</th>
                                <th className="table-th text-left">Nama Indikator</th>
                                <th className="table-th w-32 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="table-td text-center py-8 text-gray-500">
                                        Belum ada indikator yang ditambahkan
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((indikator, index) => (
                                    <tr key={indikator.id} className="hover:bg-gray-50">
                                        <td className="table-td text-center text-gray-500">{index + 1}</td>
                                        <td className="table-td font-medium text-gray-900">{indikator.nama_indikator}</td>
                                        <td className="table-td">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openModal(indikator)}
                                                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(indikator.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                                <Target className="w-4 h-4 text-brand-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingId ? 'Edit Indikator' : 'Tambah Indikator Baru'}
                            </h2>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="form-label mb-1.5">Nama Indikator</label>
                                    <input
                                        type="text"
                                        required
                                        value={namaIndikator}
                                        onChange={(e) => setNamaIndikator(e.target.value)}
                                        className="form-input"
                                        placeholder="Contoh: Pengecekan Part ATM"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="btn-secondary">
                                    Batal
                                </button>
                                <button type="submit" className="btn-primary">
                                    Simpan Indikator
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
