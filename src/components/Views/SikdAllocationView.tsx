import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Database, TrendingUp, Search, ArrowUpRight, Scale, Info, 
  HelpCircle, Percent, Coins, LayoutGrid, Layers, ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SikdAllocationRecord } from '../../types';
import { formatBillions } from '../../lib/formatters';

interface SikdAllocationViewProps {
  sikdAllocationData: SikdAllocationRecord[];
}

// Custom formatters to preserve absolute decimal precision
export const formatCurrencyExact = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4 // Keeps up to 4 decimal places, avoids aggressive rounding
  }).format(value);
};

export const formatPercentExact = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value) + '%';
};

export function SikdAllocationView({ 
  sikdAllocationData = [] 
}: SikdAllocationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCode, setSelectedParentCode] = useState<string>('Semua');

  // Filter allocation data by Search Query and Parent level prefix
  const filteredData = useMemo(() => {
    let result = [...sikdAllocationData];

    if (selectedParentCode !== 'Semua') {
      // Filter by broad groups (e.g., starting with 611 or 612)
      result = result.filter(item => item.kode.startsWith(selectedParentCode));
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.uraian || '').toLowerCase().includes(q) || 
        (item.kode || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [sikdAllocationData, selectedParentCode, searchQuery]);

  // Aggregate stats based on root-level or top parent entries
  // to avoid double counting nested children in total metrics, or calculate based on select
  const stats = useMemo(() => {
    // If we've filtered, represent filtered sum.
    // If showing full list, sum only the dynamic root items to avoid double addition.
    const isShowingAll = searchQuery.trim() === '' && selectedParentCode === 'Semua';
    let targetList = filteredData;
    
    if (isShowingAll) {
      // Find all root parent items dynamically to get the true total without double counting
      targetList = sikdAllocationData.filter(item => {
        if (/^\d{3}$/.test(item.kode)) return false;
        const hasParent = sikdAllocationData.some(other => {
          if (other.kode === item.kode) return false;
          if (/^\d{3}$/.test(other.kode)) return false;
          return item.kode.startsWith(other.kode) && other.kode.length < item.kode.length;
        });
        return !hasParent;
      });
      if (targetList.length === 0) {
        targetList = filteredData; // fallback
      }
    }

    const totalPagu = targetList.reduce((acc, curr) => acc + (curr.pagu || 0), 0);
    const totalRealisasi = targetList.reduce((acc, curr) => acc + (curr.realisasi || 0), 0);
    const overallRasio = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    return {
      totalPagu,
      totalRealisasi,
      overallRasio,
      totalCount: filteredData.length
    };
  }, [filteredData, sikdAllocationData, searchQuery, selectedParentCode]);

  // Dynamic groups for Chart: 
  // If there are multiple root parent categories (e.g., DBH, DAU, Dana Desa), use those root categories.
  // Otherwise, use the sub-categories of length 4 under the single parent category.
  const subCategoryChartData = useMemo(() => {
    const rootNodes = sikdAllocationData.filter(item => {
      if (/^\d{3}$/.test(item.kode)) return false;
      const hasParent = sikdAllocationData.some(other => {
        if (other.kode === item.kode) return false;
        if (/^\d{3}$/.test(other.kode)) return false;
        return item.kode.startsWith(other.kode) && other.kode.length < item.kode.length;
      });
      return !hasParent;
    });

    const useRootNodes = rootNodes.length > 1;
    const chartSourceItems = useRootNodes 
      ? rootNodes 
      : sikdAllocationData.filter(item => item.kode.length === 4);

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#a855f7', '#ec4899'];
    return chartSourceItems.map((item, index) => ({
      name: item.uraian.replace('Transfer ', '').replace('Dana Bagi Hasil ', '').replace('Dana Alokasi ', ''),
      pagu: item.pagu,
      realisasi: item.realisasi,
      rasio: item.rasio,
      color: colors[index % colors.length]
    })).filter(item => item.pagu > 0);
  }, [sikdAllocationData]);

  // Helper to identify hierarchy level based on code structure
  const getHierarchyConfig = (kode: string) => {
    const len = kode.length;
    if (len === 2) {
      return {
        bg: 'bg-indigo-950/45 hover:bg-indigo-950/60 border-indigo-500/20 text-indigo-200',
        padding: 'pl-4',
        font: 'font-black text-white text-sm sm:text-base uppercase tracking-wider',
        isParent: true,
        labelStyle: 'text-indigo-400 font-extrabold text-xs tracking-wider'
      };
    } else if (len === 4) {
      return {
        bg: 'bg-slate-900/40 hover:bg-slate-900/65 border-white/5 text-slate-100',
        padding: 'pl-8 sm:pl-12',
        font: 'font-extrabold text-[#38bdf8] text-xs sm:text-sm',
        isParent: false,
        labelStyle: 'text-sky-400 font-bold text-[10px]'
      };
    } else if (len === 6) {
      return {
        bg: 'bg-slate-950/20 hover:bg-slate-950/40 border-transparent text-slate-300',
        padding: 'pl-12 sm:pl-20',
        font: 'font-medium text-slate-200 text-xs sm:text-sm',
        isParent: false,
        labelStyle: 'text-slate-400 font-normal text-[9px]'
      };
    } else {
      // Sub detail items (e.g. "001", "002")
      return {
        bg: 'bg-slate-950/50 hover:bg-slate-950/70 border-l-2 border-emerald-500/30 text-emerald-100/90',
        padding: 'pl-16 sm:pl-28',
        font: 'font-normal italic text-slate-400 text-xs',
        isParent: false,
        labelStyle: 'text-emerald-500/70 font-semibold text-[9px]'
      };
    }
  };

  const getDynamicStyle = (valueStr: string) => {
    const len = valueStr.length;
    let fontSize = '1.75rem'; 
    if (len > 22) {
      fontSize = '0.9rem';  
    } else if (len > 18) {
      fontSize = '1.05rem';  
    } else if (len > 15) {
      fontSize = '1.2rem';   
    } else if (len > 12) {
      fontSize = '1.4rem';   
    }
    return {
      fontSize,
      whiteSpace: 'nowrap' as const,
      display: 'block',
      overflow: 'visible'
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SIKD Bento Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Pagu */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1e1b4b]/60 to-[#0f0e30]/80 p-8 border border-indigo-500/10 shadow-xl group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl group-hover:bg-indigo-300/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
              <Coins className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
              PAGU ALOKASI
            </span>
          </div>
          <div>
            <span 
              style={getDynamicStyle(formatCurrencyExact(stats.totalPagu))}
              className="font-black text-white tracking-tight"
            >
              {formatCurrencyExact(stats.totalPagu)}
            </span>
            <p className="text-slate-400 text-xs font-semibold mt-2.5">Total alokasi pagu dana bagi hasil</p>
          </div>
        </div>

        {/* Total Realisasi */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#064e3b]/40 to-[#022c22]/70 p-8 border border-emerald-500/10 shadow-xl group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl group-hover:bg-emerald-300/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              REALISASI SALUR
            </span>
          </div>
          <div>
            <span 
              style={getDynamicStyle(formatCurrencyExact(stats.totalRealisasi))}
              className="font-black text-[#10b981] tracking-tight"
            >
              {formatCurrencyExact(stats.totalRealisasi)}
            </span>
            <p className="text-slate-400 text-xs font-semibold mt-2.5 font-sans">Total penyaluran yang sudah direalisasi</p>
          </div>
        </div>

        {/* Rata-Rata Rasio */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1e293b]/60 to-[#0f172a]/80 p-8 border border-slate-500/10 shadow-xl group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-slate-500/5 blur-3xl group-hover:bg-slate-300/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <Percent className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-slate-500/10 border border-slate-500/20 px-2.5 py-1 rounded-full">
              RASIO PENYERAPAN
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {formatPercentExact(stats.overallRasio)}
              </span>
            </div>
            
            {/* Minimal Progress Line */}
            <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, stats.overallRasio)}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs font-semibold mt-2">Efisiensi penyaluran APBD SIKD</p>
          </div>
        </div>

      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Realisasi and comparison chart */}
        <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="font-bold text-lg text-white">Komparasi Pagu vs Realisasi Dana Bagi Hasil</h3>
              <p className="text-slate-400 text-xs mt-1">Sifat anggaran transfer langsung berdasar rincian sub-klaster kelompok DBH.</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subCategoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis width={110} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBillions(v)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  formatter={(v, name) => [formatCurrencyExact(v as number), name === 'pagu' ? 'Pagu' : 'Realisasi']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                <Bar name="Pagu Alokasi" dataKey="pagu" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar name="Realisasi Salur" dataKey="realisasi" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut percentage distribution */}
        <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">Komposisi Pagu Alokasi</h3>
            <p className="text-slate-400 text-xs mt-1">Distribusi proporsi anggaran dana bagi hasil di Sumbawa Barat.</p>
          </div>

          <div className="h-[210px] w-full my-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subCategoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="pagu"
                >
                  {subCategoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                  formatter={(v) => formatCurrencyExact(v as number)}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Middle label inside Donut */}
            <div className="absolute inset-x-0 mx-auto top-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Total</span>
              <span className="text-xs font-black text-white">{formatBillions(stats.totalPagu)}</span>
            </div>
          </div>

          {/* Micro Legend block */}
          <div className="max-h-[140px] overflow-y-auto space-y-2.5 [scrollbar-width:none] [-ms-overflow-style:none]">
            {subCategoryChartData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate font-semibold">{item.name}</span>
                </div>
                <span className="text-white font-mono font-bold">{formatPercentExact(item.rasio)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SIKD Data Table */}
      <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="font-bold text-lg text-white">Daftar Buku Pagu, Alokasi & Realisasi SIKD</h3>
            <p className="text-slate-400 text-xs mt-1">Total rincian {filteredData.length} baris klasifikasi sub-rekening Alokasi SIKD terdaftar.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Quick Filter Selection */}
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-3">Filter</span>
              <select 
                value={selectedParentCode} 
                onChange={(e) => setSelectedParentCode(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-200 cursor-pointer outline-none border-l border-white/10 pl-3 pr-6"
              >
                <option value="Semua" className="bg-[#1e293b]">Semua Kelompok</option>
                <option value="6111" className="bg-[#1e293b]">DBH PPh Perorangan (6111)</option>
                <option value="6112" className="bg-[#1e293b]">DBH PBB (6112)</option>
                <option value="6123" className="bg-[#1e293b]">DBH SDA Pertambangan (6123)</option>
                <option value="6124" className="bg-[#1e293b]">DBH SDA Panas Bumi (6124)</option>
                <option value="6125" className="bg-[#1e293b]">DBH SDA Kehutanan (6125)</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari kode atau uraian..." 
                className="w-full pl-12 pr-6 py-2.5 bg-[#020617] border border-white/10 rounded-2xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-white transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Hierarchical Indentation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#020617]/50 border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Kode Akun</th>
                <th className="px-6 py-4">Uraian Klasifikasi Rekening</th>
                <th className="px-6 py-4 text-right">Nilai Pagu (Alokasi)</th>
                <th className="px-6 py-4 text-right">Nilai Realisasi</th>
                <th className="px-6 py-4 text-center">Rasio (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500 font-sans text-xs">
                    <Database className="w-8 h-8 mx-auto text-slate-600 mb-3 animate-pulse" />
                    Tidak ada baris data Alokasi SIKD yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const cfg = getHierarchyConfig(item.kode);
                  return (
                    <tr 
                      key={item.id || idx} 
                      className={cn(
                        "transition-all border-b border-white/5",
                        cfg.bg
                      )}
                    >
                      {/* Kode */}
                      <td className="px-6 py-4 text-xs font-black">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px]", 
                            cfg.isParent ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-slate-300"
                          )}>
                            {item.kode}
                          </span>
                        </div>
                      </td>

                      {/* Uraian with indentation applied to margin/padding */}
                      <td className={cn("px-6 py-4 font-sans text-xs min-w-[280px]", cfg.font, cfg.padding)}>
                        <div className="flex flex-col">
                          <span>{item.uraian}</span>
                          <span className={cfg.labelStyle}>
                            {item.kode.length === 2 ? 'Parent Category' : item.kode.length === 4 ? 'Main Group' : item.kode.length === 6 ? 'Sub-Group' : 'Direct Detail'}
                          </span>
                        </div>
                      </td>

                      {/* Pagu */}
                      <td className="px-6 py-4 text-right text-xs">
                        {formatCurrencyExact(item.pagu)}
                      </td>

                      {/* Realisasi */}
                      <td className="px-6 py-4 text-right text-xs font-black">
                        <span className={item.realisasi > 0 ? "text-emerald-400" : "text-slate-500"}>
                          {formatCurrencyExact(item.realisasi)}
                        </span>
                      </td>

                      {/* Rasio */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                          item.rasio >= 80 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : item.rasio > 0 
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                              : "bg-slate-500/10 text-slate-400 border-white/10"
                        )}>
                          {formatPercentExact(item.rasio)}
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
