import { supabase } from './supabaseClient'
import { calcTotalNilai, determineStatus } from '../utils/calculateScore'
import { uploadSignature } from '../utils/storageHelper'

// ── SIDAK Header ─────────────────────────────────────────────
export async function getSidakList({ 
    page = null, 
    pageSize = 10, 
    searchQuery = '', 
    roFilter = '',
    statusFilter = '',
    includeDetails = false,
    columns = null
} = {}) {
    let selectQuery = columns;
    if (!selectQuery) {
        selectQuery = includeDetails 
            ? `*, sidak_detail (*, sub_aspek (nama_sub_aspek))` 
            : `id, nama_ro, nama_kl, tanggal_kunjungan, tim_kunjungan, ttd_kepala_kl, total_nilai, status`;
    }

    let query = supabase
        .from('sidak_header')
        .select(selectQuery, { count: 'exact' })


    if (searchQuery) {
        query = query.or(`nama_ro.ilike.%${searchQuery}%,nama_kl.ilike.%${searchQuery}%`)
    }

    if (roFilter) {
        query = query.eq('nama_ro', roFilter)
    }

    if (statusFilter && statusFilter !== 'All') {
        query = query.eq('status', statusFilter)
    }

    query = query.order('created_at', { ascending: false })

    if (page !== null) {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)
    }

    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
}

export async function getCombinedReports({ 
    page = 1, 
    pageSize = 10, 
    searchQuery = '', 
    roFilter = ''
} = {}) {
    let query = supabase
        .from('v_all_reports')
        .select('*', { count: 'exact' })

    if (searchQuery) {
        query = query.or(`nama_ro.ilike.%${searchQuery}%,nama_kl.ilike.%${searchQuery}%`)
    }

    if (roFilter) {
        query = query.eq('nama_ro', roFilter)
    }

    query = query.order('created_at', { ascending: false })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
}


export async function getSidakById(id) {
    const { data, error } = await supabase
        .from('sidak_header')
        .select(`
            *,
            sidak_detail (
                *,
                sub_aspek (nama_sub_aspek)
            )
        `)
        .eq('id', id)
        .single()
    if (error) throw error
    return data
}

export async function updateSidak(id, { identity, details }) {
    // 1. Calculate new totals
    const total_nilai = calcTotalNilai(details)
    const status = determineStatus(total_nilai)

    // Process Signature (Move to storage if it's base64)
    const ttd_kepala_kl = await uploadSignature(identity.ttd_kepala_kl, 'sidak')

    // 2. Update header
    const { data: updatedHeader, error: headerError } = await supabase
        .from('sidak_header')
        .update({
            nama_ro: identity.nama_ro,
            nama_kl: identity.nama_kl,
            vendor: identity.vendor,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tim_kunjungan: identity.tim_kunjungan,
            ttd_kepala_kl: ttd_kepala_kl,
            total_nilai,
            status,
        })
        .eq('id', id)
        .select()

    if (headerError) throw headerError
    const header = updatedHeader && updatedHeader.length > 0 ? updatedHeader[0] : null
    if (!header) throw new Error('Data tidak ditemukan atau gagal diperbarui')

    // 3. Delete old details
    const { error: deleteError } = await supabase
        .from('sidak_detail')
        .delete()
        .eq('sidak_id', id)
    if (deleteError) throw deleteError

    // 4. Insert new details
    const detailRows = details.map((d) => ({
        sidak_id: id,
        aspek_id: d.aspek_id,
        sub_aspek_id: d.sub_aspek_id,
        jumlah_unit: d.jumlah_unit || 0,
        kelengkapan: d.kelengkapan,
        keterangan: d.keterangan || '',
        nilai: d.nilai,
    }))

    const { error: insertError } = await supabase
        .from('sidak_detail')
        .insert(detailRows)
    if (insertError) throw insertError

    return { ...header, sidak_detail: detailRows }
}

// ── Create full SIDAK (header + detail) ─────────────────────
export async function createSidak({ identity, details }) {
    // 1. Calculate totals
    const total_nilai = calcTotalNilai(details)
    const status = determineStatus(total_nilai)

    // Process Signature (Move to storage)
    const ttd_url = await uploadSignature(identity.ttd_kepala_kl, 'sidak')

    // 2. Insert header
    const { data: header, error: headerError } = await supabase
        .from('sidak_header')
        .insert([{
            nama_ro: identity.nama_ro,
            nama_kl: identity.nama_kl,
            vendor: identity.vendor,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tim_kunjungan: identity.tim_kunjungan,
            ttd_kepala_kl: ttd_url,
            total_nilai,
            status,
        }])
        .select()
        .single()
    if (headerError) throw headerError

    // 3. Insert detail rows
    const detailRows = details.map((d) => ({
        sidak_id: header.id,
        aspek_id: d.aspek_id,
        sub_aspek_id: d.sub_aspek_id,
        jumlah_unit: d.jumlah_unit || 0,
        kelengkapan: d.kelengkapan,
        keterangan: d.keterangan || '',
        nilai: d.nilai,
    }))

    const { error: detailError } = await supabase
        .from('sidak_detail')
        .insert(detailRows)
    if (detailError) throw detailError

    return { ...header, sidak_detail: detailRows }
}

export async function deleteSidak(id) {
    // sidak_detail should cascade, but just in case:
    await supabase.from('sidak_detail').delete().eq('sidak_id', id)
    const { error } = await supabase.from('sidak_header').delete().eq('id', id)
    if (error) throw error
}

// ── Optimized Egress Stats ──────────────────────────────────
export async function getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
        console.warn('RPC get_dashboard_stats failed, falling back to client-side grouping', error);
        const { data: rawData, error: rawError } = await supabase
            .from('sidak_header')
            .select('nama_ro');
            
        if (rawError) throw rawError;
        return rawData.reduce((acc, curr) => {
            acc[curr.nama_ro] = (acc[curr.nama_ro] || 0) + 1;
            return acc;
        }, {});
    }
    
    return data.reduce((acc, curr) => {
        acc[curr.nama_ro] = Number(curr.jumlah_laporan);
        return acc;
    }, {});
}

export async function getAdminStats() {
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) {
        console.warn('RPC get_admin_stats failed, falling back to client-side grouping', error);
        const { data: rawData, error: rawError } = await supabase
            .from('sidak_header')
            .select('nama_ro, nama_kl, total_nilai, status');
            
        if (rawError) throw rawError;
        
        const grouped = rawData.reduce((acc, curr) => {
             const key = `${curr.nama_ro}|${curr.nama_kl}`;
             if (!acc[key]) {
                 acc[key] = {
                     nama_ro: curr.nama_ro,
                     nama_kl: curr.nama_kl,
                     jumlah_laporan: 0,
                     sum_nilai: 0,
                     comply_count: 0
                 }
             }
             acc[key].jumlah_laporan++;
             acc[key].sum_nilai += Number(curr.total_nilai);
             if (curr.status === 'Comply') acc[key].comply_count++;
             return acc;
         }, {});
         
         return Object.values(grouped).map(g => ({
             nama_ro: g.nama_ro,
             nama_kl: g.nama_kl,
             jumlah_laporan: g.jumlah_laporan,
             rata_rata_nilai: g.sum_nilai / g.jumlah_laporan,
             comply_count: g.comply_count
         }));
    }
    return data;
}
