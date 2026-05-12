-- ============================================================
-- SIDAK Kantor Layanan – Database Schema
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- 1. Aspek (assessment categories)
CREATE TABLE IF NOT EXISTS aspek (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_aspek   text NOT NULL,
  bobot_aspek  numeric NOT NULL CHECK (bobot_aspek >= 0 AND bobot_aspek <= 100),
  created_at   timestamptz DEFAULT now()
);

-- 2. Sub Aspek (sub-categories)
CREATE TABLE IF NOT EXISTS sub_aspek (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspek_id          uuid NOT NULL REFERENCES aspek(id) ON DELETE CASCADE,
  nama_sub_aspek    text NOT NULL,
  bobot_sub_aspek   numeric NOT NULL CHECK (bobot_sub_aspek >= 0),
  is_unit_required  boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- 3. SIDAK Header (main inspection record)
CREATE TABLE IF NOT EXISTS sidak_header (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_ro             text NOT NULL,
  nama_kl             text NOT NULL,
  tanggal_kunjungan   date NOT NULL,
  tim_kunjungan       text,
  ttd_kepala_kl       text,
  total_nilai         numeric DEFAULT 0,
  status              text DEFAULT 'Not Comply' CHECK (status IN ('Comply', 'Not Comply')),
  created_at          timestamptz DEFAULT now(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. SIDAK Detail (line items per sub aspek)
CREATE TABLE IF NOT EXISTS sidak_detail (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidak_id      uuid NOT NULL REFERENCES sidak_header(id) ON DELETE CASCADE,
  aspek_id      uuid REFERENCES aspek(id) ON DELETE SET NULL,
  sub_aspek_id  uuid REFERENCES sub_aspek(id) ON DELETE SET NULL,
  jumlah_unit   integer DEFAULT 0,
  kelengkapan   text DEFAULT 'Tidak Sesuai' CHECK (kelengkapan IN ('Sesuai', 'Tidak Sesuai')),
  keterangan    text,
  nilai         numeric DEFAULT 0
);

-- 5. Template Files (Excel templates for download)
CREATE TABLE IF NOT EXISTS template_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_file    text NOT NULL,
  file_url     text NOT NULL,
  uploaded_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE aspek         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_aspek     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidak_header  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidak_detail  ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_files ENABLE ROW LEVEL SECURITY;

-- aspek: Anyone can read; only authenticated (admin) can write
CREATE POLICY "Public read aspek"
  ON aspek FOR SELECT USING (true);

CREATE POLICY "Authenticated write aspek"
  ON aspek FOR ALL USING (auth.role() = 'authenticated');

-- sub_aspek: Same pattern
CREATE POLICY "Public read sub_aspek"
  ON sub_aspek FOR SELECT USING (true);

CREATE POLICY "Authenticated write sub_aspek"
  ON sub_aspek FOR ALL USING (auth.role() = 'authenticated');

-- sidak_header: Anyone can insert, read, update, and delete
CREATE POLICY "Anyone insert sidak"
  ON sidak_header FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone read all sidak"
  ON sidak_header FOR SELECT USING (true);

CREATE POLICY "Anyone delete sidak"
  ON sidak_header FOR DELETE USING (true);

CREATE POLICY "Anyone update sidak"
  ON sidak_header FOR UPDATE USING (true);

-- sidak_detail: Anyone can insert, read, update, and delete
CREATE POLICY "Anyone insert sidak_detail"
  ON sidak_detail FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone read all sidak_detail"
  ON sidak_detail FOR SELECT USING (true);

CREATE POLICY "Anyone delete sidak_detail"
  ON sidak_detail FOR DELETE USING (true);

CREATE POLICY "Anyone update sidak_detail"
  ON sidak_detail FOR UPDATE USING (true);

-- template_files: Anyone can read; admin can write
CREATE POLICY "Public read templates"
  ON template_files FOR SELECT USING (true);

CREATE POLICY "Authenticated write templates"
  ON template_files FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Supabase Storage (run via Dashboard or Storage API)
-- Create bucket: sidak-templates (public read)
-- ============================================================
-- Via Supabase Dashboard: Storage > New Bucket > sidak-templates > Public: ON

-- ============================================================
-- RPC Functions for Data Egress Optimization
-- ============================================================

-- Function for Dashboard Stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    nama_ro text,
    jumlah_laporan bigint
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT nama_ro, count(*) as jumlah_laporan
    FROM v_all_reports
    GROUP BY nama_ro;
$$;

-- Function for Admin Results Stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    nama_ro text,
    nama_kl text,
    jumlah_laporan bigint,
    rata_rata_nilai numeric,
    comply_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        nama_ro, 
        nama_kl, 
        count(*) as jumlah_laporan,
        avg(total_nilai) as rata_rata_nilai,
        sum(case when status = 'Comply' then 1 else 0 end) as comply_count
    FROM sidak_header
    GROUP BY nama_ro, nama_kl;
$$;


-- ============================================================
-- 6. Master Indikator (Dikelola oleh Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS indikator_temuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_indikator text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. Temuan Header (Menyimpan Data Kunjungan & 3 Tanda Tangan)
-- ============================================================
CREATE TABLE IF NOT EXISTS temuan_header (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_ro text NOT NULL,
  nama_kl text NOT NULL,
  tanggal_kunjungan date NOT NULL,
  tim_kunjungan text,
  ttd_spv_tie text,
  ttd_pet_bri text,
  ttd_pet_cro text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. Temuan Detail (Menyimpan isian per indikator)
-- ============================================================
CREATE TABLE IF NOT EXISTS temuan_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  temuan_id uuid REFERENCES temuan_header(id) ON DELETE CASCADE,
  indikator_id uuid REFERENCES indikator_temuan(id) ON DELETE SET NULL,
  nama_indikator text NOT NULL,
  keterangan text,
  evaluasi text
);

-- ============================================================
-- RLS untuk Modul Temuan
-- ============================================================
ALTER TABLE indikator_temuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE temuan_header    ENABLE ROW LEVEL SECURITY;
ALTER TABLE temuan_detail    ENABLE ROW LEVEL SECURITY;

-- indikator_temuan: Public read, Authenticated write
CREATE POLICY "Public read indikator_temuan"
  ON indikator_temuan FOR SELECT USING (true);

CREATE POLICY "Authenticated write indikator_temuan"
  ON indikator_temuan FOR ALL USING (auth.role() = 'authenticated');

-- temuan_header: Anyone can insert, read, update, delete
CREATE POLICY "Anyone insert temuan_header"
  ON temuan_header FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone read all temuan_header"
  ON temuan_header FOR SELECT USING (true);

CREATE POLICY "Anyone update temuan_header"
  ON temuan_header FOR UPDATE USING (true);

CREATE POLICY "Anyone delete temuan_header"
  ON temuan_header FOR DELETE USING (true);

-- temuan_detail: Anyone can insert, read, update, delete
CREATE POLICY "Anyone insert temuan_detail"
  ON temuan_detail FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone read all temuan_detail"
  ON temuan_detail FOR SELECT USING (true);

CREATE POLICY "Anyone update temuan_detail"
  ON temuan_detail FOR UPDATE USING (true);

CREATE POLICY "Anyone delete temuan_detail"
  ON temuan_detail FOR DELETE USING (true);
-- ============================================================
-- 9. View for Dashboard (Combined Sidak & Temuan)
-- ============================================================
CREATE OR REPLACE VIEW v_all_reports AS
SELECT 
    id, 
    nama_ro, 
    nama_kl, 
    tanggal_kunjungan, 
    'Checklist KL' as tipe_laporan,
    created_at
FROM sidak_header
UNION ALL
SELECT 
    id, 
    nama_ro, 
    nama_kl, 
    tanggal_kunjungan, 
    'Temuan' as tipe_laporan,
    created_at
FROM temuan_header;

-- ============================================================
-- 10. Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sidak_ro ON sidak_header(nama_ro);
CREATE INDEX IF NOT EXISTS idx_sidak_kl ON sidak_header(nama_kl);
CREATE INDEX IF NOT EXISTS idx_temuan_ro ON temuan_header(nama_ro);
CREATE INDEX IF NOT EXISTS idx_temuan_kl ON temuan_header(nama_kl);

-- Add vendor column to headers
ALTER TABLE sidak_header ADD COLUMN IF NOT EXISTS vendor TEXT;
ALTER TABLE temuan_header ADD COLUMN IF NOT EXISTS vendor TEXT;

-- Update view to include vendor and CPC
CREATE OR REPLACE VIEW v_all_reports AS
SELECT 
    id, 
    nama_ro, 
    nama_kl, 
    vendor,
    tanggal_kunjungan, 
    'Checklist KL' as tipe_laporan,
    created_at
FROM sidak_header
UNION ALL
SELECT 
    id, 
    nama_ro, 
    nama_kl, 
    vendor,
    tanggal_kunjungan, 
    'Temuan' as tipe_laporan,
    created_at
FROM temuan_header
UNION ALL
SELECT 
    id, 
    nama_ro, 
    nama_vendor as nama_kl, 
    nama_vendor as vendor,
    tanggal_kunjungan, 
    'CPC' as tipe_laporan,
    created_at
FROM laporan_cpc_header;

-- ============================================================
-- 10. Laporan CPC CRO
-- ============================================================
CREATE TABLE IF NOT EXISTS laporan_cpc_header (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    petugas_names TEXT,
    nama_vendor TEXT,
    alamat_cpc TEXT,
    tanggal_kunjungan DATE,
    tujuan_kunjungan TEXT,
    ttd_kepala_kl TEXT,
    nama_kepala_kl TEXT,
    nama_perusahaan TEXT,
    vendor_pelaksana TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laporan_cpc_detail (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    cpc_id UUID REFERENCES laporan_cpc_header(id) ON DELETE CASCADE,
    item_name TEXT,
    kondisi TEXT,
    keterangan TEXT
);

-- ============================================================
-- 11. Master Indikator CPC
-- ============================================================
CREATE TABLE IF NOT EXISTS master_indikator_cpc (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    label TEXT NOT NULL,
    options TEXT DEFAULT 'Ada,Tidak', -- Pilihan default
    ket_label TEXT, -- Label untuk kolom keterangan (misal: 'Jumlah :', 'Ukuran :')
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data awal agar tidak kosong
INSERT INTO master_indikator_cpc (label, ket_label, order_index) VALUES
('Jumlah CPC', 'Jumlah :', 1),
('Telepon Kantor', 'Tlp :', 2),
('Facsimile', 'Fax :', 3),
('Luas Tanah', 'Ukuran :', 4),
('Luas Bangunan', 'Ukuran :', 5),
('Size Khazanah', 'Ukuran :', 6),
('Status Kepemilikan', '', 7);

-- Update tabel detail agar menyimpan label aslinya saat disubmit
ALTER TABLE laporan_cpc_detail ADD COLUMN IF NOT EXISTS item_label TEXT;

-- Tambahkan kolom is_heading ke master indikator CPC
ALTER TABLE master_indikator_cpc ADD COLUMN IF NOT EXISTS is_heading BOOLEAN DEFAULT FALSE;

-- Update data awal agar poin nomor 4 menjadi heading jika diperlukan, 
-- namun lebih baik kita update manual lewat UI nanti.

-- ============================================================
-- 12. Laporan TID
-- ============================================================
CREATE TABLE IF NOT EXISTS laporan_tid_header (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    petugas_names TEXT,
    nama_ro TEXT,
    nama_vendor TEXT,
    alamat_tid TEXT,
    tanggal_kunjungan DATE,
    tujuan_kunjungan TEXT,
    ttd_kepala_kl TEXT,
    nama_kepala_kl TEXT,
    nama_perusahaan TEXT,
    vendor_pelaksana TEXT,
    nama_ro_user TEXT,
    ttd_ro TEXT,
    nama_dop_user TEXT,
    ttd_dop TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laporan_tid_detail (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    tid_id UUID REFERENCES laporan_tid_header(id) ON DELETE CASCADE,
    item_name TEXT,
    kondisi TEXT,
    keterangan TEXT
);

-- ============================================================
-- 13. Master Indikator TID
-- ============================================================
CREATE TABLE IF NOT EXISTS master_indikator_tid (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    label TEXT NOT NULL,
    options TEXT DEFAULT 'Ada,Tidak',
    ket_label TEXT,
    order_index INT DEFAULT 0,
    is_heading BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data awal untuk TID (sama seperti CPC sebagai template)
INSERT INTO master_indikator_tid (label, ket_label, order_index) VALUES
('Jumlah TID', 'Jumlah :', 1),
('Kondisi Fisik', '', 2),
('Keamanan', '', 3),
('Kebersihan', '', 4);

-- RLS untuk Modul TID
ALTER TABLE laporan_tid_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_tid_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_indikator_tid ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone insert tid_header" ON laporan_tid_header FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone read tid_header" ON laporan_tid_header FOR SELECT USING (true);
CREATE POLICY "Anyone update tid_header" ON laporan_tid_header FOR UPDATE USING (true);
CREATE POLICY "Anyone delete tid_header" ON laporan_tid_header FOR DELETE USING (true);

CREATE POLICY "Anyone insert tid_detail" ON laporan_tid_detail FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone read tid_detail" ON laporan_tid_detail FOR SELECT USING (true);

CREATE POLICY "Public read master_tid" ON master_indikator_tid FOR SELECT USING (true);
CREATE POLICY "Authenticated write master_tid" ON master_indikator_tid FOR ALL USING (auth.role() = 'authenticated');
