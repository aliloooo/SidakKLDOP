import { supabase } from './supabaseClient'
import { uploadSignature } from '../utils/storageHelper'

// ---------------------------------------------------------
// Master Indikator
// ---------------------------------------------------------
export async function getIndikator() {
    const { data, error } = await supabase
        .from('indikator_temuan')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) throw error
    return data
}

export async function addIndikator(nama_indikator) {
    const { data, error } = await supabase
        .from('indikator_temuan')
        .insert([{ nama_indikator }])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateIndikator(id, nama_indikator) {
    const { data, error } = await supabase
        .from('indikator_temuan')
        .update({ nama_indikator })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteIndikator(id) {
    const { error } = await supabase
        .from('indikator_temuan')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}

// ---------------------------------------------------------
// Temuan Transaksional
// ---------------------------------------------------------
export async function createTemuan({ identity, details }) {
    // 1. Process Signatures (Parallel Uploads)
    const [ttd1, ttd2, ttd3] = await Promise.all([
        uploadSignature(identity.ttd_spv_tie, 'temuan'),
        uploadSignature(identity.ttd_pet_bri, 'temuan'),
        uploadSignature(identity.ttd_pet_cro, 'temuan')
    ]);

    const { data: headerData, error: headerError } = await supabase
        .from('temuan_header')
        .insert([{
            nama_ro: identity.nama_ro,
            nama_kl: identity.nama_kl,
            vendor: identity.vendor,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tim_kunjungan: identity.tim_kunjungan,
            ttd_spv_tie: ttd1,
            ttd_pet_bri: ttd2,
            ttd_pet_cro: ttd3
        }])
        .select()
        .single()

    if (headerError) throw headerError

    // 2. Insert details
    if (details && details.length > 0) {
        const detailPayload = details.map(d => ({
            temuan_id: headerData.id,
            indikator_id: d.indikator_id,
            nama_indikator: d.nama_indikator,
            keterangan: d.keterangan || '',
            evaluasi: d.evaluasi || ''
        }))

        const { error: detailError } = await supabase
            .from('temuan_detail')
            .insert(detailPayload)

        if (detailError) throw detailError
    }

    return headerData
}

export async function getTemuanList({ page = 1, pageSize = 10, searchQuery = '', roFilter = '' }) {
    let query = supabase
        .from('temuan_header')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (searchQuery) {
        query = query.or(`nama_kl.ilike.%${searchQuery}%,nama_ro.ilike.%${searchQuery}%`)
    }
    if (roFilter) {
        query = query.eq('nama_ro', roFilter)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    return { data, count }
}

export async function getTemuanById(id) {
    // get header
    const { data: header, error: headerError } = await supabase
        .from('temuan_header')
        .select('*')
        .eq('id', id)
        .single()

    if (headerError) throw headerError

    // get details
    const { data: details, error: detailsError } = await supabase
        .from('temuan_detail')
        .select('*')
        .eq('temuan_id', id)
        .order('id', { ascending: true })

    if (detailsError) throw detailsError

    return { ...header, temuan_detail: details }
}

export async function updateTemuan(id, { identity, details }) {
    // 1. Process Signatures (Parallel Uploads - only if they are base64)
    const [ttd1, ttd2, ttd3] = await Promise.all([
        uploadSignature(identity.ttd_spv_tie, 'temuan'),
        uploadSignature(identity.ttd_pet_bri, 'temuan'),
        uploadSignature(identity.ttd_pet_cro, 'temuan')
    ]);

    const { error: headerError } = await supabase
        .from('temuan_header')
        .update({
            nama_ro: identity.nama_ro,
            nama_kl: identity.nama_kl,
            vendor: identity.vendor,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            tim_kunjungan: identity.tim_kunjungan,
            ttd_spv_tie: ttd1,
            ttd_pet_bri: ttd2,
            ttd_pet_cro: ttd3
        })
        .eq('id', id)

    if (headerError) throw headerError

    // 2. Update Details (Delete old ones and re-insert to handle changes simply)
    const { error: delError } = await supabase
        .from('temuan_detail')
        .delete()
        .eq('temuan_id', id)

    if (delError) throw delError

    if (details && details.length > 0) {
        const detailPayload = details.map(d => ({
            temuan_id: id,
            indikator_id: d.indikator_id,
            nama_indikator: d.nama_indikator,
            keterangan: d.keterangan || '',
            evaluasi: d.evaluasi || ''
        }))

        const { error: detailError } = await supabase
            .from('temuan_detail')
            .insert(detailPayload)

        if (detailError) throw detailError
    }

    return true
}

export async function deleteTemuan(id) {
    const { error } = await supabase
        .from('temuan_header')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}
