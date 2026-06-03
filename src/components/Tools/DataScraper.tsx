import React, { useState, useRef, useMemo } from 'react';
import { 
  CloudDownload, Loader2, CheckCircle2, AlertCircle, ExternalLink, 
  Upload, Trash2, FileSpreadsheet, RefreshCw, Check, ArrowRight, Table,
  TrendingUp, TrendingDown, Scale, PieChart as PieIcon, Info, Database, Zap,
  Layers, Coins, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import { APBDData, SikdRecord, SikdAllocationRecord } from '../../types';
import { MONTHS } from '../../lib/constants';
import { formatCurrency, formatBillions, safeParseNumber } from '../../lib/formatters';

interface DataScraperProps {
  appsScriptUrl: string;
  importNewData: (newData: APBDData[]) => void;
  importNewSikdData: (newData: SikdRecord[]) => void;
  importNewSikdAllocationData: (newData: SikdAllocationRecord[]) => void;
  resetToMockData: () => void;
  resetSikdToMockData: () => void;
  resetSikdAllocationToMockData: () => void;
  onNavigateToSikd: () => void;
  onNavigateToAllocation: () => void;
  refreshSikdData: (url?: string) => Promise<boolean>;
  refreshData: (url?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function DataScraper({ 
  appsScriptUrl, 
  importNewData, 
  importNewSikdData,
  importNewSikdAllocationData,
  resetToMockData, 
  resetSikdToMockData,
  resetSikdAllocationToMockData,
  onNavigateToSikd,
  onNavigateToAllocation,
  refreshSikdData,
  refreshData,
  loading,
  error
}: DataScraperProps) {
  // Option tab state supporting the 3 exact methods requested:
  // 'lacak-salur' | 'alokasi-realisasi' | 'api-djpk'
  const [activeSubTab, setActiveSubTab] = useState<'lacak-salur' | 'alokasi-realisasi' | 'api-djpk'>('lacak-salur');

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
      let msg = err.message || 'Gagal sinkron. Pastikan tab "Data SIKD" sudah dibuat di Google Sheet Anda.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        msg = 'Koneksi gagal (Failed to fetch). Pastikan URL Google Apps Script Anda benar, Web App telah disebarkan (deployed) sebagai "Anyone" (Siapa Saja), dan koneksi internet Anda stabil.';
      }
      setSyncStatus({ 
        type: 'error', 
        message: msg
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
      let msg = err.message || 'Gagal sinkron. Pastikan koneksi Google Sheets Anda aktif.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        msg = 'Koneksi gagal (Failed to fetch). Pastikan URL Google Apps Script Anda benar, Web App telah disebarkan (deployed) sebagai "Anyone" (Siapa Saja), dan koneksi internet Anda stabil.';
      }
      setSyncStatus({ 
        type: 'error', 
        message: msg
      });
    }
  };

  // ---------- Scraper API States ----------
  const [periode, setPeriode] = useState('6'); // Default Juni
  const [tahun, setTahun] = useState('2026'); // Default 2026
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  
  const [autoStep, setAutoStep] = useState<string>('');

  // ---------- Excel/CSV Upload States ----------
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Storage for currently extracted lists to preview on upload
  const [extractedLacakSalur, setExtractedLacakSalur] = useState<SikdRecord[]>([]);
  const [extractedAlokasiRealisasi, setExtractedAlokasiRealisasi] = useState<SikdAllocationRecord[]>([]);
  
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

  // One-click Full Automatic Scrape + Sync + App Refresh Flow
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
      let msg = err.message || 'Gagal melakukan Sinkronisasi Otomatis. Pastikan URL Apps Script yang Anda pasang sudah benar dan didukung.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        msg = 'Koneksi gagal (Failed to fetch). Hubungan internet Anda dengan Google Apps Script terputus atau URL script Anda salah.';
      }
      setScrapeStatus({ 
        type: 'error', 
        message: msg
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

  // Automated Analysis on Upload matching SIKD columns:
  // Tanggal, Jenis Dana, Uraian, Periode, Nilai Kotor, Potongan, Nilai Bersih, Tunda, Status, LKT
  const performLacakSalurAnalysis = (rows: any[][]) => {
    setProcessing(true);
    setUploadStatus({ type: 'idle', message: 'Menganalisis skema data Lacak Salur SIKD otomatis...' });

    setTimeout(() => {
      try {
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
          headerRowIdx = 0; 
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

        // Positional defaults fallback
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
          throw new Error('Sistem gagal membaca baris data transaksi SIKD yang valid.');
        }

        // Save imported list to master state
        importNewSikdData(parsed);
        setExtractedLacakSalur(parsed);
        setUploadStatus({ 
          type: 'success', 
          message: `Sukses! ${parsed.length} baris data transaksi Lacak Salur SIKD berhasil diurai & dianalisis otomatis!` 
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

  // NEW: Automated Analysis on Upload matching Alokasi & Realisasi SIKD columns:
  // Kode, Uraian, Pagu, Realisasi, Rasio
  const performAlokasiRealisasiAnalysis = (rows: any[][]) => {
    setProcessing(true);
    setUploadStatus({ type: 'idle', message: 'Menganalisis skema data Alokasi & Realisasi SIKD otomatis...' });

    setTimeout(() => {
      try {
        let headerRowIdx = -1;
        let maxScore = -1;

        for (let r = 0; r < Math.min(rows.length, 20); r++) {
          const row = rows[r];
          if (!row || row.length < 2) continue;

          let score = 0;
          row.forEach(cell => {
            if (!cell) return;
            const text = cell.toString().toLowerCase();
            if (text.includes('kode') || text.includes('kd_rek') || text === 'rekening' || text === 'kd') score += 2;
            if (text.includes('uraian') || text.includes('keterangan') || text.includes('nama') || text === 'akun') score += 2;
            if (text.includes('pagu') || text.includes('anggaran') || text.includes('alokasi')) score += 2;
            if (text.includes('realisasi') || text.includes('salur') || text.includes('real')) score += 2;
            if (text.includes('rasio') || text.includes('persen') || text.includes('%')) score += 2;
          });

          if (score > maxScore && score >= 2) {
            maxScore = score;
            headerRowIdx = r;
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0;
        }

        const headers = (rows[headerRowIdx] || []).map(h => h?.toString().toLowerCase().trim() || '');

        let jKode = -1;
        let jUraian = -1;
        let jPagu = -1;
        let jRealisasi = -1;
        let jRasio = -1;

        headers.forEach((clean, idx) => {
          if (!clean) return;
          if (clean.includes('kode') || clean.includes('kd_rek') || clean === 'rekening' || clean === 'kd') jKode = idx;
          else if (clean.includes('uraian') || clean.includes('keterangan') || clean.includes("rekening") || clean.includes('nama') || clean === 'akun') jUraian = idx;
          else if (clean.includes('pagu') || clean.includes('anggaran') || clean.includes('alokasi')) jPagu = idx;
          else if (clean.includes('realisasi') || clean.includes('salur') || clean.includes('real')) jRealisasi = idx;
          else if (clean.includes('rasio') || clean.includes('persen') || clean.includes('%')) jRasio = idx;
        });

        // Fallbacks positional defaults
        if (jKode === -1) jKode = 0;
        if (jUraian === -1) jUraian = headers.length > 1 ? 1 : 0;
        if (jPagu === -1) jPagu = headers.length > 2 ? 2 : 0;
        if (jRealisasi === -1) jRealisasi = headers.length > 3 ? 3 : 0;
        if (jRasio === -1) jRasio = headers.length > 4 ? 4 : 0;

        const dataRows = rows.slice(headerRowIdx + 1);
        const parsed: SikdAllocationRecord[] = [];

        dataRows.forEach(row => {
          if (!row || row.length === 0) return;

          const kodeVal = row[jKode] !== undefined && row[jKode] !== null ? row[jKode].toString().trim() : '';
          const uraianVal = row[jUraian] !== undefined && row[jUraian] !== null ? row[jUraian].toString().trim() : '';

          const cleanUraian = uraianVal.replace(/[^a-zA-Z0-9]/g, '').trim();
          if (!uraianVal || uraianVal === '-' || uraianVal === '.' || cleanUraian === '') return;
          if (uraianVal.toLowerCase().includes('jumlah') || uraianVal.toLowerCase().includes('total')) return;

          const pagu = parseMoneyValue(row[jPagu]);
          const realisasi = parseMoneyValue(row[jRealisasi]);
          
          let rasio = 0;
          if (row[jRasio] !== undefined && row[jRasio] !== null) {
            rasio = parseMoneyValue(row[jRasio]);
            // Convert e.g. 0.25 to 25.0
            if (rasio > 0 && rasio < 1) {
              rasio = parseFloat((rasio * 100).toFixed(4));
            }
          } else {
            rasio = pagu > 0 ? parseFloat(((realisasi / pagu) * 100).toFixed(4)) : 0;
          }

          parsed.push({
            kode: kodeVal,
            uraian: uraianVal,
            pagu,
            realisasi,
            rasio
          });
        });

        if (parsed.length === 0) {
          throw new Error('Sistem gagal membaca baris data Alokasi & Realisasi SIKD yang valid.');
        }

        // Save imported list to master state
        importNewSikdAllocationData(parsed);
        setExtractedAlokasiRealisasi(parsed);
        setUploadStatus({ 
          type: 'success', 
          message: `Sukses! ${parsed.length} baris data Alokasi & Realisasi SIKD berhasil diurai & dianalisis otomatis!` 
        });

      } catch (err: any) {
        setUploadStatus({ 
          type: 'error', 
          message: err.message || 'Gagal mengurai file alokasi otomatis. Hubungi admin atau periksa kembali file Anda.' 
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
      setExtractedLacakSalur([]);
      setExtractedAlokasiRealisasi([]);
      setUploadStatus({ type: 'idle', message: '' });
      
      const reader = new FileReader();
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const rows = parseCSV(text);
          if (activeSubTab === 'lacak-salur') {
            performLacakSalurAnalysis(rows);
          } else {
            performAlokasiRealisasiAnalysis(rows);
          }
        };
        reader.readAsText(selectedFile);
      } else if (ext === 'json') {
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            let matrix: any[][] = [];
            if (Array.isArray(json)) {
              if (json.length > 0 && typeof json[0] === 'object' && !Array.isArray(json[0])) {
                const keys = Object.keys(json[0]);
                matrix = [keys, ...json.map(item => keys.map(k => item[k]))];
              } else if (Array.isArray(json[0])) {
                matrix = json;
              }
            } else {
              throw new Error('JSON is not an array');
            }
            
            if (activeSubTab === 'lacak-salur') {
              performLacakSalurAnalysis(matrix);
            } else {
              performAlokasiRealisasiAnalysis(matrix);
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
            if (activeSubTab === 'lacak-salur') {
              performLacakSalurAnalysis(rows);
            } else {
              performAlokasiRealisasiAnalysis(rows);
            }
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

  const handleResetDataLacakSalur = () => {
    const confirm = window.confirm('Apakah Anda yakin ingin mengatur ulang data Lacak Salur SIKD ke Mock Data awal?');
    if (confirm) {
      resetSikdToMockData();
      setFile(null);
      setExtractedLacakSalur([]);
      setUploadStatus({ type: 'idle', message: '' });
      alert('Data Lacak Salur SIKD berhasil di-restore!');
    }
  };

  const handleResetDataAlokasiRealisasi = () => {
    const confirm = window.confirm('Apakah Anda yakin ingin mengatur ulang data Alokasi & Realisasi SIKD ke Mock Data awal?');
    if (confirm) {
      resetSikdAllocationToMockData();
      setFile(null);
      setExtractedAlokasiRealisasi([]);
      setUploadStatus({ type: 'idle', message: '' });
      alert('Data Alokasi & Realisasi SIKD berhasil di-restore!');
    }
  };

  // High-level calculations of extracted data for summary presentation
  const extractedStatsLacakSalur = useMemo(() => {
    if (extractedLacakSalur.length === 0) return { totalKotor: 0, totalPotongan: 0, totalBersih: 0, totalTunda: 0 };
    const totalKotor = extractedLacakSalur.reduce((acc, curr) => acc + (curr.nilaiKotor || 0), 0);
    const totalPotongan = extractedLacakSalur.reduce((acc, curr) => acc + (curr.potongan || 0), 0);
    const totalBersih = extractedLacakSalur.reduce((acc, curr) => acc + (curr.nilaiBersih || 0), 0);
    const totalTunda = extractedLacakSalur.reduce((acc, curr) => acc + (curr.tunda || 0), 0);
    return { totalKotor, totalPotongan, totalBersih, totalTunda };
  }, [extractedLacakSalur]);

  const extractedStatsAlokasiRealisasi = useMemo(() => {
    if (extractedAlokasiRealisasi.length === 0) return { totalPagu: 0, totalRealisasi: 0, avgRasio: 0 };
    // Identify root codes dynamically without double counting nested children
    const rootNodes = extractedAlokasiRealisasi.filter(item => {
      if (/^\d{3}$/.test(item.kode)) return false;
      const hasParent = extractedAlokasiRealisasi.some(other => {
        if (other.kode === item.kode) return false;
        if (/^\d{3}$/.test(other.kode)) return false;
        return item.kode.startsWith(other.kode) && other.kode.length < item.kode.length;
      });
      return !hasParent;
    });
    const target = rootNodes.length > 0 ? rootNodes : extractedAlokasiRealisasi;
    const totalPagu = target.reduce((acc, curr) => acc + (curr.pagu || 0), 0);
    const totalRealisasi = target.reduce((acc, curr) => acc + (curr.realisasi || 0), 0);
    const avgRasio = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
    return { totalPagu, totalRealisasi, avgRasio };
  }, [extractedAlokasiRealisasi]);

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
      
      {/* 3 Methods Switching Control panel */}
      <div className="flex bg-slate-900 border border-white/5 p-1 rounded-2xl max-w-2xl mx-auto shadow-inner relative z-20">
        <button
          onClick={() => {
            setActiveSubTab('lacak-salur');
            setFile(null);
            setUploadStatus({ type: 'idle', message: '' });
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
            activeSubTab === 'lacak-salur' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Database className="w-4 h-4" />
          METODE 1: Unggah Lacak Salur SIKD
        </button>
        <button
          onClick={() => {
            setActiveSubTab('alokasi-realisasi');
            setFile(null);
            setUploadStatus({ type: 'idle', message: '' });
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
            activeSubTab === 'alokasi-realisasi' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Layers className="w-4 h-4" />
          METODE 2: Unggah Alokasi & Realisasi SIKD
        </button>
        <button
          onClick={() => {
            setActiveSubTab('api-djpk');
            setFile(null);
            setUploadStatus({ type: 'idle', message: '' });
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
            activeSubTab === 'api-djpk' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <CloudDownload className="w-4 h-4" />
          METODE 3: API DJPK
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Method 1: Automated File Upload (Lacak Salur SIKD) */}
        {activeSubTab === 'lacak-salur' && (
          <motion.div
            key="lacak-salur"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Guide & Upload Area */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Drag And Drop Column */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        Unggah Berkas Lacak Salur SIKD
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 font-sans">
                        Unggah file Excel (.xlsx), CSV, atau JSON data transaksi penyaluran SIKD. Sistem memetakan kolom secara cerdas & otomatis.
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
                        ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]" 
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
                          <p className="text-white font-black text-sm">Sedang Menganalisis Skema Lacak Salur SIKD...</p>
                          <p className="text-xs text-slate-500 mt-1">Mengurai, men-desimalisasi, dan menyusun data transaksi luring Anda secara aman...</p>
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
                          <p className="text-slate-200 font-bold text-sm">Tarik dan letakkan file Lacak Salur SIKD di sini atau <span className="text-indigo-400 hover:underline">Telusuri</span></p>
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
                      Neural Heuristics & Decimals
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sistem menerapkan pemetaan kolom dinamis untuk menemukan transaksi penyaluran, rasio, potongan, dan tundaan real-time. Semua angka terbaca presisi desimalnya tanpa pembulatan.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-6">
                    <button
                      onClick={handleResetDataLacakSalur}
                      className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Restore ke Mock Data Lacak Salur
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Auto Analysis Result Deck */}
            {extractedLacakSalur.length > 0 && (
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
                        Analisis Berhasil Diimpor!
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">
                      Sistem luring sukses memetakan dan mengunggah {extractedLacakSalur.length} baris data laporan ke sistem Lacak Salur SIKD.
                    </p>
                  </div>

                  <button
                    onClick={onNavigateToSikd}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
                  >
                    Buka visualisasi Lacak Salur SIKD
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload Stat Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {(() => {
                    const statsDef = [
                      { label: "Total Nilai Kotor SIKD", val: formatCurrency(extractedStatsLacakSalur.totalKotor), col: "text-amber-400" },
                      { label: "Total Potongan SIKD", val: formatCurrency(extractedStatsLacakSalur.totalPotongan), col: "text-rose-400" },
                      { label: "Total Nilai Bersih SIKD", val: formatCurrency(extractedStatsLacakSalur.totalBersih), col: "text-emerald-400" },
                      { label: "Total Dana Ditunda SIKD", val: formatCurrency(extractedStatsLacakSalur.totalTunda), col: "text-sky-400" }
                    ];
                    return statsDef.map((st, idx) => {
                      const valLen = st.val.length;
                      const fSize = Math.max(10, Math.min(18, 320 / valLen));
                      return (
                        <div key={idx} className="bg-white/5 border border-white/5 p-5 rounded-2xl min-w-0">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block truncate">{st.label}</span>
                          <p 
                            className={`font-black mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis ${st.col}`}
                            style={{ fontSize: `${fSize}px` }}
                          >
                            {st.val}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>

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

        {/* Method 2: Automated File Upload (Alokasi & Realisasi SIKD) */}
        {activeSubTab === 'alokasi-realisasi' && (
          <motion.div
            key="alokasi-realisasi"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Guide & Upload Area */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Drag And Drop Column */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        Unggah Berkas Alokasi & Realisasi SIKD
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 font-sans">
                        Unggah file Excel (.xlsx), CSV, atau JSON data alokasi rincian SIKD. Sistem memetakan kode akun, pagu, realisasi, dan rasio salur secara instan.
                      </p>
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
                        ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]" 
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
                          <p className="text-white font-black text-sm">Sedang Menganalisis Skema Alokasi SIKD...</p>
                          <p className="text-xs text-slate-500 mt-1">Mengurai rincian, pagu anggaran, serta persentase penyerapan dengan akurasi desimal maksimal...</p>
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
                          <p className="text-slate-200 font-bold text-sm">Tarik dan letakkan file Alokasi & Realisasi SIKD di sini atau <span className="text-indigo-400 hover:underline">Telusuri</span></p>
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
                      Zero-Loss Decimal Precision
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Semua nominal rupiah serta rasio penyerapan diurai menggunakan parser floating-point presisi tinggi tanpa pemotongan desimal, persis sesuai dengan rincian buku anggaran.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-6">
                    <button
                      onClick={handleResetDataAlokasiRealisasi}
                      className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Restore ke Mock Data Alokasi
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Auto Analysis Result Deck */}
            {extractedAlokasiRealisasi.length > 0 && (
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
                        Analisis Alokasi Berhasil Diimpor!
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">
                      Sistem luring sukses memetakan dan mengunggah {extractedAlokasiRealisasi.length} baris data anggaran alokasi ke buku SIKD.
                    </p>
                  </div>

                  <button
                    onClick={onNavigateToAllocation}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
                  >
                    Buka visualisasi alokasi & realisasi
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload Stat Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block truncate">Total Pagu Diserap</span>
                    <p className="font-black text-amber-400 mt-1.5 text-base sm:text-lg truncate">
                      {formatCurrency(extractedStatsAlokasiRealisasi.totalPagu)}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block truncate">Total Realisasi Salur</span>
                    <p className="font-black text-emerald-400 mt-1.5 text-base sm:text-lg truncate">
                      {formatCurrency(extractedStatsAlokasiRealisasi.totalRealisasi)}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block truncate">Average Efisiensi Rasio</span>
                    <p className="font-black text-sky-400 mt-1.5 text-base sm:text-lg truncate">
                      {extractedStatsAlokasiRealisasi.avgRasio.toFixed(4)}%
                    </p>
                  </div>
                </div>

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

        {/* Method 3: Google Apps Script API DJPK Scraper */}
        {activeSubTab === 'api-djpk' && (
          <motion.div
            key="api-djpk"
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
                className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-xl animate-in"
              >
                <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Konfigurasi Diperlukan
                </h3>
                <p className="text-slate-400 text-sm mb-4">Paste URL Web App dari Google Apps Script Anda di sidebar (Update Koneksi) untuk mengaktifkan scraper API DJPK.</p>
                <input 
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  readOnly
                  value={appsScriptUrl}
                />
              </motion.div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                  <CloudDownload className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Data Scraper API DJPK</h1>
                  <p className="text-slate-400 text-sm">Ambil anggaran realisasi APBD langsung dari Portal DJPK Kemenkeu.</p>
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-3">
                        Pilih Tahun (Year)
                      </label>
                      <select
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer text-sm"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-xs flex items-center justify-between font-bold">
                    <span>Bulan Target: {MONTHS[parseInt(periode) - 1] || 'Semua'}</span>
                    <span>Tahun Anggaran: {tahun}</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Langkah 1 */}
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black">
                          1
                        </span>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider">Langkah 1: Ambil Data</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Mengunduh realisasi APBD KSB langsung dari Portal DJPK Kemenkeu dan menyimpannya ke sheet <strong>Raw_Data</strong>.
                      </p>
                      <button
                        onClick={handleScrape}
                        disabled={scrapeLoading || !appsScriptUrl}
                        className={cn(
                          "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                          scrapeLoading || !appsScriptUrl
                            ? "bg-slate-800/80 text-slate-500 cursor-not-allowed border border-white/5" 
                            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                        )}
                      >
                        {scrapeLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mengambil...
                          </>
                        ) : (
                          <>
                            <CloudDownload className="w-4 h-4" />
                            Tarik Data Portal DJPK
                          </>
                        )}
                      </button>
                    </div>

                    {/* Langkah 2 */}
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black">
                          2
                        </span>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider">Langkah 2: Sinkronisasikan</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Mentransfer data dari tab <strong>Raw_Data</strong> ke template utama Google Sheet dan memperbarui visualisasi dashboard.
                      </p>
                      <button
                        onClick={handleSyncScraper}
                        disabled={scrapeLoading || !appsScriptUrl}
                        className={cn(
                          "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border",
                          scrapeLoading || !appsScriptUrl
                            ? "border-white/5 text-slate-600 cursor-not-allowed"
                            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 active:scale-[0.98]"
                        )}
                      >
                        {scrapeLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Menyinkronkan...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Sinkronkan APBD Google Sheet
                          </>
                        )}
                      </button>
                    </div>

                    {/* Active Steppers */}
                    {scrapeLoading && autoStep && (
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-pulse">
                        <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs font-sans">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>{autoStep}</span>
                        </div>
                      </div>
                    )}

                    {/* Auto Sync Panel */}
                    <div className="pt-2 border-t border-white/5 space-y-2.5">
                      <button
                        onClick={handleFullAutomaticScrapeAndSync}
                        disabled={scrapeLoading || !appsScriptUrl}
                        className="w-full text-indigo-400 hover:text-indigo-300 font-bold text-[11px] flex items-center justify-center gap-1.5 py-2.5 hover:bg-indigo-500/5 rounded-xl transition-all border border-dashed border-indigo-500/20 disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Alternatif: Jalankan Sinkronisasi Otomatis 1-Klik
                      </button>

                      <button
                        onClick={handleSyncAPBD}
                        disabled={loading || !appsScriptUrl}
                        className="w-full text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 py-2 hover:bg-emerald-500/5 rounded-xl transition-all border border-dashed border-emerald-500/20 disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                        Hanya Segarkan Tampilan (Ambil data saat ini dari Sheet)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 h-fit relative overflow-hidden font-sans">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Info className="w-4 h-4 text-indigo-400" />
                    Mekanisme Scraper DJPK
                  </h3>
                  <ul className="space-y-4 text-xs text-slate-400">
                    <li className="flex gap-2">
                      <span className="text-indigo-400 font-extrabold">•</span>
                      <span>Menginstruksikan modul Apps Script untuk mengunduh file spreadsheet XML presisi tinggi langsung dari server DJPK.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400 font-extrabold">•</span>
                      <span>Mengekstrak data anggaran, realisasi, dan persentase yang akurat sampai nominal satuan rupiah (tanpa pembulatan dan singkatan).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400 font-extrabold">•</span>
                      <span>Menuliskan data akurat tersebut ke tab <strong>Raw_Data</strong> secara langsung dan menyinkronkannya dengan dashboard secara mulus.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {scrapeStatus.type !== 'idle' && (
                <div className={cn(
                  "p-5 rounded-2xl border text-sm font-bold flex flex-col gap-4 mt-8 font-sans",
                  scrapeStatus.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  <div className="flex items-start gap-3">
                    {scrapeStatus.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <span className="leading-relaxed">{scrapeStatus.message}</span>
                  </div>

                  {scrapeStatus.type === 'error' && (
                    <div className="pt-3 border-t border-rose-500/15 flex flex-wrap gap-2.5">
                      <a 
                        href={`https://djpk.kemenkeu.go.id/portal/data/apbd?periode=${periode}&tahun=${tahun}&provinsi=23&pemda=09`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-rose-600/10 active:scale-[0.98]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka Portal DJPK Kemenkeu di Browser Anda
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
