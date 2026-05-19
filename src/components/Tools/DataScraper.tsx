import { useState } from 'react';
import { CloudDownload, Loader2, CheckCircle2, AlertCircle, ExternalLink, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface DataScraperProps {
  appsScriptUrl: string;
}

export function DataScraper({ appsScriptUrl }: DataScraperProps) {
  const [periode, setPeriode] = useState('5'); // Default Mei
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const handleScrape = async () => {
    if (!appsScriptUrl) {
      setStatus({ type: 'error', message: 'Silakan atur URL Google Apps Script terlebih dahulu.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'idle', message: 'Menghubungi server Apps Script...' });

    try {
      const response = await fetch(`${appsScriptUrl}?action=scrape&periode=${periode}`);
      const result = await response.json();

      if (result.status === 'success') {
        setStatus({ 
          type: 'success', 
          message: result.message
        });
      } else {
        throw new Error(result.message || 'Terjadi kesalahan saat scrapping.');
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Koneksi gagal. Pastikan URL Apps Script benar dan telah dideploy sebagai "Anyone".' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!appsScriptUrl) return;
    setLoading(true);
    setStatus({ type: 'idle', message: 'Memindahkan data ke dashboard...' });

    try {
      const response = await fetch(`${appsScriptUrl}?action=sync`);
      const result = await response.json();

      if (result.status === 'success') {
        setStatus({ type: 'success', message: result.message });
      } else {
        throw new Error(result.message || 'Gagal sinkronisasi.');
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Koneksi gagal.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Settings Panel Inline */}
      {!appsScriptUrl && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-xl"
        >
          <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Konfigurasi Diperlukan
          </h3>
          <p className="text-slate-400 text-sm mb-4">Paste URL Web App dari Google Apps Script Anda di sini untuk mengaktifkan fitur Scraper.</p>
          <input 
            type="text"
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
            readOnly
            value={appsScriptUrl}
          />
          <p className="text-[10px] text-slate-500 mt-2 italic">*Koneksi dapat diatur melalui menu "Update Koneksi" di sidebar.</p>
        </motion.div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <CloudDownload className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Data Scraper DJPK</h1>
            <p className="text-slate-400 text-sm">Ambil realisasi APBD langsung dari Portal DJPK Kemenkeu.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">
                Pilih Periode (Bulan)
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="w-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm flex items-center">
                  Target: {yearsFromPeriode(parseInt(periode))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleScrape}
                disabled={loading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                  loading 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-5 h-5" />
                    Ambil Data Sekarang
                  </>
                )}
              </button>

              <button
                onClick={handleSync}
                disabled={loading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border",
                  loading 
                    ? "bg-slate-800 border-transparent text-slate-500 cursor-not-allowed" 
                    : "bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 active:scale-[0.98]"
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                Sync ke Dashboard
              </button>
            </div>

            <AnimatePresence>
              {status.type !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3",
                    status.type === 'success' 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}
                >
                  {status.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium leading-relaxed">{status.message}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Code className="w-24 h-24 text-white" />
            </div>
            
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              Info Endpoint
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Data akan ditarik dari API/Portal DJPK dengan payload: <br/>
              <code className="text-emerald-500 font-mono">periode={periode}&tahun=2026&provinsi=23&pemda=09</code>
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Status Raw_Data</p>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    status.type === 'success' ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                  )} />
                  <p className="text-white font-bold text-sm">
                    {status.type === 'success' ? 'Sudah Eksekusi' : 'Menunggu Eksekusi...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function yearsFromPeriode(p: number) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[p - 1] || 'Unknown';
}
