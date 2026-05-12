import { supabase } from './supabaseClient'
import { uploadSignature } from '../utils/storageHelper'

export async function createTIDReport({ identity, details }) {
    // 1. Upload Signatures
    const signatureFields = ['ttd_kepala_kl', 'ttd_ro', 'ttd_dop'];
    const ttdUrls = {};

    for (const field of signatureFields) {
        let ttdUrl = identity[field];
        if (identity[field] && identity[field].startsWith('data:image')) {
            ttdUrl = await uploadSignature(identity[field], 'tid');
        }
        ttdUrls[field] = ttdUrl;
    }

    // 2. Insert Header
    const { data: header, error: headerError } = await supabase
        .from('laporan_tid_header')
        .insert({
            petugas_names: identity.petugas_names,
            nama_ro: identity.nama_ro,
            nama_vendor: identity.nama_vendor,
            alamat_tid: identity.alamat_tid,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tujuan_kunjungan: identity.tujuan_kunjungan,
            ttd_kepala_kl: ttdUrls.ttd_kepala_kl,
            ttd_ro: ttdUrls.ttd_ro,
            ttd_dop: ttdUrls.ttd_dop,
            nama_kepala_kl: identity.nama_kepala_kl,
            nama_perusahaan: identity.nama_perusahaan,
            nama_ro_user: identity.nama_ro_user,
            nama_dop_user: identity.nama_dop_user,
            vendor_pelaksana: identity.vendor_pelaksana,
            catatan_lain: identity.catatan_lain
        })
        .select()
        .single();

    if (headerError) throw headerError;

    // 3. Insert Details
    // Map details to include multi-condition if needed (stored as string/json)
    const detailsToInsert = details.map(d => ({
        tid_id: header.id,
        item_name: d.item_name,
        kondisi: Array.isArray(d.kondisi) ? d.kondisi.join(', ') : d.kondisi,
        keterangan: d.keterangan
    }));

    const { error: detailError } = await supabase
        .from('laporan_tid_detail')
        .insert(detailsToInsert);

    if (detailError) throw detailError;

    return header;
}

export async function getTIDReportById(id) {
    const { data, error } = await supabase
        .from('laporan_tid_header')
        .select('*, laporan_tid_detail(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}
