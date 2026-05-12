import { supabase } from '../services/supabaseClient'

/**
 * Uploads a base64 string (from signature canvas) to Supabase Storage
 * @param {string} base64Data - The base64 string
 * @param {string} folder - Folder name (sidak or temuan)
 * @returns {string} The public URL of the uploaded file
 */
export async function uploadSignature(base64Data, folder = 'misc') {
    if (!base64Data || !base64Data.startsWith('data:image')) return null;

    try {
        // 1. Convert base64 to Blob
        const base64Content = base64Data.split(',')[1];
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // 2. Generate unique filename
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;

        // 3. Upload to 'signatures' bucket
        const { data, error } = await supabase.storage
            .from('signatures')
            .upload(fileName, blob, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) throw error;

        // 4. Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('signatures')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Error uploading signature:', err);
        return base64Data; // Fallback to base64 if upload fails
    }
}
