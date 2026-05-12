import { CheckCircle } from 'lucide-react'

/**
 * A professional digital stamp component (Text-based, no logo)
 */
export default function DigitalStamp({ vendor, date, reportId }) {
    // Note: 'vendor' prop here will be used to display the KL Name as requested
    const displayTitle = vendor || "SIDAK SYSTEM";

    const formattedDate = date ? new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="relative inline-block p-3 border-[3px] border-brand-600/50 rounded-xl rotate-[-3deg] mix-blend-multiply pointer-events-none min-w-[200px] bg-transparent">
            {/* Ink Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-4 h-4 text-brand-600" />
                    <span className="text-[14px] font-black text-brand-700 tracking-tighter uppercase italic">OFFICIALLY VERIFIED</span>
                </div>
                
                <div className="w-full h-[2px] bg-brand-600/40 my-1" />
                
                <div className="space-y-0.5">
                    <p className="text-[13px] font-black text-brand-800 uppercase tracking-widest leading-tight">{displayTitle}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{formattedDate}</p>
                    {reportId && <p className="text-[8px] font-mono text-brand-600/60 mt-1 uppercase">REF: {reportId}</p>}
                </div>
            </div>

            {/* Subtle inner border */}
            <div className="absolute inset-1 border border-brand-600/20 rounded-lg pointer-events-none" />
        </div>
    );
}
