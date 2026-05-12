import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, User, Building2, MapPin, Calendar, ClipboardList, Plus, X } from 'lucide-react'
import useTIDStore from '../../store/useTIDStore'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

const VENDOR_OPTIONS = ["BGI", "Advantage", "SSI", "Kejar", "TAG", "UG", "Lainnya"]
const RO_OPTIONS = [
    "RO 1/Medan", "RO 2/ Pekanbaru", "RO 3/Padang", "RO 4/Palembang", "RO 5/ Bandar Lampung",
    "RO 6/ Jakarta 1", "RO 7/ Jakarta 2", "RO 8/ Jakarta 3", "RO 9/Bandung", "RO 10/Semarang",
    "RO 11/Yogyakarta", "RO 12/Surabaya", "RO 13/Malang", "RO 14/Banjarmasin", "RO 15/Makassar",
    "RO 16/Manado", "RO 17/Denpasar", "RO 18/Jayapura"
]

const schema = yup.object().shape({
    nama_vendor: yup.string().required('Nama Kantor Layanan wajib diisi'),
    nama_ro: yup.string().required('Regional Office wajib dipilih'),
    alamat_tid: yup.string().required('Alamat TID wajib diisi'),
    tanggal_kunjungan: yup.string().required('Tanggal Kunjungan wajib diisi'),
    tujuan_kunjungan: yup.string().required('Tujuan Kunjungan wajib diisi'),
    vendor_pelaksana: yup.string().required('Vendor Pelaksana wajib dipilih'),
    petugas_names: yup.array().of(
        yup.object().shape({
            name: yup.string().trim().required('Nama petugas wajib diisi')
        })
    ).min(1, 'Minimal 1 petugas').max(5, 'Maksimal 5 petugas')
})

export default function InputTIDInfo() {
    const navigate = useNavigate()
    const { identity, setIdentity } = useTIDStore()

    const defaultPetugas = identity.petugas_names
        ? identity.petugas_names.split(', ').map(name => ({ name }))
        : [{ name: '' }];

    const { register, control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nama_vendor: identity.nama_vendor || '',
            nama_ro: identity.nama_ro || '',
            alamat_tid: identity.alamat_tid || '',
            tanggal_kunjungan: identity.tanggal_kunjungan || new Date().toISOString().split('T')[0],
            tujuan_kunjungan: identity.tujuan_kunjungan || '',
            vendor_pelaksana: identity.vendor_pelaksana || '',
            petugas_names: defaultPetugas
        }
    })

    const { fields, append, remove } = useFieldArray({ control, name: "petugas_names" })

    const onSubmit = (data) => {
        const namesArray = data.petugas_names.map(p => p.name).filter(n => n !== '');
        const finalData = { ...data, petugas_names: namesArray.join(', ') }
        setIdentity(finalData)
        toast.success('Informasi awal tersimpan!')
        navigate('/form-tid')
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="btn-secondary px-3 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Kunjungan TID</h1>
                    <p className="text-sm text-gray-500">Langkah 1: Informasi Kunjungan</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="card space-y-5">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="form-label flex items-center gap-2 mb-0">
                                <User className="w-4 h-4 text-brand-600" />
                                Nama Petugas BRI yang Mengunjungi
                            </label>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{fields.length}/5</span>
                        </div>
                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            {...register(`petugas_names.${index}.name`)}
                                            placeholder={`Petugas ${index + 1}`}
                                            className={`form-input ${errors.petugas_names?.[index]?.name ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {fields.length > 1 && (
                                        <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {fields.length < 5 && (
                                <button type="button" onClick={() => append({ name: '' })} className="text-xs font-bold text-brand-600 flex items-center gap-1 mt-1">
                                    <Plus className="w-3 h-3" /> Tambah Petugas
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Regional Office (RO)</label>
                            <select {...register('nama_ro')} className="form-input">
                                <option value="">Pilih RO...</option>
                                {RO_OPTIONS.map(ro => <option key={ro} value={ro}>{ro}</option>)}
                            </select>
                            {errors.nama_ro && <p className="text-xs text-red-500 mt-1">{errors.nama_ro.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Kantor Layanan</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input {...register('nama_vendor')} className="form-input pl-10" placeholder="Nama Kantor Layanan" />
                            </div>
                            {errors.nama_vendor && <p className="text-xs text-red-500 mt-1">{errors.nama_vendor.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Vendor</label>
                            <select {...register('vendor_pelaksana')} className="form-input">
                                <option value="">Pilih Vendor...</option>
                                {VENDOR_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            {errors.vendor_pelaksana && <p className="text-xs text-red-500 mt-1">{errors.vendor_pelaksana.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Alamat TID KL yang Dikunjungi</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input {...register('alamat_tid')} className="form-input pl-10" placeholder="Alamat Lengkap TID" />
                        </div>
                        {errors.alamat_tid && <p className="text-xs text-red-500 mt-1">{errors.alamat_tid.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Tanggal Kunjungan</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input type="date" {...register('tanggal_kunjungan')} className="form-input pl-10" />
                            </div>
                            {errors.tanggal_kunjungan && <p className="text-xs text-red-500 mt-1">{errors.tanggal_kunjungan.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Tujuan Kunjungan</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input {...register('tujuan_kunjungan')} className="form-input pl-10" placeholder="Contoh: Monitoring Rutin" />
                            </div>
                            {errors.tujuan_kunjungan && <p className="text-xs text-red-500 mt-1">{errors.tujuan_kunjungan.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="btn-primary px-8">
                        Lanjut ke Form Hasil
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    )
}
