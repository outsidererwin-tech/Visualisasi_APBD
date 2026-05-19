import { TrendingUp, Settings, Download } from 'lucide-react';
import { APP_CONFIG } from '../../lib/constants';

interface HeaderProps {
  hasUrl: boolean;
}

export function DashboardHeader({ hasUrl }: HeaderProps) {
  return (
    <header className="z-30 w-full max-w-7xl mx-auto px-6 py-4 mb-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-white/10 w-20 h-20 rounded-xl flex items-center justify-center shadow-xl overflow-hidden p-2 backdrop-blur-md border border-white/10">
          <img 
            src={APP_CONFIG.LOGO_PATH}
            alt={`Logo ${APP_CONFIG.DAERAH_NAME}`} 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard APBD</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{APP_CONFIG.DAERAH_NAME}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {hasUrl && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Koneksi Aktif</span>
          </div>
        )}
      </div>
    </header>
  );
}
