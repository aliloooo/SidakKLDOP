import { supabase } from './supabaseClient'
import { uploadSignature } from '../utils/storageHelper'

export async function createCPCReport({ identity, details }) {
    // 1. Upload Signatures
    const signatureFields = ['ttd_kepala_kl', 'ttd_ro', 'ttd_bo', 'ttd_dop'];
    const ttdUrls = {};

    for (const field of signatureFields) {
        let ttdUrl = identity[field];
        if (identity[field] && identity[field].startsWith('data:image')) {
            ttdUrl = await uploadSignature(identity[field], 'cpc');
        }
        ttdUrls[field] = ttdUrl;
    }

    // 2. Insert Header
    const { data: header, error: headerError } = await supabase
        .from('laporan_cpc_header')
        .insert({
            petugas_names: identity.petugas_names,
            nama_ro: identity.nama_ro,
            nama_vendor: identity.nama_vendor,
            alamat_cpc: identity.alamat_cpc,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tujuan_kunjungan: identity.tujuan_kunjungan,
            ttd_kepala_kl: ttdUrls.ttd_kepala_kl,
            ttd_ro: ttdUrls.ttd_ro,
            ttd_bo: ttdUrls.ttd_bo,
            ttd_dop: ttdUrls.ttd_dop,
            nama_kepala_kl: identity.nama_kepala_kl,
            nama_perusahaan: identity.nama_perusahaan,
            nama_ro_user: identity.nama_ro_user,
            nama_bo_user: identity.nama_bo_user,
            nama_dop_user: identity.nama_dop_user,
            vendor_pelaksana: identity.vendor_pelaksana,
            catatan_lain: identity.catatan_lain
        })
        .select()
        .single();

    if (headerError) throw headerError;

    // 3. Insert Details
    const detailsToInsert = details.map(d => ({
        cpc_id: header.id,
        item_name: d.item_name,
        kondisi: d.kondisi,
        keterangan: d.keterangan
    }));

    const { error: detailError } = await supabase
        .from('laporan_cpc_detail')
        .insert(detailsToInsert);

    if (detailError) throw detailError;

    return header;
}

export async function getCPCReports() {
    const { data, error } = await supabase
        .from('laporan_cpc_header')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getCPCReportById(id) {
    const { data, error } = await supabase
        .from('laporan_cpc_header')
        .select('*, laporan_cpc_detail(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCPCReport(id) {
    const { error } = await supabase
        .from('laporan_cpc_header')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

export async function updateCPCReport(id, { identity, details }) {
    // 1. Upload Signatures
    const signatureFields = ['ttd_kepala_kl', 'ttd_ro', 'ttd_bo', 'ttd_dop'];
    const ttdUrls = {};

    for (const field of signatureFields) {
        let ttdUrl = identity[field];
        if (identity[field] && identity[field].startsWith('data:image')) {
            ttdUrl = await uploadSignature(identity[field], 'cpc');
        }
        ttdUrls[field] = ttdUrl;
    }

    // 2. Update Header
    const { error: headerError } = await supabase
        .from('laporan_cpc_header')
        .update({
            petugas_names: identity.petugas_names,
            nama_ro: identity.nama_ro,
            nama_vendor: identity.nama_vendor,
            alamat_cpc: identity.alamat_cpc,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tujuan_kunjungan: identity.tujuan_kunjungan,
            ttd_kepala_kl: ttdUrls.ttd_kepala_kl,
            ttd_ro: ttdUrls.ttd_ro,
            ttd_bo: ttdUrls.ttd_bo,
            ttd_dop: ttdUrls.ttd_dop,
            nama_kepala_kl: identity.nama_kepala_kl,
            nama_perusahaan: identity.nama_perusahaan,
            nama_ro_user: identity.nama_ro_user,
            nama_bo_user: identity.nama_bo_user,
            nama_dop_user: identity.nama_dop_user,
            vendor_pelaksana: identity.vendor_pelaksana,
            catatan_lain: identity.catatan_lain
        })
        .eq('id', id);

    if (headerError) throw headerError;

    // 3. Update Details (Delete old, Insert new)
    const { error: deleteError } = await supabase
        .from('laporan_cpc_detail')
        .delete()
        .eq('cpc_id', id);

    if (deleteError) throw deleteError;

    const detailsToInsert = details.map(d => ({
        cpc_id: id,
        item_name: d.item_name,
        kondisi: d.kondisi,
        keterangan: d.keterangan
    }));

    const { error: detailError } = await supabase
        .from('laporan_cpc_detail')
        .insert(detailsToInsert);

    if (detailError) throw detailError;

    return true;
}
