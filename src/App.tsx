import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Wallet, CreditCard, Search, Calendar, Info, Database, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAPBDData } from './hooks/useAPBDData';
import { formatCurrency, formatBillions, formatPercentage } from './lib/formatters';
import { DashboardHeader } from './components/Layout/DashboardHeader';
import { Sidebar } from './components/Layout/Sidebar';
import { StatCard } from './components/Stats/StatCard';
import { CompositionSummary } from './components/Charts/CompositionSummary';
import { DataScraper } from './components/Tools/DataScraper';
import { DataSIKDView } from './components/Views/DataSIKDView';
import { SikdAllocationView } from './components/Views/SikdAllocationView';
import { TABS } from './lib/constants';
import { AuthModal } from './components/Modals/AuthModal';

export default function App() {
  const {
    loading,
    error,
    appsScriptUrl,
    setAppsScriptUrl,
    selectedMonth,
    setSelectedMonth,
    activeTab,
    setActiveTab,
    availableMonths,
    trendData,
    currentViewData,
    stats,
    compositionData,
    refreshData,
    refreshSikdData,
    importNewData,
    importNewSikdData,
    importNewSikdAllocationData,
    resetToMockData,
    resetSikdToMockData,
    resetSikdAllocationToMockData,
    sikdData,
    sikdAllocationData
  } = useAPBDData();

  const [searchQuery, setSearchQuery] = useState('');

  // States for Admin Authentication Modal
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'pendapatan' | 'belanja' | 'pembiayaan' | 'tambah-data' | 'data-sikd' | 'alokasi-realisasi-sikd' | null>(null);

  const handleTabChange = (tab: 'pendapatan' | 'belanja' | 'pembiayaan' | 'tambah-data' | 'data-sikd' | 'alokasi-realisasi-sikd') => {
    if (tab === 'tambah-data') {
      // Selalu tanyai otentikasi setiap kali mengklik menu Tambah Data
      setPendingTab(tab);
      setShowAuthModal(true);
    } else {
      setActiveTab(tab);
      // Hapus status otentikasi saat meninggalkan menu Tambah Data agar aman
      setIsAuthenticated(false);
      sessionStorage.removeItem('bpkad_auth_session');
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('bpkad_auth_session', 'true');
    setShowAuthModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const filteredItems = currentViewData.filter(item => 
    item.akun.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen text-slate-100 font-sans bg-[#020617]">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        appsScriptUrl={appsScriptUrl}
        setAppsScriptUrl={setAppsScriptUrl}
        loading={loading}
        onUpdateKoneksi={refreshData}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-30 w-full bg-[#020617]/85 backdrop-blur-xl pt-6 pb-4 px-4 sm:px-6 lg:px-8 border-b border-white/5 mb-8">
          <DashboardHeader />
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {activeTab === 'tambah-data' ? (
            <DataScraper 
              appsScriptUrl={appsScriptUrl} 
              importNewData={importNewData} 
              importNewSikdData={importNewSikdData}
              importNewSikdAllocationData={importNewSikdAllocationData}
              resetToMockData={resetToMockData}
              resetSikdToMockData={resetSikdToMockData}
              resetSikdAllocationToMockData={resetSikdAllocationToMockData}
              onNavigateToSikd={() => handleTabChange('data-sikd')}
              onNavigateToAllocation={() => handleTabChange('alokasi-realisasi-sikd')}
              refreshSikdData={refreshSikdData}
              refreshData={refreshData}
              loading={loading}
              error={error}
            />
          ) : activeTab === 'data-sikd' ? (
            <DataSIKDView 
              sikdData={sikdData}
            />
          ) : activeTab === 'alokasi-realisasi-sikd' ? (
            <SikdAllocationView 
              sikdAllocationData={sikdAllocationData}
            />
          ) : (
            <>
              <CompositionSummary data={compositionData} selectedMonth={selectedMonth} />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h2 className="text-2xl font-black text-white capitalize tracking-tight flex items-center gap-3">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                  {activeTab} <span className="text-slate-500 text-sm font-medium">Sumbawa Barat</span>
                </h2>

                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-1.5 rounded-[1.25rem] border border-white/10">
                  <Calendar className="w-4 h-4 text-slate-400 ml-3" />
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-200 cursor-pointer outline-none pr-4"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m} className="bg-[#1e293b]">{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  title={`Total ${activeTab}`} 
                  value={formatBillions(stats.totalAnggaran)}
                  icon={<Wallet className="w-6 h-6" />}
                  color="indigo"
                />
                <StatCard 
                  title={`Realisasi ${activeTab}`}
                  value={formatBillions(stats.totalRealisasi)}
                  icon={<CreditCard className="w-6 h-6" />}
                  color="emerald"
                  percentage={stats.overallPersentase}
                />
                <StatCard 
                  title="Efektivitas (%)" 
                  value={formatPercentage(stats.overallPersentase)}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="rose"
                  progressBar={stats.overallPersentase}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                  <h3 className="font-bold text-xl text-white mb-8">Trend Realisasi {activeTab}</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis width={115} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBillions(v)} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                          formatter={(v) => formatCurrency(v as number)}
                        />
                        <Line type="monotone" dataKey="realisasi" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                  <h3 className="font-bold text-xl text-white mb-8 capitalize">Analisis Rincian {activeTab}</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentViewData.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="akun" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis width={115} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBillions(v)} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                        <Bar dataKey="anggaran" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="realisasi" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold text-slate-200 mb-6 flex justify-between">
                      <span>Top {activeTab}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedMonth}</span>
                    </h3>
                    <div className="space-y-6">
                      {currentViewData.slice(0, 4).map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 truncate pr-4">{item.akun}</span>
                            <span className="text-white font-bold">{formatPercentage(item.persentase)}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.persentase}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Module */}
              <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <h2 className="text-xl font-bold">Data Tabel: {activeTab}</h2>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Cari akun..." 
                      className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-8 py-5">Nama Akun</th>
                        <th className="px-8 py-5 text-right">Anggaran</th>
                        <th className="px-8 py-5 text-right">Realisasi</th>
                        <th className="px-8 py-5 text-center">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-4 font-bold text-sm">{item.akun}</td>
                          <td className="px-8 py-4 text-right text-xs text-slate-400 font-mono">{formatCurrency(item.anggaran)}</td>
                          <td className="px-8 py-4 text-right text-xs text-emerald-400 font-mono font-bold">{formatCurrency(item.realisasi)}</td>
                          <td className="px-8 py-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              item.persentase >= 60 ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-indigo-400/10 text-indigo-400 border border-indigo-400/20"
                            )}>
                              {formatPercentage(item.persentase)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
      </main>

      {/* Admin Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              setPendingTab(null);
            }}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
