import { create } from 'zustand'

const useTemuanStore = create((set) => ({
    identity: {
        nama_ro: '',
        nama_kl: '',
        tanggal_kunjungan: '',
        tim_kunjungan: ''
    },
    setIdentity: (data) => set({ identity: data }),
    resetIdentity: () => set({
        identity: {
            nama_ro: '',
            nama_kl: '',
            tanggal_kunjungan: '',
            tim_kunjungan: ''
        }
    })
}))

export default useTemuanStore
