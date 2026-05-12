import { useEffect, useState, useRef } from 'react'
import { Trash2, Eye, FileText, AlertTriangle, Calendar, Building2, User, Search, Pencil, FileDown, TrendingUp, BarChart3, ChevronDown, ChevronUp, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { getSidakList, deleteSidak, getAdminStats } from '../../services/sidakService'
import { getAspek } from '../../services/aspekService'
import { TARGET_DATA } from '../../constants/targetData'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import { generatePDF } from '../../utils/pdfGenerator'
import DigitalStamp from '../../components/DigitalStamp'
import toast from 'react-hot-toast'

export default function ResultsPage() {
    const [sidakList, setSidakList] = useState([])
    const [aspekList, setAspekList] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewItem, setViewItem] = useState(null)
    const [deleteItem, setDeleteItem] = useState(null)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [filterRoTarget, setFilterRoTarget] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [statsData, setStatsData] = useState([]) // Headers for stats calculation
    const [showTargetProgress, setShowTargetProgress] = useState(false)
    const tableRef = useRef(null)
    const ITEMS_PER_PAGE = 10

    useEffect(() => { 
        loadTableData()
    }, [currentPage, searchQuery, statusFilter, filterRoTarget])

    useEffect(() => {
        loadStatsAndAspek()
    }, [])

    async function loadStatsAndAspek() {
        try {
            // Fetch headers only (no details) for stats calculation
            const [resData, aspek] = await Promise.all([
                getAdminStats(), 
                getAspek()
            ])
            setStatsData(resData)
            setAspekList(aspek)
        } catch (err) {
            console.error('Stats load error:', err)
        }
    }

    async function loadTableData() {
        setLoading(true)
        try {
            const { data, count } = await getSidakList({
                page: currentPage,
                pageSize: ITEMS_PER_PAGE,
                searchQuery,
                statusFilter,
                roFilter: filterRoTarget,
                includeDetails: false
            })
            setSidakList(data)
            setTotalCount(count)
        } catch (err) {
            toast.error('Gagal memuat data tabel: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleView(item) {
        setLoading(true)
        try {
            const { getSidakById } = await import('../../services/sidakService')
            const fullItem = await getSidakById(item.id)
            setViewItem(fullItem)
            setViewModalOpen(true)
        } catch (err) {
            toast.error('Gagal memuat detail: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteSidak(deleteItem.id)
            toast.success('Data SIDAK berhasil dihapus')
            setDeleteModalOpen(false)
            loadTableData()
            loadStatsAndAspek() // Refresh stats as well
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleRoCardClick = (roName) => {
        setFilterRoTarget(filterRoTarget === roName ? '' : roName);
        // If we are selecting a new RO, scroll to the table
        if (filterRoTarget !== roName) {
            setTimeout(() => {
                tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    function getNilaiAspek(sidak, aspek_id) {
        if (!sidak.sidak_detail) return 0
        return sidak.sidak_detail
            .filter((d) => d.aspek_id === aspek_id)
            .reduce((s, d) => s + Number(d.nilai), 0)
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const paginatedList = sidakList

    // Target Calculation Logic (using statsData)
    const sidakSet = new Set(statsData.map(s => {
        const normalizedRO = s.nama_ro.includes('/') ? s.nama_ro.split('/')[1].trim() : s.nama_ro.trim();
        return `${normalizedRO.toLowerCase()}|${s.nama_kl.trim().toLowerCase()}`;
    }));

    const roProgressData = Object.entries(TARGET_DATA).map(([roName, categories]) => {
        const allKLs = Object.values(categories).flat();
        const completed = allKLs.filter(kl => sidakSet.has(`${roName.toLowerCase()}|${kl.toLowerCase()}`));

        // Calculate average score for this RO (Target KLs Only)
        const targetKLsForRO = new Set(allKLs.map(kl => kl.toLowerCase()));
        const roTargetSidaks = statsData.filter(s => {
            const normalizedSidakRO = s.nama_ro.includes('/') ? s.nama_ro.split('/')[1].trim() : s.nama_ro.trim();
            return normalizedSidakRO.toLowerCase() === roName.toLowerCase() &&
                targetKLsForRO.has(s.nama_kl.trim().toLowerCase());
        });
        
        let sumNilai = 0;
        let sumCount = 0;
        roTargetSidaks.forEach(s => {
            sumNilai += Number(s.rata_rata_nilai) * Number(s.jumlah_laporan);
            sumCount += Number(s.jumlah_laporan);
        });
        const roAvgScore = sumCount > 0 ? (sumNilai / sumCount).toFixed(2) : "0.00";

        return {
            name: roName,
            total: allKLs.length,
            completedCount: completed.length,
            completedKLs: completed,
            remainingKLs: allKLs.filter(kl => !sidakSet.has(`${roName.toLowerCase()}|${kl.toLowerCase()}`)),
            avgScore: roAvgScore
        };
    }).filter(ro => ro.total > 0);

    const totalTargetCount = roProgressData.reduce((sum, ro) => sum + ro.total, 0);
    const totalReachedCount = roProgressData.reduce((sum, ro) => sum + ro.completedCount, 0);
    const overallProgressPercent = totalTargetCount > 0 ? ((totalReachedCount / totalTargetCount) * 100).toFixed(1) : 0;

    let overallSumCount = 0;
    let overallSumNilai = 0;
    let overallComplyCount = 0;
    statsData.forEach(s => {
        overallSumCount += Number(s.jumlah_laporan);
        overallSumNilai += Number(s.rata_rata_nilai) * Number(s.jumlah_laporan);
        overallComplyCount += Number(s.comply_count);
    });

    const avgScore = overallSumCount > 0 ? (overallSumNilai / overallSumCount).toFixed(2) : 0;
    const complyRate = overallSumCount > 0 ? ((overallComplyCount / overallSumCount) * 100).toFixed(1) : 0;

    async function exportAllDetailsToExcel() {
        setLoading(true)
        try {
            // Fetch everything only when button is clicked
            const { data } = await getSidakList({ includeDetails: true })
            const fullList = data;

            // 1. Prepare Summary Sheet Data
            const summaryData = fullList.map((sidak, index) => ({
                'No': index + 1,
                'Regional Office': sidak.nama_ro,
                'Kantor Layanan': sidak.nama_kl,
                'Tanggal Kunjungan': new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID'),
                'Tim Kunjungan': sidak.tim_kunjungan || '-',
                'Total Nilai': Number(sidak.total_nilai).toFixed(2),
                'Status': sidak.status
            }))

            // 2. Prepare Detail Sheet Data (Existing logic)
            const allDetails = []
            sidakList.forEach(sidak => {
                const headerInfo = {
                    'Regional Office': sidak.nama_ro,
                    'Kantor Layanan': sidak.nama_kl,
                    'Tanggal': new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID'),
                    'Tim Kunjungan': sidak.tim_kunjungan || '-',
                    'Status': sidak.status,
                    'Total Nilai': Number(sidak.total_nilai).toFixed(2)
                }

                if (sidak.sidak_detail && sidak.sidak_detail.length > 0) {
                    sidak.sidak_detail.forEach(detail => {
                        const aspek = aspekList.find(a => a.id === detail.aspek_id)
                        allDetails.push({
                            ...headerInfo,
                            'Aspek': aspek?.nama_aspek || detail.aspek_id,
                            'Sub Aspek': detail.sub_aspek?.nama_sub_aspek || detail.sub_aspek_id,
                            'Kelengkapan': detail.kelengkapan,
                            'Unit': detail.jumlah_unit || '-',
                            'Keterangan': detail.keterangan || '-',
                            'Nilai': Number(detail.nilai).toFixed(2)
                        })
                    })
                }
            })

            const workbook = XLSX.utils.book_new()
            
            // Add Summary Sheet first
            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Ringkasan Laporan')
            
            // Add Detail Sheet
            const detailWorksheet = XLSX.utils.json_to_sheet(allDetails)
            XLSX.utils.book_append_sheet(workbook, detailWorksheet, 'Detail Penilaian')
            
            XLSX.writeFile(workbook, 'Laporan_Sidak_Lengkap.xlsx')
            toast.success('Seluruh data berhasil diekspor (2 Sheet)!')
        } catch (error) {
            toast.error('Gagal mengekspor data: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    async function exportSingleSidakToExcel(sidak) {
        setLoading(true)
        try {
            const { getSidakById } = await import('../../services/sidakService')
            const fullSidak = await getSidakById(sidak.id)
            
            const details = fullSidak.sidak_detail.map(detail => {
                const aspek = aspekList.find(a => a.id === detail.aspek_id);
                return {
                    'Regional Office': sidak.nama_ro,
                    'Kantor Layanan': sidak.nama_kl,
                    'Tanggal': new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID'),
                    'Tim Kunjungan': sidak.tim_kunjungan || '-',
                    'Aspek': aspek?.nama_aspek || detail.aspek_id,
                    'Sub Aspek': detail.sub_aspek?.nama_sub_aspek || detail.sub_aspek_id,
                    'Kelengkapan': detail.kelengkapan,
                    'Unit': detail.jumlah_unit || '-',
                    'Keterangan': detail.keterangan || '-',
                    'Nilai': Number(detail.nilai).toFixed(2),
                    'Total Nilai Laporan': Number(sidak.total_nilai).toFixed(2),
                    'Status Laporan': sidak.status
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(details);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail SIDAK');
            const filename = `Laporan_SIDAK_${sidak.nama_kl}_${sidak.tanggal_kunjungan}.xlsx`;
            XLSX.writeFile(workbook, filename);
            toast.success(`Laporan ${sidak.nama_kl} berhasil diekspor!`);
        } catch (error) {
            toast.error('Gagal mengekspor data: ' + error.message);
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Hasil SIDAK</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Pantau dan kelola semua laporan SIDAK yang telah diinput</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Laporan</p>
                            <p className="text-2xl font-bold text-gray-900">{overallSumCount}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compliance Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{complyRate}%</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Progress</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-2xl font-bold text-gray-900">{overallProgressPercent}%</p>
                                <p className="text-[10px] text-gray-400">({totalReachedCount}/{totalTargetCount})</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Target Progress Detailed Section */}
            <div className="card overflow-hidden">
                <button
                    onClick={() => setShowTargetProgress(!showTargetProgress)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-gray-900">Monitoring Target SIDAK</h3>
                            <p className="text-xs text-gray-500">Progress pengisian berdasarkan Regional Office dan Kantor Layanan</p>
                        </div>
                    </div>
                    {showTargetProgress ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {showTargetProgress && (
                    <div className="px-6 pb-6 pt-2 space-y-6 border-t border-gray-100 bg-gray-50/30">
                        {/* Overall Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Completion</span>
                                <span className="text-sm font-bold text-brand-600">{overallProgressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-brand-600 h-full transition-all duration-1000 ease-out"
                                    style={{ width: `${overallProgressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Search in Progress Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roProgressData.map((ro) => (
                                <div 
                                    key={ro.name} 
                                    onClick={() => handleRoCardClick(ro.name)}
                                    className={`p-3 bg-white rounded-xl shadow-sm transition-all cursor-pointer ${
                                        filterRoTarget === ro.name 
                                            ? 'ring-2 ring-brand-500 border-brand-500 shadow-md' 
                                            : 'border border-gray-100 hover:shadow-md hover:border-brand-200'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{ro.name}</h4>
                                            <p className="text-[10px] text-brand-600 font-bold">Avg: {ro.avgScore}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ro.completedCount === ro.total ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-700'}`}>
                                            {ro.completedCount}/{ro.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${ro.completedCount === ro.total ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                            style={{ width: `${(ro.completedCount / ro.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Status KL Target:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.values(TARGET_DATA[ro.name]).flat().map(kl => {
                                                const isCompleted = ro.completedKLs.includes(kl);
                                                return (
                                                    <span
                                                        key={kl}
                                                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${isCompleted
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                                                            : 'bg-gray-50 text-gray-400 border-gray-100'
                                                            }`}
                                                        title={isCompleted ? 'Sudah Terisi' : 'Belum Terisi'}
                                                    >
                                                        {kl}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div ref={tableRef} className="card p-0 overflow-hidden" style={{ scrollMarginTop: '24px' }}>
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-gray-900">Laporan Masuk</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        {sidakList.length > 0 && (
                            <button
                                onClick={exportAllDetailsToExcel}
                                className="btn-secondary text-xs py-1.5 w-full sm:w-auto justify-center"
                                title="Download semua rincian penilaian dari semua laporan"
                            >
                                <FileDown className="w-4 h-4" />
                                Export Detail Semua
                            </button>
                        )}
                        <span className="text-xs text-gray-400">{totalCount} total laporan</span>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                {sidakList.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari RO atau Kantor Layanan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="md:w-48">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                >
                                    <option value="All">Semua Status</option>
                                    <option value="Comply">Comply</option>
                                    <option value="Not Comply">Not Comply</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {sidakList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada laporan SIDAK</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th w-10">No</th>
                                    <th className="table-th min-w-[200px]">RO / KL</th>
                                    <th className="table-th hidden sm:table-cell">Tanggal</th>
                                    <th className="table-th text-center">Total Nilai</th>
                                    <th className="table-th">Status</th>
                                    <th className="table-th text-center">Aksi</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sidakList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="table-td text-center py-10 text-gray-500 italic">
                                            Tidak ada hasil yang sesuai dengan kriteria
                                        </td>
                                    </tr>
                                ) : (
                                    sidakList.map((s, idx) => {
                                        const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                        return (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="table-td text-gray-400 w-10">{actualIndex}</td>
                                                <td className="table-td">
                                                    <div className="font-semibold text-gray-900">{s.nama_ro}</div>
                                                    <div className="text-xs text-gray-500">{s.nama_kl}</div>
                                                </td>
                                                <td className="table-td hidden sm:table-cell whitespace-nowrap">
                                                    {new Date(s.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </td>

                                                <td className="table-td text-center font-bold text-gray-900">
                                                    {Number(s.total_nilai).toFixed(2)}
                                                </td>
                                                <td className="table-td">
                                                    {s.status === 'Comply' ? (
                                                        <span className="badge-comply">✓ Comply</span>
                                                    ) : (
                                                        <span className="badge-not-comply">✗ Not Comply</span>
                                                    )}
                                                </td>
                                                <td className="table-td text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleView(s)}
                                                            className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => exportSingleSidakToExcel(s)}
                                                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                            title="Download Excel"
                                                        >
                                                            <FileDown className="w-4 h-4" />
                                                        </button>
                                                        <Link
                                                            to={`/admin/results/edit/${s.id}`}
                                                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                                            title="Edit Laporan"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => { setDeleteItem(s); setDeleteModalOpen(true); }}
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                        <p className="text-xs text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}</span> sampai <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> dari <span className="font-semibold text-gray-900">{totalCount}</span> laporan
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sebelumnya
                            </button>
                            <div className="flex items-center gap-1 mx-2">
                                <span className="text-xs font-medium text-gray-900">{currentPage}</span>
                                <span className="text-xs text-gray-400">/</span>
                                <span className="text-xs text-gray-500">{totalPages || 1}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Detail Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Detail Hasil SIDAK"
                size="xl"
            >
                {viewItem && (
                    <div id="report-content-sidak" className="space-y-6 bg-white p-2 relative">
                        {/* Digital Stamp (Top Right) */}
                        <div className="absolute top-0 right-0 z-20">
                            <DigitalStamp 
                                vendor={viewItem.nama_kl} 
                                date={viewItem.tanggal_kunjungan} 
                                reportId={viewItem.id?.substring(0, 8)} 
                            />
                        </div>

                        {/* Brand Header for PDF */}
                        <div className="pdf-only border-b-2 border-brand-600 pb-4 mb-6 flex items-center justify-between" style={{ display: 'none' }}>
                            <div>
                                <h1 className="text-xl font-black text-brand-700 uppercase tracking-tighter">SIDAK DOP</h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Laporan Hasil Checklist SIDAK KL</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400">Dihasilkan pada: {new Date().toLocaleDateString('id-ID')}</p>
                            </div>
                        </div>

                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Regional Office</p>
                                    <p className="text-sm font-semibold text-gray-700">{viewItem.nama_ro}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Kantor Layanan</p>
                                    <p className="text-sm font-semibold text-gray-700">{viewItem.nama_kl}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tanggal Kunjungan</p>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {new Date(viewItem.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                            day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tim Kunjungan</p>
                                    <p className="text-sm font-semibold text-gray-700">{viewItem.tim_kunjungan || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Score */}
                        <div className={`p-4 rounded-xl flex items-center justify-between ${viewItem.status === 'Comply' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Nilai Akhir</p>
                                <p className={`text-3xl font-bold ${viewItem.status === 'Comply' ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {Number(viewItem.total_nilai).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-left sm:text-right mt-3 sm:mt-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                                <span className={viewItem.status === 'Comply' ? 'badge-comply' : 'badge-not-comply'}>
                                    {viewItem.status === 'Comply' ? '✓ Comply' : '✗ Not Comply'}
                                </span>
                                <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:justify-end">
                                    <button
                                        onClick={() => exportSingleSidakToExcel(viewItem)}
                                        className="text-xs flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded"
                                    >
                                        <FileDown className="w-3.5 h-3.5" />
                                        Excel
                                    </button>
                                    <button
                                        onClick={() => generatePDF('report-content-sidak', `Sidak_${viewItem.nama_kl}_${viewItem.tanggal_kunjungan}.pdf`)}
                                        className="text-xs flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold bg-brand-50 px-2 py-1 rounded"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Aspek Breakdown */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 border-b pb-2">Rincian Per Aspek</h4>
                            {aspekList.map(aspek => (
                                <div key={aspek.id} className="border rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b">
                                        <span className="font-semibold text-gray-700">{aspek.nama_aspek}</span>
                                        <span className="text-brand-600 font-bold">{getNilaiAspek(viewItem, aspek.id).toFixed(2)}</span>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-white">
                                                    <th className="px-4 py-2 text-left text-gray-400">Sub Aspek</th>
                                                    <th className="px-4 py-2 text-center text-gray-400">Kelengkapan</th>
                                                    <th className="px-4 py-2 text-center text-gray-400">Unit</th>
                                                    <th className="px-4 py-2 text-center text-gray-400">Nilai</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {viewItem.sidak_detail
                                                    ?.filter(d => d.aspek_id === aspek.id)
                                                    .map(detail => (
                                                        <tr key={detail.id}>
                                                            <td className="px-4 py-2 text-gray-600">{detail.sub_aspek?.nama_sub_aspek || detail.sub_aspek_id}</td>
                                                            <td className="px-4 py-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full ${detail.kelengkapan === 'Sesuai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {detail.kelengkapan}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-center text-gray-500">{detail.jumlah_unit || '-'}</td>
                                                            <td className="px-4 py-2 text-center font-bold text-gray-700">{Number(detail.nilai).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Signature Info */}
                        {viewItem.ttd_kepala_kl && (
                            <div className="mt-6 pt-6 border-t flex flex-col items-end">
                                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-widest text-center">Mengetahui,<br/>Kepala Kantor Layanan</p>
                                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 mb-2 w-48 h-24 flex items-center justify-center overflow-hidden">
                                    <img src={viewItem.ttd_kepala_kl} alt="Tanda Tangan" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                </div>
                                <p className="text-sm font-bold text-gray-900 border-b border-gray-400 min-w-[120px] text-center pb-1">{viewItem.nama_kl}</p>
                            </div>
                        )}

                        {/* Digital Stamp removed from bottom */}
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Laporan SIDAK"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-sm">Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus selamanya.</p>
                    </div>
                    <p className="text-sm text-gray-600">
                        Yakin ingin menghapus laporan SIDAK untuk <strong>{deleteItem?.nama_kl}</strong> ({deleteItem?.nama_ro})?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">Batal</button>
                        <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                            {deleting ? 'Menghapus...' : 'Hapus Laporan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
