import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useTIDStore = create(
    persist(
        (set) => ({
            identity: {
                petugas_names: '',
                nama_ro: '',
                nama_vendor: '', // Nama KL
                alamat_tid: '',
                tanggal_kunjungan: new Date().toISOString().split('T')[0],
                tujuan_kunjungan: '',
                vendor_pelaksana: ''
            },
            setIdentity: (newIdentity) => set((state) => ({ 
                identity: { ...state.identity, ...newIdentity } 
            })),
            resetIdentity: () => set({ 
                identity: {
                    petugas_names: '',
                    nama_ro: '',
                    nama_vendor: '',
                    alamat_tid: '',
                    tanggal_kunjungan: new Date().toISOString().split('T')[0],
                    tujuan_kunjungan: '',
                    vendor_pelaksana: ''
                } 
            }),
        }),
        {
            name: 'sidak-tid-storage-v2',
        }
    )
)

export default useTIDStore
