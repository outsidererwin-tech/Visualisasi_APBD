import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CloudSun, MapPin, Clock, ShieldCheck, Waves } from 'lucide-react';
import { APP_CONFIG } from '../../lib/constants';

interface HeaderProps {
  hasUrl: boolean;
}

export function DashboardHeader({ hasUrl }: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      // WITA is UTC + 8
      const date = new Date();
      const utc = date.getTime() + date.getTimezoneOffset() * 60000;
      const witaDate = new Date(utc + 3600000 * 8);
      
      const hours = String(witaDate.getHours()).padStart(2, '0');
      const minutes = String(witaDate.getMinutes()).padStart(2, '0');
      const seconds = String(witaDate.getSeconds()).padStart(2, '0');
      
      setTime(`${hours}:${minutes}:${seconds} WITA`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!APP_CONFIG.HERO_IMAGES || APP_CONFIG.HERO_IMAGES.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % APP_CONFIG.HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-30 w-full max-w-7xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group bg-slate-950"
    >
      {/* Dynamic Background Banner Slideshow with Cross-fade Transition */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        {APP_CONFIG.HERO_IMAGES.map((img, idx) => (
          <motion.img 
            key={idx}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ 
              opacity: currentImageIndex === idx ? 0.35 : 0,
              scale: currentImageIndex === idx ? 1 : 1.08,
              zIndex: currentImageIndex === idx ? 1 : 0
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            src={img.src}
            alt={img.alt} 
            className="w-full h-full absolute inset-0 object-cover object-center filter saturate-125 brightness-95"
            referrerPolicy="no-referrer"
          />
        ))}
        {/* Modern Tropical Sky Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#042f2e]/70 to-[#020617]/95 mix-blend-multiply z-10" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent z-10" />
      </div>

      {/* Main Core Header Grid */}
      <div className="relative z-10 px-6 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Section: Logo & Titles */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto text-center sm:text-left">
          
          {/* Logo Container with Solid Navy Blue background to highlight the beautiful official Shield Emblem */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative bg-[#0a1128] w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-amber-400/35 p-2 shrink-0"
          >
            <img 
              src={APP_CONFIG.LOGO_PATH}
              alt={`Logo ${APP_CONFIG.DAERAH_NAME}`} 
              className="w-full h-full object-contain z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" /> Portal Transparansi
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400" /> Sumbawa Barat
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
              DASHBOARD APBD
            </h1>
            <p className="text-xs md:text-sm text-amber-300 font-bold">
              Sistem Publik Terintegrasi
            </p>
          </div>
        </div>

        {/* Right Section: Real-time Info Badges & Control Status */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-center md:justify-end">
          
          {/* Real-time WITA Clock */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/65 backdrop-blur-xl border border-white/5 rounded-xl text-slate-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider">{time || '--:--:-- WITA'}</span>
          </div>

          {/* Sumbawa Local Weather / Info Card */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/65 backdrop-blur-xl border border-white/5 rounded-xl text-slate-200 min-w-[150px]">
            <CloudSun className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 font-semibold leading-none">Landscape KSB</span>
              <motion.span 
                key={currentImageIndex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-bold leading-tight select-none"
              >
                {APP_CONFIG.HERO_IMAGES[currentImageIndex]?.shortName || 'Sumbawa Barat'}
              </motion.span>
            </div>
          </div>

          {/* Connection Status Badge */}
          {hasUrl ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
            >
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse-ring" />
              <span className="text-xs font-bold text-emerald-400">Koneksi Aktif</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
              <span className="text-xs font-bold text-rose-400">Koneksi Lokal</span>
            </div>
          )}
        </div>
      </div>

      {/* Slide Navigation Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 z-20 flex gap-2">
        {APP_CONFIG.HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImageIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentImageIndex === idx ? 'bg-amber-400 w-5' : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </motion.header>
  );
}

