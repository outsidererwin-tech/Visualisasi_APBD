import React, { useState, useRef, useMemo } from 'react';
import { 
  CloudDownload, Loader2, CheckCircle2, AlertCircle, ExternalLink, Code, 
  Upload, Trash2, FileSpreadsheet, RefreshCw, Check, ArrowRight, Table,
  TrendingUp, TrendingDown, Scale, PieChart as PieIcon, Info, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import { APBDData, SikdRecord } from '../../types';
import { MONTHS } from '../../lib/constants';
import { formatCurrency, formatBillions, safeParseNumber } from '../../lib/formatters';

interface DataScraperProps {
  appsScriptUrl: string;
  importNewData: (newData: APBDData[]) => void;
  importNewSikdData: (newData: SikdRecord[]) => void;
  resetToMockData: () => void;
  resetSikdToMockData: () => void;
  onNavigateToSikd: () => void;
  refreshSikdData: (url?: string) => Promise<boolean>;
  refreshData: (url?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function DataScraper({ 
  appsScriptUrl, 
  importNewData, 
  importNewSikdData,
  resetToMockData, 
  resetSikdToMockData,
  onNavigateToSikd,
  refreshSikdData,
  refreshData,
  loading,
  error
}: DataScraperProps) {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'api-scraper'>('upload');

  // ---------- Sync States ----------
  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const handleSyncSIKD = async () => {
    if (!appsScriptUrl) {
      setSyncStatus({ 
        type: 'error', 
        message: 'Silakan atur URL Google Apps Script terlebih dahulu di sidebar.' 
      });
      return;
    }

    setSyncStatus({ type: 'idle', message: '' });
    try {
      const success = await refreshSikdData();
      if (success) {
        setSyncStatus({ 
          type: 'success', 
          message: 'Berhasil menyinkronkan data SIKD langsung dari Google Sheets (Tab: "Data SIKD")!' 
        });
      } else {
        throw new Error('Gagal memuat tab "Data SIKD".');
      }
    } catch (err: any) {
      setSyncStatus({ 
        type: 'error', 
        message: err.message || 'Gagal sinkron. Pastikan tab "Data SIKD" sudah dibuat di Google Sheet Anda.' 
      });
    }
  };

  const handleSyncAPBD = async () => {
    if (!appsScriptUrl) {
      setSyncStatus({ 
        type: 'error', 
        message: 'Silakan atur URL Google Apps Script terlebih dahulu di sidebar.' 
      });
      return;
    }

    setSyncStatus({ type: 'idle', message: '' });
    try {
      const success = await refreshData();
      if (success) {
        setSyncStatus({ 
          type: 'success', 
          message: 'Berhasil menyinkronkan data APBD langsung dari Google Sheets!' 
        });
      } else {
        throw new Error('Gagal memuat data APBD dari Google Sheets.');
      }
    } catch (err: any) {
      setSyncStatus({ 
        type: 'error', 
        message: err.message || 'Gagal sinkron. Pastikan koneksi Google Sheets Anda aktif.' 
      });
    }
  };

  // ---------- Scraper API States ----------
  const [periode, setPeriode] = useState('5'); // Default Mei
  const [tahun, setTahun] = useState('2024'); // Default 2024
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  
  const [autoStep, setAutoStep] = useState<string>('');

  // ---------- Excel/CSV Upload States ----------
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [extractedData, setExtractedData] = useState<APBDData[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  // ---------- API Scraper Handlers ----------
  const handleScrape = async () => {
    if (!appsScriptUrl) {
      setScrapeStatus({ type: 'error', message: 'Silakan atur URL Google Apps Script terlebih dahulu.' });
      return;
    }

    setScrapeLoading(true);
    setScrapeStatus({ type: 'idle', message: 'Menghubungi server Apps Script...' });

    try {
      const response = await fetch(`${appsScriptUrl}?action=scrape&periode=${periode}&tahun=${tahun}`);
      const result = await response.json();

      if (result.status === 'success') {
        setScrapeStatus({ 
          type: 'success', 
          message: result.message
        });
      } else {
        throw new Error(result.message || 'Terjadi kesalahan saat scrapping.');
      }
    } catch (err) {
      setScrapeStatus({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Koneksi gagal. Pastikan URL Apps Script benar.' 
      });
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleSyncScraper = async () => {
    if (!appsScriptUrl) return;
    setScrapeLoading(true);
    setScrapeStatus({ type: 'idle', message: 'Memindahkan data ke dashboard...' });

    try {
      const response = await fetch(`${appsScriptUrl}?action=sync`);
      const result = await response.json();

      if (result.status === 'success') {
        // Trigger auto refresh to pull the newly synced data from Google Sheets to the local state
        const success = await refreshData();
        if (success) {
          setScrapeStatus({ 
            type: 'success', 
            message: `${result.message} Data dashboard APBD berhasil diperbarui secara otomatis!` 
          });
        } else {
          setScrapeStatus({ 
            type: 'success', 
            message: `${result.message} Namun terjadi kegagalan saat menyegarkan data ke dashboard.` 
          });
        }
      } else {
        throw new Error(result.message || 'Gagal sinkronisasi.');
      }
    } catch (err) {
      setScrapeStatus({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Koneksi gagal.' 
      });
    } finally {
      setScrapeLoading(false);
    }
  };

  // NEW: One-click Full Automatic Scrape + Sync + App Refresh Flow
  const handleFullAutomaticScrapeAndSync = async () => {
    if (!appsScriptUrl) {
      setScrapeStatus({ type: 'error', message: 'Silakan atur URL Google Apps Script terlebih dahulu.' });
      return;
    }

    setScrapeLoading(true);
    setScrapeStatus({ type: 'idle', message: '' });
    
    try {
      // 1. Scrape DJPK to Raw_Data Sheet
      setAutoStep('Mulai mengunduh realisasi APBD dari Portal Resmi DJPK Kemenkeu...');
      const scrapeResponse = await fetch(`${appsScriptUrl}?action=scrape&periode=${periode}&tahun=${tahun}`);
      const scrapeResult = await scrapeResponse.json();

      if (scrapeResult.status !== 'success') {
        throw new Error(scrapeResult.message || 'DJPK Portal Scrape gagal.');
      }

      // 2. Sync from Raw_Data to Data APBD main sheet
      setAutoStep('Mentransfer hasil download ke Lembar Data Utama "Data APBD" Google Sheet...');
      const syncResponse = await fetch(`${appsScriptUrl}?action=sync`);
      const syncResult = await syncResponse.json();

      if (syncResult.status !== 'success') {
        throw new Error(syncResult.message || 'Proses pemindahan data ke sheet utama gagal.');
      }

      // 3. Hot load latest Data APBD into Dashboard Local State
      setAutoStep('Menghubungkan & memuat lembar Google Sheet langsung ke dashboard...');
      const success = await refreshData();

      if (success) {
        setScrapeStatus({
          type: 'success',
          message: `Selesai secara otomatis! Hasil tarikan data periode bulan ${MONTHS[parseInt(periode) - 1] || 'Januari'} ${tahun} berhasil ditulis ke Google Sheet dan otomatis tampil di dashboard!`
        });
      } else {
        setScrapeStatus({
          type: 'success',
          message: 'Data berhasil disinkronkan ke Google Sheet, tetapi gagal me-refresh visualisasi dashboard lokal secara otomatis.'
        });
      }

    } catch (err: any) {
      setScrapeStatus({
        type: 'error',
        message: err.message || 'Gagal melakukan Sinkronisasi Otomatis. Pastikan URL Apps Script yang Anda pasang sudah benar dan didukung.'
      });
    } finally {
      setScrapeLoading(false);
      setAutoStep('');
    }
  };

  // ---------- Auto Parsing Engine ----------
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentCell = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        row.push(currentCell.trim());
        if (row.length > 0 || currentCell) {
          lines.push(row);
        }
        row = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (row.length > 0 || currentCell) {
      row.push(currentCell.trim());
      lines.push(row);
    }
    return lines;
  };

  const parseMoneyValue = (val: any): number => {
    return safeParseNumber(val);
  };

  const detectKategori = (itemName: string): 'pendapatan' | 'belanja' | 'pembiayaan' => {
    const clean = itemName.toLowerCase().trim();
    if (clean.includes('belanja') || clean.includes('gaji') || clean.includes('beban') || clean.includes('biaya') || clean.includes('pegawai') || clean.includes('barang') || clean.includes('jasa') || clean.includes('modal') || clean.includes('subsidi') || clean.includes('bantuan keuangan') || clean.includes('transfer kel')) {
      if (clean.includes('pendapatan transfer') || clean.includes('transfer masuk') || clean.includes('dana transfer')) {
        return 'pendapatan';
      }
      return 'belanja';
    }
    if (clean.includes('pembiayaan') || clean.includes('penerimaan pembiayaan') || clean.includes('pengeluaran pembiayaan') || clean.includes('silpa') || clean.includes('defisit')) {
      return 'pembiayaan';
    }
    if (clean.includes('pendapatan') || clean.includes('pajak') || clean.includes('retribusi') || clean.includes('pad') || clean.includes('bagi hasil') || clean.includes('dau') || clean.includes('dak') || clean.includes('hibah')) {
      return 'pendapatan';
    }
    return 'belanja';
  };

  // Automated Analysis on Upload matching SIKD columns:
  // Tanggal, Jenis Dana, Uraian, Periode, Nilai Kotor, Potongan, Nilai Bersih, Tunda, Status, LKT
  const performAutoAnalysis = (rows: any[][]) => {
    setProcessing(true);
    setUploadStatus({ type: 'idle', message: 'Menganalisis skema data otomatis...' });

    setTimeout(() => {
      try {
        // 1. Detect Header Row using score
        let headerRowIdx = -1;
        let maxScore = -1;

        for (let r = 0; r < Math.min(rows.length, 20); r++) {
          const row = rows[r];
          if (!row || row.length < 2) continue;

          let score = 0;
          row.forEach(cell => {
            if (!cell) return;
            const text = cell.toString().toLowerCase();
            if (text.includes('tanggal') || text.includes('date') || text === 'tgl') score += 2;
            if (text.includes('jenis dana') || text.includes('jenis_dana') || text === 'dana' || text.includes('jenis')) score += 2;
            if (text.includes('uraian') || text.includes('keterangan') || text.includes('deskripsi') || text.includes('detail')) score += 2;
            if (text.includes('periode') || text.includes('bulan') || text.includes('month')) score += 2;
            if (text.includes('kotor') || text.includes('gross') || text.includes('nilai kotor')) score += 2;
            if (text.includes('potongan') || text.includes('tax') || text.includes('pot')) score += 2;
            if (text.includes('bersih') || text.includes('net') || text.includes('nilai bersih')) score += 2;
            if (text.includes('tunda') || text.includes('pending') || text.includes('delay')) score += 2;
            if (text.includes('status')) score += 2;
            if (text.includes('lkt')) score += 2;
          });

          if (score > maxScore && score >= 2) {
            maxScore = score;
            headerRowIdx = r;
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0; // Fallback to first row
        }

        const headers = (rows[headerRowIdx] || []).map(h => h?.toString().toLowerCase().trim() || '');

        let jTanggal = -1;
        let jJenisDana = -1;
        let jUraian = -1;
        let jPeriode = -1;
        let jNilaiKotor = -1;
        let jPotongan = -1;
        let jNilaiBersih = -1;
        let jTunda = -1;
        let jStatus = -1;
        let jLkt = -1;

        headers.forEach((clean, idx) => {
          if (!clean) return;
          if (clean.includes('tanggal') || clean.includes('date') || clean === 'tgl') jTanggal = idx;
          else if (clean.includes('jenis dana') || clean.includes('jenis_dana') || clean === 'dana' || clean.includes('jenis')) jJenisDana = idx;
          else if (clean.includes('uraian') || clean.includes('keterangan') || clean.includes('deskripsi') || clean.includes('detail')) jUraian = idx;
          else if (clean.includes('periode') || clean.includes('bulan') || clean.includes('month') || clean === 'bln') jPeriode = idx;
          else if (clean.includes('kotor') || clean.includes('gross') || clean.includes('nilai kotor') || clean.includes('nilai_kotor')) jNilaiKotor = idx;
          else if (clean.includes('potongan') || clean.includes('cut') || clean === 'pot' || clean.includes('pajak')) jPotongan = idx;
          else if (clean.includes('bersih') || clean.includes('net') || clean.includes('nilai bersih') || clean.includes('nilai_bersih')) jNilaiBersih = idx;
          else if (clean.includes('tunda') || clean.includes('hold') || clean.includes('delayed') || clean.includes('pending')) jTunda = idx;
          else if (clean.includes('status')) jStatus = idx;
          else if (clean.includes('lkt')) jLkt = idx;
        });

        // Positional defaults fallback if headers cannot be resolved or mapped
        if (jTanggal === -1) jTanggal = 0;
        if (jJenisDana === -1) jJenisDana = headers.length > 1 ? 1 : 0;
        if (jUraian === -1) jUraian = headers.length > 2 ? 2 : 0;
        if (jPeriode === -1) jPeriode = headers.length > 3 ? 3 : 0;
        if (jNilaiKotor === -1) jNilaiKotor = headers.length > 4 ? 4 : 0;
        if (jPotongan === -1) jPotongan = headers.length > 5 ? 5 : 0;
        if (jNilaiBersih === -1) jNilaiBersih = headers.length > 6 ? 6 : 0;
        if (jTunda === -1) jTunda = headers.length > 7 ? 7 : 0;
        if (jStatus === -1) jStatus = headers.length > 8 ? 8 : 0;
        if (jLkt === -1) jLkt = headers.length > 9 ? 9 : 0;

        const dataRows = rows.slice(headerRowIdx + 1);
        const parsed: SikdRecord[] = [];

        dataRows.forEach(row => {
          if (!row || row.length === 0) return;

          const tanggalVal = row[jTanggal] !== undefined && row[jTanggal] !== null ? row[jTanggal].toString().trim() : '';
          const jenisDanaVal = row[jJenisDana] !== undefined && row[jJenisDana] !== null ? row[jJenisDana].toString().trim() : '';
          const uraianVal = row[jUraian] !== undefined && row[jUraian] !== null ? row[jUraian].toString().trim() : '';
          const periodeVal = row[jPeriode] !== undefined && row[jPeriode] !== null ? row[jPeriode].toString().trim() : '';
          const statusVal = row[jStatus] !== undefined && row[jStatus] !== null ? row[jStatus].toString().trim() : 'Salur';
          const lktVal = row[jLkt] !== undefined && row[jLkt] !== null ? row[jLkt].toString().trim() : 'Lengkap';

          const cleanUraian = uraianVal.replace(/[^a-zA-Z0-9]/g, '').trim();
          if (!uraianVal || uraianVal === '-' || uraianVal === '.' || cleanUraian === '') return;
          if (uraianVal.toLowerCase().includes('jumlah') || uraianVal.toLowerCase().includes('total')) return;

          const nilaiKotor = parseMoneyValue(row[jNilaiKotor]);
          const potongan = parseMoneyValue(row[jPotongan]);
          const nilaiBersih = parseMoneyValue(row[jNilaiBersih]);
          const tunda = parseMoneyValue(row[jTunda]);

          parsed.push({
            tanggal: tanggalVal,
            jenisDana: jenisDanaVal,
            uraian: uraianVal,
            periode: periodeVal || 'Semua',
            nilaiKotor,
            potongan,
            nilaiBersih,
            tunda,
            status: statusVal,
            lkt: lktVal
          });
        });

        if (parsed.length === 0) {
          throw new Error('Sistem gagal membaca baris data SIKD yang valid. Pastikan format tabel sesuai.');
        }

        // Apply instant data import for SIKD ONLY
        importNewSikdData(parsed);

        setExtractedData(parsed);
        setUploadStatus({ 
          type: 'success', 
          message: `Sukses! ${parsed.length} baris data transaksi SIKD berhasil diurai & dianalisis otomatis!` 
        });

      } catch (err: any) {
        setUploadStatus({ 
          type: 'error', 
          message: err.message || 'Gagal mengurai file otomatis. Hubungi admin atau periksa kembali file Anda.' 
        });
      } finally {
        setProcessing(false);
      }
    }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExtractedData([]);
      
      const reader = new FileReader();
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const rows = parseCSV(text);
          performAutoAnalysis(rows);
        };
        reader.readAsText(selectedFile);
      } else if (ext === 'json') {
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            if (Array.isArray(json)) {
              if (json.length > 0 && typeof json[0] === 'object' && !Array.isArray(json[0])) {
                const keys = Object.keys(json[0]);
                const matrix = [keys, ...json.map(item => keys.map(k => item[k]))];
                performAutoAnalysis(matrix);
              } else if (Array.isArray(json[0])) {
                performAutoAnalysis(json);
              }
            } else {
              throw new Error('JSON is not an array');
            }
          } catch (e) {
            setUploadStatus({ type: 'error', message: 'Format JSON invalid.' });
          }
        };
        reader.readAsText(selectedFile);
      } else {
        reader.onload = (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            performAutoAnalysis(rows);
          } catch (e) {
            setUploadStatus({ type: 'error', message: 'Gagal menguraikan berkas Excel.' });
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      }
    }
  };

  const triggerClickInput = () => {
    fileInputRef.current?.click();
  };

  const handleResetData = () => {
    const confirm = window.confirm('Apakah Anda yakin ingin mengatur ulang data SIKD & APBD ke mock data awal?');
    if (confirm) {
      resetToMockData();
      resetSikdToMockData();
      setFile(null);
      setExtractedData([]);
      setUploadStatus({ type: 'idle', message: '' });
      alert('Data berhasil di-restore!');
    }
  };

  // High-level calculations of extracted data for summary presentation
  const extractedStats = useMemo(() => {
    if (extractedData.length === 0) return { totalKotor: 0, totalPotongan: 0, totalBersih: 0, totalTunda: 0 };
    const totalKotor = extractedData.reduce((acc, curr) => acc + curr.nilaiKotor, 0);
    const totalPotongan = extractedData.reduce((acc, curr) => acc + curr.potongan, 0);
    const totalBersih = extractedData.reduce((acc, curr) => acc + curr.nilaiBersih, 0);
    const totalTunda = extractedData.reduce((acc, curr) => acc + curr.tunda, 0);
    return { totalKotor, totalPotongan, totalBersih, totalTunda };
  }, [extractedData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      


      {/* Sync Status Notifications */}
      {syncStatus.type !== 'idle' && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold animate-in fade-in duration-300",
          syncStatus.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        )}>
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{syncStatus.message}</span>
        </div>
      )}
      
      {/* Subtab Segmented Switcher */}
      <div className="flex bg-slate-900 border border-white/5 p-1 rounded-2xl max-w-lg mx-auto shadow-inner relative z-20">
        <button
          onClick={() => setActiveSubTab('upload')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
            activeSubTab === 'upload' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Metode 1: Unggah & Analisis Otomatis SIKD
        </button>
        <button
          onClick={() => setActiveSubTab('api-scraper')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
            activeSubTab === 'api-scraper' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <CloudDownload className="w-4 h-4" />
          Metode 2: API Scraper DJPK
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Method 1: Automated File Upload */}
        {activeSubTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 animate-in"
          >
            {/* Guide & Upload Area */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Drag And Drop Column */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Upload className="w-5 h-5 text-emerald-400" />
                        Unggah Berkas Laporan SIKD
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Unggah file Excel (.xlsx), CSV, atau JSON Anda. Sistem akan mencari tabel, menemukan kolom, dan menerjemahkannya secara otomatis.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleSyncSIKD}
                        disabled={loading}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] w-fit"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        {loading ? 'Menyinkronkan...' : 'Sinkron SIKD Google Sheet'}
                      </button>
                    </div>
                  </div>

                  {/* Drag drop slot */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const droppedFile = e.dataTransfer.files[0];
                        const fakeEvent = { target: { files: [droppedFile] } } as any;
                        handleFileChange(fakeEvent);
                      }
                    }}
                    onClick={triggerClickInput}
                    className={cn(
                      "group border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[21/9] min-h-[220px]",
                      dragOver 
                        ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]" 
                        : "border-white/10 hover:border-indigo-500/50 bg-black/10 hover:bg-white/[0.02]"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx,.xls,.csv,.json"
                      className="hidden"
                    />

                    {processing ? (
                      <div className="space-y-4">
                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                        <div>
                          <p className="text-white font-black text-sm">Sedang Menganalisis Skema Berkas...</p>
                          <p className="text-xs text-slate-500 mt-1">Mengurai, memetakan, dan menyusun relasi data APBD Kabupaten Sumbawa Barat</p>
                        </div>
                      </div>
                    ) : file ? (
                      <div className="space-y-3">
                        <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
                          <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-base max-w-sm px-4 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop()?.toUpperCase()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-indigo-600/20 group-hover:border-indigo-500/30 transition-all">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-slate-200 font-bold text-sm">Tarik dan letakkan file Anda di sini atau <span className="text-indigo-400 hover:underline">Telusuri</span></p>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Mendukung format spreadsheet Excel (.xlsx, .xls), CSV, atau JSON</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info and Restore Cards */}
                <div className="w-full lg:w-96 bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Mengapa Tanpa Konfigurasi Manual?
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sistem kini menerapkan <strong>Neural Heuristics</strong> yang memindai struktur baris pertama, mendeteksi header secara asinkron, dan menyinkronkan data langsung ke target SIKD luring Anda dalam waktu sekian detik.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-6">
                    <button
                      onClick={handleResetData}
                      className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Restore ke Mock Data Awal
                    </button>
                  </div>
                </div>

              </div>
            </div>



            {/* Auto Analysis Result Deck */}
            {extractedData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        Analisis Laporan Berhasil!
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Sistem luring sukses memetakan dan mengunggah {extractedData.length} akun data anggaran ke Dasbor SIKD.
                    </p>
                  </div>

                  <button
                    onClick={onNavigateToSikd}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
                  >
                    Buka Visualisasi Data SIKD
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </button>
                </div>

                {/* Upload Stat Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Nilai Kotor SIKD</span>
                    <p className="text-lg font-black text-amber-400 mt-1.5">{formatBillions(extractedStats.totalKotor)}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Potongan SIKD</span>
                    <p className="text-lg font-black text-rose-400 mt-1.5">{formatBillions(extractedStats.totalPotongan)}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Nilai Bersih SIKD</span>
                    <p className="text-lg font-black text-emerald-400 mt-1.5">{formatBillions(extractedStats.totalBersih)}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Dana Ditunda SIKD</span>
                    <p className="text-lg font-black text-sky-400 mt-1.5">{formatBillions(extractedStats.totalTunda)}</p>
                  </div>
                </div>

                {/* Verification notifications */}
                {uploadStatus.message && (
                  <div className="px-4 py-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{uploadStatus.message}</span>
                  </div>
                )}
              </motion.div>
            )}

          </motion.div>
        )}

        {/* Method 2: Google Apps Script API Scraper */}
        {activeSubTab === 'api-scraper' && (
          <motion.div
            key="api-scraper"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Setting Info Container */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-3">
                        Pilih Periode (Bulan)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-3">
                        Pilih Tahun (Year)
                      </label>
                      <select
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="2024">2024 (Data Lengkap)</option>
                        <option value="2025">2025 (Data Terkini)</option>
                        <option value="2026">2026</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm flex items-center justify-between font-bold">
                    <span>Bulan: {MONTHS[parseInt(periode)] || 'Semua'}</span>
                    <span>Tahun Anggaran: {tahun}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleScrape}
                      disabled={scrapeLoading}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                        scrapeLoading 
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                          : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                      )}
                    >
                      {scrapeLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CloudDownload className="w-5 h-5" />
                          Tarik Data Portal DJPK
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleSyncScraper}
                      disabled={scrapeLoading || !appsScriptUrl}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border",
                        scrapeLoading || !appsScriptUrl
                          ? "border-white/5 text-slate-600 cursor-not-allowed"
                          : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/5 active:scale-[0.98]"
                      )}
                    >
                      <RefreshCw className="w-5 h-5" />
                      Sync ke Google Sheets
                    </button>

                    <button
                      onClick={handleSyncAPBD}
                      disabled={loading || !appsScriptUrl}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                        loading || !appsScriptUrl
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                      )}
                    >
                      <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                      {loading ? 'Menyinkronkan...' : 'Sinkron APBD Google Sheet'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Info className="w-4 h-4 text-emerald-400" />
                    Bagaimana Scraper Bekerja?
                  </h3>
                  <ul className="space-y-4 text-xs text-slate-400">
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-extrabold">•</span>
                      <span>Memicu Apps Script untuk melakukan HTTP Request ke Portal DJPK Kemenkeu secara luring.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-extrabold">•</span>
                      <span>Mengurai HTML menggunakan regular expression yang kuat untuk menarik tabel APBD Sumbawa Barat.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-extrabold">•</span>
                      <span>Menyisipkan data ke lembar <strong>Raw_Data</strong> sebelum diverifikasi untuk sinkronisasi ke tab utama.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {scrapeStatus.type !== 'idle' && (
                <div className={cn(
                  "p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 mt-8",
                  scrapeStatus.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  {scrapeStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{scrapeStatus.message}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
