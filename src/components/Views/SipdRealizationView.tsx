import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Database, TrendingUp, Search, ArrowUpRight, Scale, Info, 
  HelpCircle, Percent, Coins, LayoutGrid, Layers, ArrowRight,
  ChevronDown, Filter, FileSpreadsheet, RotateCcw, Check, CheckCircle2,
  ListFilter, Building2, HelpCircle as HelpIcon, Table, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SipdRealizationRecord } from '../../types';
import { formatBillions } from '../../lib/formatters';

interface SipdRealizationViewProps {
  sipdRealizationData: SipdRealizationRecord[];
}

export const formatCurrencyExact = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentExact = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + '%';
};

// Compact IDR Formatter matching spreadsheet screenshot abbreviations
export const formatCompactIDR = (value: number) => {
  if (value >= 1e12) {
    return `Rp ${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `Rp ${(value / 1e9).toFixed(2)}M`;
  }
  if (value >= 1e6) {
    return `Rp ${(value / 1e6).toFixed(2)} Jt`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
};

export function SipdRealizationView({ 
  sipdRealizationData = [] 
}: SipdRealizationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkpd, setSelectedSkpd] = useState<string>('Semua');
  const [selectedProgram, setSelectedProgram] = useState<string>('Semua');
  const [selectedKegiatan, setSelectedKegiatan] = useState<string>('Semua');
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<string>('Semua');

  // Dynamic cascading filter choices
  const skpdList = useMemo(() => {
    const uniques = Array.from(new Set(sipdRealizationData.map(item => item.namaSkpd)));
    return ['Semua', ...uniques.filter(Boolean).sort()];
  }, [sipdRealizationData]);

  const programList = useMemo(() => {
    let dataset = sipdRealizationData;
    if (selectedSkpd !== 'Semua') {
      dataset = dataset.filter(item => item.namaSkpd === selectedSkpd);
    }
    const uniques = Array.from(new Set(dataset.map(item => item.namaProgram)));
    return ['Semua', ...uniques.filter(Boolean).sort()];
  }, [sipdRealizationData, selectedSkpd]);

  const kegiatanList = useMemo(() => {
    let dataset = sipdRealizationData;
    if (selectedSkpd !== 'Semua') {
      dataset = dataset.filter(item => item.namaSkpd === selectedSkpd);
    }
    if (selectedProgram !== 'Semua') {
      dataset = dataset.filter(item => item.namaProgram === selectedProgram);
    }
    const uniques = Array.from(new Set(dataset.map(item => item.namaKegiatan)));
    return ['Semua', ...uniques.filter(Boolean).sort()];
  }, [sipdRealizationData, selectedSkpd, selectedProgram]);

  const subKegiatanList = useMemo(() => {
    let dataset = sipdRealizationData;
    if (selectedSkpd !== 'Semua') {
      dataset = dataset.filter(item => item.namaSkpd === selectedSkpd);
    }
    if (selectedProgram !== 'Semua') {
      dataset = dataset.filter(item => item.namaProgram === selectedProgram);
    }
    if (selectedKegiatan !== 'Semua') {
      dataset = dataset.filter(item => item.namaKegiatan === selectedKegiatan);
    }
    const uniques = Array.from(new Set(dataset.map(item => item.namaSubKegiatan)));
    return ['Semua', ...uniques.filter(Boolean).sort()];
  }, [sipdRealizationData, selectedSkpd, selectedProgram, selectedKegiatan]);

  // Handle Cascading Filter Resets
  const handleSkpdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSkpd(e.target.value);
    setSelectedProgram('Semua');
    setSelectedKegiatan('Semua');
    setSelectedSubKegiatan('Semua');
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
    setSelectedKegiatan('Semua');
    setSelectedSubKegiatan('Semua');
  };

  const handleKegiatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKegiatan(e.target.value);
    setSelectedSubKegiatan('Semua');
  };

  const handleSubKegiatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubKegiatan(e.target.value);
  };

  const handleResetAllFilters = () => {
    setSelectedSkpd('Semua');
    setSelectedProgram('Semua');
    setSelectedKegiatan('Semua');
    setSelectedSubKegiatan('Semua');
    setSearchQuery('');
  };

  // Filtering Logic
  const filteredData = useMemo(() => {
    let result = [...sipdRealizationData];

    if (selectedSkpd !== 'Semua') {
      result = result.filter(item => item.namaSkpd === selectedSkpd);
    }

    if (selectedProgram !== 'Semua') {
      result = result.filter(item => item.namaProgram === selectedProgram);
    }

    if (selectedKegiatan !== 'Semua') {
      result = result.filter(item => item.namaKegiatan === selectedKegiatan);
    }

    if (selectedSubKegiatan !== 'Semua') {
      result = result.filter(item => item.namaSubKegiatan === selectedSubKegiatan);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.namaSubKegiatan || '').toLowerCase().includes(q) || 
        (item.namaProgram || '').toLowerCase().includes(q) || 
        (item.namaSkpd || '').toLowerCase().includes(q) || 
        (item.namaRekening || '').toLowerCase().includes(q) || 
        (item.kodeRekening || '').toLowerCase().includes(q) ||
        (item.kodeSubKegiatan || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [sipdRealizationData, selectedSkpd, selectedProgram, selectedKegiatan, selectedSubKegiatan, searchQuery]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalAlokasi = filteredData.reduce((acc, curr) => acc + (curr.alokasiAnggaran || 0), 0);
    const totalRealisasi = filteredData.reduce((acc, curr) => acc + (curr.realisasiAnggaran || 0), 0);
    const overallRasio = totalAlokasi > 0 ? (totalRealisasi / totalAlokasi) * 100 : 0;

    // OPD and Program Counts
    const totalSkpds = Array.from(new Set(sipdRealizationData.map(item => item.namaSkpd))).filter(Boolean).length;
    const filteredSkpds = Array.from(new Set(filteredData.map(item => item.namaSkpd))).filter(Boolean).length;

    const totalPrograms = Array.from(new Set(sipdRealizationData.map(item => item.namaProgram))).filter(Boolean).length;
    const filteredPrograms = Array.from(new Set(filteredData.map(item => item.namaProgram))).filter(Boolean).length;

    return {
      totalAlokasi,
      totalRealisasi,
      overallRasio,
      filteredSkpds,
      totalSkpds,
      filteredPrograms,
      totalPrograms,
      totalCount: filteredData.length
    };
  }, [filteredData, sipdRealizationData]);

  // Group by Bidang Urusan for the Charts
  const chartData = useMemo(() => {
    const groups: Record<string, { name: string, alokasi: number, realisasi: number }> = {};
    
    filteredData.forEach(item => {
      const key = item.namaBidangUrusan || 'LAINNYA';
      if (!groups[key]) {
        groups[key] = { name: key, alokasi: 0, realisasi: 0 };
      }
      groups[key].alokasi += item.alokasiAnggaran || 0;
      groups[key].realisasi += item.realisasiAnggaran || 0;
    });

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#a855f7', '#ec4899'];
    return Object.values(groups).map((group, index) => {
      const rasio = group.alokasi > 0 ? (group.realisasi / group.alokasi) * 100 : 0;
      return {
        ...group,
        rasio,
        color: colors[index % colors.length]
      };
    }).filter(item => item.alokasi > 0);
  }, [filteredData]);

  // Grouping by SKPD for the progress list matching screenshot pattern
  const skpdProgressList = useMemo(() => {
    const groups: Record<string, { name: string, alokasi: number, realisasi: number }> = {};
    
    filteredData.forEach(item => {
      const key = item.namaSkpd || '(tanpa SKPD)';
      if (!groups[key]) {
        groups[key] = { name: key, alokasi: 0, realisasi: 0 };
      }
      groups[key].alokasi += item.alokasiAnggaran || 0;
      groups[key].realisasi += item.realisasiAnggaran || 0;
    });

    return Object.values(groups).map(group => {
      const rasio = group.alokasi > 0 ? (group.realisasi / group.alokasi) * 100 : 0;
      return {
        ...group,
        rasio
      };
    }).sort((a, b) => b.alokasi - a.alokasi); // Sorter: Largest budget allocation first
  }, [filteredData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-950/20 to-slate-900/30 border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            Integrasi Realisasi Belanja SIPD-RI
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Data pemantauan rincian belanja daerah berdasarkan format ekspor SIPD-RI sub-kegiatan & rekening belanja.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-indigo-400 font-bold shadow-inner">
          <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          <span>Format SIPD-RI Aktif</span>
        </div>
      </div>

      {/* FILTER PANEL SECTION (EXACTLY MATCHES SPREADSHEET SCREENSHOT SCHEMATIC) */}
      <div className="bg-slate-900/40 border border-white/10 p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
        {/* Soft atmospheric background blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
        
        {/* Filter Title & Action Reset Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
            <h3 className="font-extrabold text-white text-sm tracking-wide">Filter Data</h3>
          </div>
          <button 
            onClick={handleResetAllFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition-all font-mono shadow-sm shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Semua Filter
          </button>
        </div>

        {/* 4 Cascading Dropdowns matching image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* OPD Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">SKPD / OPD</label>
            <div className="relative">
              <select
                value={selectedSkpd}
                onChange={handleSkpdChange}
                className="w-full bg-[#020617]/80 hover:bg-[#020617] text-xs font-semibold text-slate-200 cursor-pointer outline-none border border-white/10 pl-3.5 pr-10 py-3 rounded-2xl transition-all focus:border-indigo-500 appearance-none shadow-inner"
              >
                <option value="Semua">— Semua —</option>
                {skpdList.filter(s => s !== 'Semua').map(skpd => (
                  <option key={skpd} value={skpd} className="bg-slate-900 text-slate-300">{skpd}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Program Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Program</label>
            <div className="relative">
              <select
                value={selectedProgram}
                onChange={handleProgramChange}
                disabled={programList.length <= 1}
                className="w-full bg-[#020617]/80 hover:bg-[#020617] text-xs font-semibold text-slate-200 cursor-pointer outline-none border border-white/10 pl-3.5 pr-10 py-3 rounded-2xl transition-all focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed appearance-none shadow-inner"
              >
                <option value="Semua">— Semua —</option>
                {programList.filter(p => p !== 'Semua').map(prog => (
                  <option key={prog} value={prog} className="bg-slate-900 text-slate-300">{prog}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Kegiatan Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Kegiatan</label>
            <div className="relative">
              <select
                value={selectedKegiatan}
                onChange={handleKegiatanChange}
                disabled={kegiatanList.length <= 1}
                className="w-full bg-[#020617]/80 hover:bg-[#020617] text-xs font-semibold text-slate-200 cursor-pointer outline-none border border-white/10 pl-3.5 pr-10 py-3 rounded-2xl transition-all focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed appearance-none shadow-inner"
              >
                <option value="Semua">— Semua —</option>
                {kegiatanList.filter(k => k !== 'Semua').map(keg => (
                  <option key={keg} value={keg} className="bg-slate-900 text-slate-300">{keg}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Sub Kegiatan Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Sub Kegiatan</label>
            <div className="relative">
              <select
                value={selectedSubKegiatan}
                onChange={handleSubKegiatanChange}
                disabled={subKegiatanList.length <= 1}
                className="w-full bg-[#020617]/80 hover:bg-[#020617] text-xs font-semibold text-slate-200 cursor-pointer outline-none border border-white/10 pl-3.5 pr-10 py-3 rounded-2xl transition-all focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed appearance-none shadow-inner"
              >
                <option value="Semua">— Semua —</option>
                {subKegiatanList.filter(sk => sk !== 'Semua').map(subKeg => (
                  <option key={subKeg} value={subKeg} className="bg-slate-900 text-slate-300">{subKeg}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* METRIC CARDS GRID (EXACTLY MATCHING SPREADSHEET SCREENSHOT CARD RATIOS & BADGES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        
        {/* Card 1: Total Alokasi */}
        <div className="bg-[#020617]/40 border border-white/10 p-6 md:p-7 rounded-3xl shadow-xl flex flex-col justify-between hover:border-indigo-500/20 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TOTAL ALOKASI ANGGARAN</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-white tracking-tight leading-none">
                {formatCompactIDR(stats.totalAlokasi)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              💰 TA {filteredData[0]?.tahun || '2026'}
            </span>
          </div>
        </div>

        {/* Card 2: Total Realisasi */}
        <div className="bg-[#020617]/40 border border-white/10 p-6 md:p-7 rounded-3xl shadow-xl flex flex-col justify-between hover:border-emerald-500/20 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TOTAL REALISASI</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-emerald-400 tracking-tight leading-none">
                {formatCompactIDR(stats.totalRealisasi)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              <Check className="w-3 h-3" /> Terserap
            </span>
          </div>
        </div>

        {/* Card 3: Capaian Realisasi */}
        <div className="bg-[#020617]/40 border border-white/10 p-6 md:p-7 rounded-3xl shadow-xl flex flex-col justify-between hover:border-sky-500/20 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-2xl rounded-full" />
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">CAPAIAN REALISASI</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-white tracking-tight leading-none">
                {stats.overallRasio.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            {(() => {
              const r = stats.overallRasio;
              const style = r >= 85 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : r >= 50 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20";
              const label = r >= 85 ? "● Tinggi" : r >= 50 ? "● Sedang" : "● Rendah";
              return (
                <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono", style)}>
                  {label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Card 4: OPD Counters */}
        <div className="bg-[#020617]/40 border border-white/10 p-6 md:p-7 rounded-3xl shadow-xl flex flex-col justify-between hover:border-indigo-500/20 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">OPD / PROGRAM</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-indigo-400 tracking-tight leading-none">
                {stats.filteredSkpds} <span className="text-slate-500 text-lg font-normal">/ {stats.filteredPrograms}</span>
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Unit Kerja
            </span>
          </div>
        </div>

      </div>

      {/* MID-PORT DATA VISUALIZATION TOGGLE & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Progres Realisasi per SKPD (Left side bento - Exact structure of the screenshot!) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col h-[400px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
              <h3 className="font-extrabold text-white text-sm tracking-wide">Progres Realisasi per SKPD</h3>
            </div>
            <span className="text-[9px] font-mono font-bold bg-white/5 text-slate-300 border border-white/15 px-2 py-1 rounded-lg">
              Sorted by Pagu
            </span>
          </div>

          <div className="overflow-y-auto space-y-4 pr-1 flex-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
            {skpdProgressList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Database className="w-8 h-8 opacity-40 mb-2" />
                <span className="text-xs">Tidak ada data penyerapan.</span>
              </div>
            ) : (
              skpdProgressList.map((item, idx) => (
                <div key={idx} className="space-y-1.5 scroll-mt-2">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="font-sans font-extrabold text-[11px] text-slate-200 tracking-wide uppercase truncate max-w-[80%]">
                      {item.name}
                    </span>
                    <span className="font-mono text-[11px] font-black text-rose-500">
                      {item.rasio.toFixed(1)}%
                    </span>
                  </div>

                  {/* Sleek red styled progress track bar matching spreadsheet visual perfectly */}
                  <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-650 to-red-500 hover:opacity-90 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, item.rasio)}%`,
                        backgroundColor: '#dc2626' // Standard red color matched to spreadsheet progress
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
                    <span>Rp {formatCompactIDR(item.realisasi)}</span>
                    <span>Pagu: Rp {formatCompactIDR(item.alokasi)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Composition Chart Side bento */}
        <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between h-[400px]">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Distribusi Pagu Bidang Urusan</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Proporsi persebaran alokasi pembiayaan dinas di KSB berdasarkan data aktif terfilter.
            </p>
          </div>

          <div className="h-[160px] w-full my-4 relative">
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="alokasi"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                      formatter={(v) => formatCurrencyExact(v as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 mx-auto top-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[9px] font-semibold text-slate-400 block uppercase tracking-wider">Total Terfilter</span>
                  <span className="text-xs font-black text-white">{formatCompactIDR(stats.totalAlokasi)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Tidak ada data distribusi.
              </div>
            )}
          </div>

          <div className="max-h-[110px] overflow-y-auto space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] pr-1">
            {chartData.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate font-semibold uppercase">{item.name}</span>
                </div>
                <span className="text-white font-mono font-bold">{item.rasio.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE DATA TABLE (DRILL-DOWN ENGINE) */}
      <div className="bg-slate-900/40 border border-white/10 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Table Header controls */}
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="font-extrabold text-base text-white">Daftar Buku Penyerapan Belanja SIPD-RI (Rincian Rekening)</h3>
            <p className="text-slate-400 text-xs mt-1">
              Ditemukan {filteredData.length} baris sub-kegiatan/rekening terdaftar sesuai ketentuan filter saat ini.
            </p>
          </div>

          {/* Table General Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari program, rekening, sub-kegiatan..." 
              className="w-full pl-12 pr-4 py-2.5 bg-[#020617]/50 border border-white/10 rounded-2xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-white transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* SIPD Table */}
        <div className="overflow-x-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#020617]/40 border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Informasi Kegiatan / Program / SKPD</th>
                <th className="px-6 py-4">Kode Rekening</th>
                <th className="px-6 py-4">Nama Rekening</th>
                <th className="px-6 py-4 text-right">Alokasi Pagu (IDR)</th>
                <th className="px-6 py-4 text-right">Realisasi (IDR)</th>
                <th className="px-6 py-4 text-center">Rasio (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 font-sans">
                    <Database className="w-8 h-8 mx-auto text-slate-600 mb-3 animate-pulse" />
                    Tidak ada baris data SIPD-RI yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const rasioIndex = item.alokasiAnggaran > 0 ? (item.realisasiAnggaran / item.alokasiAnggaran) * 100 : 0;
                  return (
                    <tr 
                      key={item.id || idx} 
                      className="hover:bg-white/[0.02] transition-colors odd:bg-white/[0.005]"
                    >
                      {/* SKPD & Program & SubKegiatan Info */}
                      <td className="px-6 py-4 font-sans max-w-sm">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 block truncate">
                            {item.namaSkpd}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#38bdf8] block truncate">
                            {item.namaProgram}
                          </span>
                          <span className="text-white font-medium block">
                            {item.namaSubKegiatan}
                          </span>
                          <div className="flex gap-1 text-[9px] text-slate-500 font-semibold font-mono">
                            <span>IDDaerah: {item.idDaerah}</span> • <span>TA: {item.tahun}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rekening Code */}
                      <td className="px-6 py-4 font-bold text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px]">
                          {item.kodeRekening}
                        </span>
                      </td>

                      {/* Rekening Name */}
                      <td className="px-6 py-4 font-sans text-slate-300 max-w-[180px] truncate" title={item.namaRekening}>
                        {item.namaRekening}
                      </td>

                      {/* Alokasi */}
                      <td className="px-6 py-4 text-right text-slate-400">
                        {formatCurrencyExact(item.alokasiAnggaran)}
                      </td>

                      {/* Realisasi */}
                      <td className="px-6 py-4 text-right text-emerald-450 text-emerald-400 font-bold">
                        {formatCurrencyExact(item.realisasiAnggaran)}
                      </td>

                      {/* Rasio Progress */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border inline-block",
                          rasioIndex >= 85 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : rasioIndex >= 50 
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                              : rasioIndex > 0 
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                : "bg-slate-500/10 text-slate-400 border-white/10"
                        )}>
                          {formatPercentExact(rasioIndex)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
