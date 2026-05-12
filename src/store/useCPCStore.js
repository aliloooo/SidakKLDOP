import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCPCStore = create(
    persist(
        (set) => ({
            identity: {
                petugas_names: '',
                nama_vendor: '',
                alamat_cpc: '',
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
                    nama_vendor: '',
                    alamat_cpc: '',
                    tanggal_kunjungan: new Date().toISOString().split('T')[0],
                    tujuan_kunjungan: '',
                    vendor_pelaksana: ''
                } 
            }),
        }),
        {
            name: 'sidak-cpc-storage',
        }
    )
)

export default useCPCStore
