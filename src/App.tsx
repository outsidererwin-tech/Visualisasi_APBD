import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Search, 
  Settings, 
  Download,
  CheckCircle2,
  Info,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { APBDData } from './types';
import { MOCK_DATA } from './mockData';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function App() {
  const [data, setData] = useState<APBDData[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Statistics calculations
  const stats = useMemo(() => {
    const totalAnggaran = data.reduce((acc, curr) => acc + curr.anggaran, 0);
    const totalRealisasi = data.reduce((acc, curr) => acc + curr.realisasi, 0);
    const overallPersentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;

    return { totalAnggaran, totalRealisasi, overallPersentase };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.akun.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const fetchData = async (url: string) => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengambil data dari Google Sheets');
      const json = await response.json();
      
      if (Array.isArray(json)) {
        setData(json);
      } else {
        throw new Error('Format data tidak valid');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatBillions = (value: number) => {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T';
    if (value >= 1e9) return (value / 1e9).toFixed(1) + ' M';
    return formatCurrency(value);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-6 z-30 w-full max-w-7xl mx-auto px-6 py-4 mb-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">APBD Dashboard</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Provinsi / Kota Monitor • Live GAS Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors relative border border-transparent hover:border-white/20"
          >
            <Settings className="w-5 h-5 text-slate-300" />
            {appsScriptUrl && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />}
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Database className="w-6 h-6 text-indigo-400" />
                      Sumber Data Google Sheets
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Konfigurasikan integrasi real-time antara Google Sheets dan dashboard Anda.</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="Contoh: https://script.google.com/macros/s/..."
                    className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-500"
                  />
                  <button 
                    onClick={() => fetchData(appsScriptUrl)}
                    disabled={!appsScriptUrl || loading}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {loading ? 'Menghubungkan...' : 'Update Koneksi'}
                  </button>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-rose-500/10 text-rose-300 rounded-xl text-sm border border-rose-500/20 flex items-center gap-3">
                    <Info className="w-5 h-5" />
                    Error: {error}
                  </div>
                )}

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Snippet Apps Script (doGet)</h3>
                    <span className="text-[10px] text-emerald-400 font-mono">Status: Stable</span>
                  </div>
                  <pre className="text-[11px] bg-black/40 text-slate-300 p-6 rounded-2xl overflow-x-auto whitespace-pre font-mono border border-white/5">
{`function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data APBD");
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  
  const result = rows.map(row => ({
    akun: row[0],
    anggaran: row[1],
    realisasi: row[2],
    persentase: row[3]
  }));
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Anggaran" 
            value={formatBillions(stats.totalAnggaran)}
            icon={<Wallet className="w-6 h-6" />}
            color="indigo"
          />
          <StatCard 
            title="Total Realisasi" 
            value={formatBillions(stats.totalRealisasi)}
            icon={<CreditCard className="w-6 h-6" />}
            color="emerald"
            percentage={stats.overallPersentase}
          />
          <StatCard 
            title="Efektivitas (%)" 
            value={`${stats.overallPersentase.toFixed(2)}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="rose"
            progressBar={stats.overallPersentase}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl text-white">Analisis Anggaran vs Realisasi</h3>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-sm" /> Anggaran
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> Realisasi
                </div>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="akun" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                    interval={0}
                    height={60}
                    tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                    tickFormatter={(val) => formatBillions(val)}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1e293b]/90 backdrop-blur-xl p-5 shadow-2xl border border-white/10 rounded-2xl">
                            <p className="text-sm font-bold mb-3 text-white">{payload[0].payload.akun}</p>
                            <div className="space-y-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Anggaran</span>
                                <span className="text-sm text-indigo-400 font-mono font-bold">{formatCurrency(payload[0].value as number)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Realisasi</span>
                                <span className="text-sm text-emerald-400 font-mono font-bold">{formatCurrency(payload[1].value as number)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="anggaran" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={35} />
                  <Bar dataKey="realisasi" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Info */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full">
              <h3 className="font-bold text-slate-200 mb-6 flex items-center justify-between">
                <span>Top Regional Performance</span>
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-400">MAY 2024</span>
              </h3>
              <div className="flex-1 flex flex-col gap-6">
                {data.slice(0, 4).map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs items-end">
                      <span className="text-slate-300 font-medium truncate pr-4">{item.akun}</span>
                      <span className="text-slate-100 font-bold font-mono">{item.persentase}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.persentase}%` }}
                        className={cn(
                          "h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]",
                          i === 0 ? "bg-indigo-500" : i === 1 ? "bg-purple-500" : i === 2 ? "bg-emerald-500" : "bg-slate-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex items-center gap-5 group hover:bg-indigo-600/30 transition-all cursor-pointer">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-indigo-200 mb-1">Google Apps Script</h3>
                <p className="text-[10px] text-indigo-300 leading-tight">Continuous monitoring active. Data source changes trigger automatic UI refresh.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(129,140,248,0.8)]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Updated Table */}
        <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Google Sheet Data View</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Daftar Lengkap Akun Pendapatan & Belanja</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari transaksi atau nama akun..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <tr className="border-b border-white/10">
                  <th className="px-8 py-5">Informasi Akun</th>
                  <th className="px-8 py-5 text-right font-semibold">Pagu Anggaran</th>
                  <th className="px-8 py-5 text-right font-semibold">Realisasi Saat Ini</th>
                  <th className="px-8 py-5 text-center font-semibold">Progress</th>
                  <th className="px-8 py-5 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-[13px] border border-indigo-500/20 shadow-inner">
                          {item.akun[0]}
                        </div>
                        <span className="text-sm font-bold text-slate-200 tracking-tight group-hover:text-white transition-colors">{item.akun}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-xs text-slate-400">
                      {formatCurrency(item.anggaran)}
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-xs text-emerald-400 font-bold">
                      {formatCurrency(item.realisasi)}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black text-slate-300">{item.persentase}%</span>
                        <div className="w-28 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(item.persentase, 100)}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              item.persentase >= 60 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : item.persentase >= 30 ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center">
                        {item.persentase >= 60 ? (
                          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-400/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-400/20">
                            <Info className="w-3.5 h-3.5" /> Berjalan
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex justify-between items-center text-[10px] text-slate-500 font-bold bg-black/40 backdrop-blur-lg px-8 py-4 border-t border-white/5 uppercase tracking-wider">
            <div>SYSTEM STATUS: <span className="text-emerald-500">ALL SERVICES OPERATIONAL</span></div>
            <div className="flex gap-6">
              <span>SYNC LATENCY: 0.42s</span>
              <span>ENVIRONMENT: PRODUCTION-01</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, percentage, progressBar }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: 'indigo' | 'emerald' | 'rose';
  percentage?: number;
  progressBar?: number;
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 ring-indigo-500/5 shadow-indigo-500/10',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/5 shadow-emerald-500/10',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 ring-rose-500/5 shadow-rose-500/10'
  };

  const accentColors = {
    indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
    emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="bg-white/5 backdrop-blur-md p-7 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden group transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl border ring-8 transition-all group-hover:rotate-6 group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        {percentage !== undefined && (
          <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">LIVE SYNC</span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</p>
        <h4 className="text-3xl font-black tracking-tight text-white">{value}</h4>
      </div>
      
      {progressBar !== undefined && (
        <div className="mt-6">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
            <span>Utilization Rate</span>
            <span>{progressBar.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressBar, 100)}%` }}
              className={cn("h-full rounded-full", accentColors[color])}
            />
          </div>
        </div>
      )}

      {/* Decorative Blur */}
      <div className={cn("absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-opacity group-hover:opacity-30", 
        color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500')} />
    </motion.div>
  );
}
