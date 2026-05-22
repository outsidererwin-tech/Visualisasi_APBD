import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Database, RefreshCw, CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Search, ArrowUpRight, Scale, Info, HelpCircle, FileSpreadsheet, PlusCircle,
  Calendar, Check, AlertTriangle, FileText, Ban
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SikdRecord } from '../../types';
import { formatCurrency, formatBillions } from '../../lib/formatters';
import { MONTHS } from '../../lib/constants';

interface DataSIKDViewProps {
  sikdData: SikdRecord[];
}

export function DataSIKDView({ 
  sikdData = []
}: DataSIKDViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedDanaType, setSelectedDanaType] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique months list for filtering
  const availableMonths = useMemo(() => {
    const list = Array.from(new Set(sikdData.map(item => item.periode || 'Semua')));
    const filteredList = list.filter(m => m && m.trim() !== '' && m !== 'Semua');
    const sorted = filteredList.sort((a, b) => {
      return MONTHS.indexOf(a) - MONTHS.indexOf(b);
    });
    return ['Semua', ...sorted];
  }, [sikdData]);

  // Get unique kinds of funds for filtering
  const availableDanaTypes = useMemo(() => {
    const list = Array.from(new Set(sikdData.map(item => item.jenisDana || '').filter(d => d && d.trim() !== '' && d !== 'Semua')));
    return ['Semua', ...list];
  }, [sikdData]);

  // Filter SIKD Data by Month, Fund, Search
  const filteredData = useMemo(() => {
    let result = [...sikdData];
    
    if (selectedMonth !== 'Semua') {
      result = result.filter(item => item.periode === selectedMonth);
    }
    
    if (selectedDanaType !== 'Semua') {
      result = result.filter(item => item.jenisDana === selectedDanaType);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.uraian || '').toLowerCase().includes(q) || 
        (item.jenisDana || '').toLowerCase().includes(q) ||
        (item.status || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [sikdData, selectedMonth, selectedDanaType, searchQuery]);

  // Calculations of metrics
  const stats = useMemo(() => {
    const totalKotor = filteredData.reduce((acc, curr) => acc + (curr.nilaiKotor || 0), 0);
    const totalPotongan = filteredData.reduce((acc, curr) => acc + (curr.potongan || 0), 0);
    const totalBersih = filteredData.reduce((acc, curr) => acc + (curr.nilaiBersih || 0), 0);
    const totalTunda = filteredData.reduce((acc, curr) => acc + (curr.tunda || 0), 0);
    
    const rasioPotongan = totalKotor > 0 ? (totalPotongan / totalKotor) * 100 : 0;
    const rasioPenyaluran = totalKotor > 0 ? (totalBersih / totalKotor) * 100 : 0;

    return {
      totalKotor,
      totalPotongan,
      totalBersih,
      totalTunda,
      rasioPotongan,
      rasioPenyaluran
    };
  }, [filteredData]);

  // Composition data for Pie/Donut Chart (Dana Type vs Nilai Bersih)
  const compositionData = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      const key = curr.jenisDana || 'Lainnya';
      acc[key] = (acc[key] || 0) + (curr.nilaiBersih || 0);
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
    
    return Object.keys(grouped).map((key, index) => ({
      name: key,
      value: grouped[key],
      color: colors[index % colors.length]
    })).filter(item => item.value > 0);
  }, [filteredData]);

  // Monthly trend grouped by Period
  const trendData = useMemo(() => {
    const grouped = sikdData.reduce((acc, curr) => {
      const key = curr.periode || 'Semua';
      if (!acc[key]) {
        acc[key] = { periode: key, kotor: 0, bersih: 0, potongan: 0, tunda: 0 };
      }
      acc[key].kotor += (curr.nilaiKotor || 0);
      acc[key].bersih += (curr.nilaiBersih || 0);
      acc[key].potongan += (curr.potongan || 0);
      acc[key].tunda += (curr.tunda || 0);
      return acc;
    }, {} as Record<string, { periode: string, kotor: number, bersih: number, potongan: number, tunda: number }>);

    return Object.values(grouped).sort((a, b) => {
      return MONTHS.indexOf(a.periode) - MONTHS.indexOf(b.periode);
    });
  }, [sikdData]);

  // Status breakdown metrics
  const statusCounts = useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      const key = curr.status || 'Lainnya';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).map(key => ({
      status: key,
      count: counts[key]
    }));
  }, [filteredData]);

  // Helper to dynamically calculate font size based on number length to prevent overflow/clipping
  const getDynamicStyle = (valueStr: string) => {
    const len = valueStr.length;
    let fontSize = '1.75rem'; // Default: ~28px (text-2xl)
    if (len > 22) {
      fontSize = '0.85rem';  // ~13.6px
    } else if (len > 18) {
      fontSize = '1.05rem';  // ~16.8px
    } else if (len > 15) {
      fontSize = '1.2rem';   // ~19.2px -> E.g. "Rp 227.035.787.222" (length 18)
    } else if (len > 12) {
      fontSize = '1.4rem';   // ~22.4px
    } else if (len > 10) {
      fontSize = '1.6rem';   // ~25.6px
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Nilai Kotor */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
            <TrendingUp className="w-24 h-24 text-white" />
          </div>
          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Total Nilai Kotor (Gross)</span>
          <p 
            className="font-black text-amber-500 mt-1.5 tracking-tight" 
            style={getDynamicStyle(formatCurrency(stats.totalKotor))}
            title={formatCurrency(stats.totalKotor)}
          >
            {formatCurrency(stats.totalKotor)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-400">
            Nilai awal transfer sebelum potongan pajak/biaya
          </div>
        </div>

        {/* Total Potongan */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
            <TrendingDown className="w-24 h-24 text-white" />
          </div>
          <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest">Total Potongan / Pajak</span>
          <p 
            className="font-black text-rose-400 mt-1.5 tracking-tight" 
            style={getDynamicStyle(formatCurrency(stats.totalPotongan))}
            title={formatCurrency(stats.totalPotongan)}
          >
            {formatCurrency(stats.totalPotongan)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-400">
            Rasio pemotongan: <span className="text-rose-400 font-bold font-mono">{stats.rasioPotongan.toFixed(2)}%</span>
          </div>
        </div>

        {/* Total Nilai Bersih */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
            <CheckCircle2 className="w-24 h-24 text-white" />
          </div>
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">Total Nilai Bersih (Netto)</span>
          <p 
            className="font-black text-emerald-400 mt-1.5 tracking-tight" 
            style={getDynamicStyle(formatCurrency(stats.totalBersih))}
            title={formatCurrency(stats.totalBersih)}
          >
            {formatCurrency(stats.totalBersih)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-400">
            Rasio bersih tersalurkan: <span className="text-emerald-400 font-bold font-mono">{stats.rasioPenyaluran.toFixed(2)}%</span>
          </div>
        </div>

        {/* Total Tunda */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-white" />
          </div>
          <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest">Total Dana Ditunda (Pending)</span>
          <p 
            className="font-black text-sky-400 mt-1.5 tracking-tight" 
            style={getDynamicStyle(formatCurrency(stats.totalTunda))}
            title={formatCurrency(stats.totalTunda)}
          >
            {formatCurrency(stats.totalTunda)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-400">
            Sisa alokasi yang ditunda penyalurannya
          </div>
        </div>

      </div>

      {/* Charts & Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SIKD Monthly Trends */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-white/10 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-white">Tren Aliran Dana SIKD Bulanan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Komparasi nilai kotor, nilai bersih, potongan dan penundaan per periode.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Grafik Aliran</span>
          </div>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorKotor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBersih" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="periode" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis width={115} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBillions(v)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: 'white' }}
                  formatter={(v) => formatCurrency(v as number)}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area name="Nilai Kotor SIKD" type="monotone" dataKey="kotor" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorKotor)" />
                <Area name="Nilai Bersih SIKD" type="monotone" dataKey="bersih" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBersih)" />
                <Line name="Dana Ditunda (Tunda)" type="monotone" dataKey="tunda" stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#38bdf8', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Composition Donut Chart SIKD */}
        <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">Komposisi Menurut Jenis Dana</h3>
            <p className="text-xs text-slate-500 mt-0.5">Proporsi pembagian Nilai Bersih dari jenis dana transfer yang terunggah.</p>
          </div>
          {compositionData.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {compositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends details */}
              <div className="space-y-1.5 w-full mt-4 max-h-[120px] overflow-y-auto pr-1">
                {compositionData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[140px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-white font-bold font-mono text-slate-300">{formatBillions(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              Tidak ada data komposisi.
            </div>
          )}
        </div>

      </div>

      {/* SIKD Filtered Distribution & Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Status Distribution Summary card */}
        <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-6 md:col-span-1">
          <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Distribusi Status Penyaluran SIKD
          </h4>
          <div className="space-y-3">
            {statusCounts.length > 0 ? (
              statusCounts.map((s, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      (s.status.toLowerCase().includes('salur') || s.status.toLowerCase().includes('selesai') || s.status.toLowerCase().includes('lengkap')) ? "bg-emerald-400" :
                      (s.status.toLowerCase().includes('tunda') || s.status.toLowerCase().includes('belum')) ? "bg-amber-400" : "bg-indigo-400"
                    )} />
                    <span className="text-xs text-slate-200 font-bold">{s.status}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-black text-white font-mono">{s.count} transaksi</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Belum ada rincian data transaksi.</p>
            )}
          </div>
        </div>

        {/* LKT compliance status card */}
        <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-6 md:col-span-2">
          <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            Sorotan Kepatuhan LKT (Laporan Keuangan Tahunan) SIKD
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 font-black uppercase">Dokumen LKT Lengkap</span>
              <p className="text-2xl font-mono font-black text-emerald-300">
                {filteredData.filter(d => (d.lkt || '').toLowerCase().includes('lengkap')).length}
              </p>
              <p className="text-[11px] text-slate-400">Transaksi SIKD dengan kelengkapan dokumen LKT yang optimal.</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
              <span className="text-[10px] text-amber-400 font-black uppercase">Perlu Review APIP / Belum Lengkap</span>
              <p className="text-2xl font-mono font-black text-amber-300">
                {filteredData.filter(d => !(d.lkt || '').toLowerCase().includes('lengkap')).length}
              </p>
              <p className="text-[11px] text-slate-400">Memerlukan atensi berkas pendukung atau verifikasi Aparat Pengawas.</p>
            </div>
          </div>
        </div>

      </div>

      {/* SIKD Data Table */}
      <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div>
            <h3 className="font-bold text-lg text-white">Database Unggahan Lembar SIKD</h3>
            <p className="text-slate-400 text-xs mt-1">Total rincian {filteredData.length} transaksi aliran dana SIKD luring terdaftar pada sistem.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* Filter Monthly */}
            <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-2 rounded-xl border border-white/15">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Periode</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-300 cursor-pointer outline-none shrink-0"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m} className="bg-slate-900">{m}</option>
                ))}
              </select>
            </div>

            {/* Filter Jenis Dana */}
            <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-2 rounded-xl border border-white/15">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Dana</span>
              <select 
                value={selectedDanaType}
                onChange={(e) => setSelectedDanaType(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-300 cursor-pointer outline-none shrink-0 max-w-[140px]"
              >
                {availableDanaTypes.map(d => (
                  <option key={d} value={d} className="bg-slate-900">{d}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari uraian atau status..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredData.length > 0 ? (
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300 table-auto min-w-[900px]">
              <thead className="bg-[#1e293b]/50 text-slate-300 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Jenis Dana</th>
                  <th className="px-4 py-4">Uraian</th>
                  <th className="px-3 py-4 text-center">Periode</th>
                  <th className="px-4 py-4 text-right">Nilai Kotor</th>
                  <th className="px-4 py-4 text-right">Potongan</th>
                  <th className="px-4 py-4 text-right">Nilai Bersih</th>
                  <th className="px-4 py-4 text-right">Tunda</th>
                  <th className="px-4 py-4 text-center font-bold">Status</th>
                  <th className="px-4 py-4 text-center">LKT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/5">
                {filteredData.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-white/5 transition-all">
                    <td className="px-4 py-4 font-bold text-slate-300 font-mono tracking-tight whitespace-nowrap">{item.tanggal}</td>
                    <td className="px-4 py-4 font-bold text-indigo-400">{item.jenisDana}</td>
                    <td className="px-4 py-4 font-medium text-white max-w-sm" title={item.uraian}>{item.uraian}</td>
                    <td className="px-3 py-4 text-center font-semibold text-slate-400 whitespace-nowrap">{item.periode}</td>
                    <td className="px-4 py-4 text-right font-mono text-slate-300 font-medium">{formatCurrency(item.nilaiKotor || 0)}</td>
                    <td className="px-4 py-4 text-right font-mono text-rose-400 font-medium">{formatCurrency(item.potongan || 0)}</td>
                    <td className="px-4 py-4 text-right font-mono text-emerald-400 font-bold">{formatCurrency(item.nilaiBersih || 0)}</td>
                    <td className="px-4 py-4 text-right font-mono text-sky-450 text-sky-400 font-medium">{formatCurrency(item.tunda || 0)}</td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-extrabold border inline-block text-center",
                        (item.status || '').toLowerCase().includes('salur') && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        (item.status || '').toLowerCase().includes('tunda') && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        (item.status || '').toLowerCase().includes('gagal') && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      )}>
                        {item.status || 'Salur'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold inline-block text-center",
                        (item.lkt || '').toLowerCase().includes('lengkap') ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                      )}>
                        {item.lkt || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Search className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-sm">Transaksi tidak ditemukan.</p>
          </div>
        )}
      </div>

    </div>
  );
}
