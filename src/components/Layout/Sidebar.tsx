import { useState } from 'react';
import { 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  LayoutDashboard,
  Wallet,
  CreditCard,
  TrendingDown,
  Settings,
  Database,
  CloudLightning,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { TABS } from '../../lib/constants';

interface SidebarProps {
  activeTab: 'pendapatan' | 'belanja' | 'pembiayaan' | 'tambah-data';
  onTabChange: (tab: 'pendapatan' | 'belanja' | 'pembiayaan' | 'tambah-data') => void;
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
  loading: boolean;
  onUpdateKoneksi: () => void;
}

export function Sidebar({ 
  activeTab, 
  onTabChange,
  appsScriptUrl,
  setAppsScriptUrl,
  loading,
  onUpdateKoneksi
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showKoneksi, setShowKoneksi] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleUpdate = async () => {
    setUpdateStatus('idle');
    try {
      // Logic for update passed from prop
      onUpdateKoneksi();
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (err) {
      setUpdateStatus('error');
    }
  };
  const menuItems = [
    { 
      id: 'pendapatan', 
      label: 'Pendapatan', 
      icon: <Wallet className="w-5 h-5" />, 
      type: 'tab' 
    },
    { 
      id: 'belanja', 
      label: 'Belanja', 
      icon: <CreditCard className="w-5 h-5" />, 
      type: 'tab' 
    },
    { 
      id: 'pembiayaan', 
      label: 'Pembiayaan', 
      icon: <TrendingDown className="w-5 h-5" />, 
      type: 'tab' 
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 280 : 80 }}
      className="sticky top-0 h-screen bg-[#0f172a]/50 backdrop-blur-2xl border-r border-white/10 flex flex-col z-40 transition-all duration-300"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-16 bg-indigo-600 text-white p-1 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50 border border-white/20"
      >
        {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Sidebar Header/Space - Frozen Top Bar */}
      <div className="h-20 flex-shrink-0 flex items-center px-6 border-b border-white/5 bg-slate-950/30">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-indigo-500/20 shadow-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-white tracking-tight uppercase text-sm">Menu Dashboard</span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="mx-auto"
            >
              <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Main Group */}
        <div>
          {isExpanded && (
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              Postur APBD
            </p>
          )}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  activeTab === item.id 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                  activeTab === item.id ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}>
                  {item.icon}
                </div>
                
                {isExpanded && (
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                )}

                {!isExpanded && activeTab === item.id && (
                  <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
                )}

                {/* Tooltip for collapsed mode */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-[#1e293b] text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Group */}
        <div>
          {isExpanded && (
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              Konfigurasi
            </p>
          )}
          <div className="space-y-1">
            <button
              onClick={() => onTabChange('tambah-data')}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative border",
                activeTab === 'tambah-data'
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 border-transparent hover:border-emerald-500/10"
              )}
            >
              <PlusCircle className={cn(
                "w-5 h-5 transition-colors",
                activeTab === 'tambah-data' ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-500"
              )} />
              {isExpanded && <span className="font-bold text-sm tracking-tight">Tambah Data</span>}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#1e293b] text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  Tambah Data (Scraper)
                </div>
              )}
            </button>

            <button
              onClick={() => setShowKoneksi(!showKoneksi)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative border",
                showKoneksi
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  : "text-slate-400 hover:text-indigo-400 hover:bg-white/5 border-transparent hover:border-white/10"
              )}
            >
              <Settings className={cn(
                "w-5 h-5 transition-colors",
                showKoneksi ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"
              )} />
              {isExpanded && <span className="font-bold text-sm tracking-tight">Update Koneksi</span>}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#1e293b] text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  Update Koneksi
                </div>
              )}
            </button>

            <AnimatePresence>
              {showKoneksi && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-3 space-y-3 overflow-hidden bg-white/5 rounded-xl border border-white/10 mt-1"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Script URL</p>
                    <input 
                      type="text" 
                      value={appsScriptUrl}
                      onChange={(e) => setAppsScriptUrl(e.target.value)}
                      placeholder="Paste URL Script..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className={cn(
                      "w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      updateStatus === 'success' 
                        ? "bg-emerald-600 text-white" 
                        : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                    )}
                  >
                    {loading ? (
                      <CloudLightning className="w-3 h-3 animate-pulse" />
                    ) : updateStatus === 'success' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Database className="w-3 h-3" />
                    )}
                    {loading ? 'Wait...' : updateStatus === 'success' ? 'Berhasil' : 'Update'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className={cn(
          "flex items-center gap-3 overflow-hidden transition-all",
          isExpanded ? "px-4" : "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          {isExpanded && (
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">Admin BPKAD KSB</p>
              <a 
                href="https://bpkad.ppid.sumbawabaratkab.go.id" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] text-slate-500 hover:text-indigo-400 hover:underline truncate lowercase transition-colors block"
              >
                bpkad.ppid.sumbawabaratkab.go.id
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
