import * as XLSX from 'xlsx';
import { getSidakById } from './sidakService';
import { getTemuanById } from './temuanService';
import { getCPCReportById } from './cpcService';
import { getTIDReportById } from './tidService';
import toast from 'react-hot-toast';

export const exportReportToExcel = async (reportMeta) => {
    const toastId = toast.loading('Menyiapkan file Excel...');
    try {
        const type = reportMeta.tipe_laporan?.toUpperCase() || '';
        let data;
        let sheetName = 'Detail_Laporan';
        let detailData = [];
        let headers = [];

        if (type.includes('TEMUAN')) {
            data = await getTemuanById(reportMeta.id);
            headers = ['No', 'Indikator', 'Keterangan', 'Evaluasi / Tindak Lanjut'];
            detailData = (data.temuan_detail || []).map((d, i) => [
                i + 1,
                d.nama_indikator,
                d.keterangan || '-',
                d.evaluasi || '-'
            ]);
        } else if (type.includes('CPC')) {
            data = await getCPCReportById(reportMeta.id);
            headers = ['No', 'Item Penilaian', 'Kondisi', 'Keterangan'];
            detailData = (data.laporan_cpc_detail || []).map((d, i) => [
                i + 1,
                d.item_name,
                d.kondisi,
                d.keterangan || '-'
            ]);
        } else if (type.includes('TID')) {
            data = await getTIDReportById(reportMeta.id);
            headers = ['No', 'Item Penilaian', 'Kondisi', 'Keterangan'];
            detailData = (data.laporan_tid_detail || []).map((d, i) => [
                i + 1,
                d.item_name,
                d.kondisi,
                d.keterangan || '-'
            ]);
        } else {
            // SIDAK
            data = await getSidakById(reportMeta.id);
            headers = ['No', 'Sub Aspek', 'Kondisi', 'Unit', 'Keterangan'];
            detailData = (data.sidak_detail || []).map((d, i) => [
                i + 1,
                d.sub_aspek?.nama_sub_aspek || '-',
                d.kelengkapan,
                d.jumlah_unit || '-',
                d.keterangan || '-'
            ]);
        }

        // Create Header Info array (Vertical Key-Value pairs)
        const headerInfo = [
            ['INFORMASI LAPORAN', ''],
            ['Tipe Laporan', reportMeta.tipe_laporan],
            ['Regional Office', data.nama_ro || '-'],
            ['Kantor Layanan', data.nama_kl || data.nama_vendor || '-'],
            ['Tanggal Kunjungan', data.tanggal_kunjungan || '-'],
            ['Tim Kunjungan', data.tim_kunjungan || data.petugas_names || '-'],
            ['Vendor', data.vendor || data.vendor_pelaksana || '-'],
            [''],
            ['DETAIL HASIL LAPORAN'],
            headers,
            ...detailData
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(headerInfo);

        // Styling widths
        const wscols = [
            { wch: 25 }, // Col A
            { wch: 40 }, // Col B
            { wch: 30 }, // Col C
            { wch: 30 }, // Col D
            { wch: 30 }, // Col E
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        const fileName = `Laporan_${type}_${reportMeta.nama_kl}_${reportMeta.tanggal_kunjungan}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success('Berhasil mendownload Excel', { id: toastId });
    } catch (error) {
        console.error('Export Excel Error:', error);
        toast.error('Gagal mendownload Excel: ' + error.message, { id: toastId });
    }
};
