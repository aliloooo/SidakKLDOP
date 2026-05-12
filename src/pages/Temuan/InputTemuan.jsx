import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Calendar, MapPin, User, ArrowRight, ArrowLeft, Plus, X } from 'lucide-react'
import useTemuanStore from '../../store/useTemuanStore'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const RO_OPTIONS = [
    "RO 1/Medan",
    "RO 2/ Pekanbaru",
    "RO 3/Padang",
    "RO 4/Palembang",
    "RO 5/ Bandar Lampung",
    "RO 6/ Jakarta 1",
    "RO 7/ Jakarta 2",
    "RO 8/ Jakarta 3",
    "RO 9/Bandung",
    "RO 10/Semarang",
    "RO 11/Yogyakarta",
    "RO 12/Surabaya",
    "RO 13/Malang",
    "RO 14/Banjarmasin",
    "RO 15/Makassar",
    "RO 16/Manado",
    "RO 17/Denpasar",
    "RO 18/Jayapura"
]

const VENDOR_OPTIONS = [
    "BGI",
    "Advantage",
    "SSI",
    "Kejar",
    "TAG",
    "UG",
    "Lainnya"
]

const schema = yup.object().shape({
    nama_ro: yup.string().required('Regional Office wajib dipilih'),
    nama_kl: yup.string().required('Nama Kantor Layanan wajib diisi'),
    vendor: yup.string().required('Vendor Pelaksana wajib dipilih'),
    tanggal_kunjungan: yup.string().required('Tanggal Kunjungan wajib diisi'),
    tim_kunjungan: yup.array().of(
        yup.object().shape({
            name: yup.string().trim().required('Nama anggota tim wajib diisi')
        })
    ).min(1, 'Minimal 1 anggota tim').max(5, 'Maksimal 5 anggota tim')
})

export default function InputTemuan() {
    const navigate = useNavigate()
    const { identity, setIdentity } = useTemuanStore()

    // Parse existing tim_kunjungan into array of objects if it exists
    const defaultTim = identity.tim_kunjungan 
        ? identity.tim_kunjungan.split(', ').map(name => ({ name }))
        : [{ name: '' }];

    const { register, control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            nama_ro: identity.nama_ro || '',
            nama_kl: identity.nama_kl || '',
            vendor: identity.vendor || '',
            tanggal_kunjungan: identity.tanggal_kunjungan || new Date().toISOString().split('T')[0],
            tim_kunjungan: defaultTim
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "tim_kunjungan"
    })

    const onSubmit = (data) => {
        const timArray = data.tim_kunjungan.map(t => t.name).filter(n => n !== '');
        const finalData = {
            ...data,
            tim_kunjungan: timArray.join(', ')
        }
        setIdentity(finalData)
        navigate('/form-temuan')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="btn-secondary px-3 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">1</span>
                        <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">Langkah 1 dari 2</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Informasi Awal Temuan</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Lengkapi identitas kantor layanan sebelum mengisi form temuan.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
                <div>
                    <label className="form-label mb-1.5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        Regional Office
                    </label>
                    <select
                        {...register('nama_ro')}
                        className={`form-input ${errors.nama_ro ? 'border-red-300 focus:ring-red-500' : ''}`}
                    >
                        <option value="">Pilih Regional Office...</option>
                        {RO_OPTIONS.map(ro => (
                            <option key={ro} value={ro}>{ro}</option>
                        ))}
                    </select>
                    {errors.nama_ro && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.nama_ro.message}</p>
                    )}
                </div>

                <div>
                    <label className="form-label mb-1.5 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        Nama Kantor Layanan
                    </label>
                    <input
                        type="text"
                        {...register('nama_kl')}
                        className={`form-input ${errors.nama_kl ? 'border-red-300 focus:ring-red-500' : ''}`}
                        placeholder="Contoh: KL Sudirman"
                    />
                    {errors.nama_kl && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.nama_kl.message}</p>
                    )}
                </div>

                <div>
                    <label className="form-label mb-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        Vendor Pelaksana
                    </label>
                    <select
                        {...register('vendor')}
                        className={`form-input ${errors.vendor ? 'border-red-300 focus:ring-red-500' : ''}`}
                    >
                        <option value="">Pilih Vendor...</option>
                        {VENDOR_OPTIONS.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                    {errors.vendor && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.vendor.message}</p>
                    )}
                </div>

                <div>
                    <label className="form-label mb-1.5 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Tanggal Kunjungan
                    </label>
                    <input
                        type="date"
                        {...register('tanggal_kunjungan')}
                        className={`form-input ${errors.tanggal_kunjungan ? 'border-red-300 focus:ring-red-500' : ''}`}
                    />
                    {errors.tanggal_kunjungan && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{errors.tanggal_kunjungan.message}</p>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <label className="form-label flex items-center gap-2 mb-0">
                            <User className="w-4 h-4 text-gray-400" />
                            Tim Kunjungan
                        </label>
                        <span className="text-xs font-normal text-gray-500">{fields.length}/5 orang</span>
                    </div>
                    
                    <div className="space-y-3">
                        {fields.map((item, index) => (
                            <div key={item.id} className="flex gap-2">
                                <div className="flex-grow relative">
                                    <input
                                        type="text"
                                        {...register(`tim_kunjungan.${index}.name`)}
                                        className={`form-input ${errors.tim_kunjungan?.[index]?.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        placeholder={`Nama anggota tim ${index + 1}`}
                                    />
                                    {errors.tim_kunjungan?.[index]?.name && (
                                        <p className="absolute -bottom-5 left-0 text-[10px] font-medium text-red-500">
                                            {errors.tim_kunjungan[index].name.message}
                                        </p>
                                    )}
                                </div>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-red-100 h-[42px]"
                                        title="Hapus baris ini"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {fields.length < 5 && (
                        <button
                            type="button"
                            onClick={() => append({ name: '' })}
                            className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Anggota Tim
                        </button>
                    )}
                    {errors.tim_kunjungan && !Array.isArray(errors.tim_kunjungan) && (
                        <p className="mt-2 text-xs font-medium text-red-500">{errors.tim_kunjungan.message}</p>
                    )}
                </div>

                <div className="pt-6 flex justify-end">
                    <button type="submit" className="btn-primary w-full sm:w-auto px-8">
                        Lanjut ke Form Temuan
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </form>
        </div>
    )
}
