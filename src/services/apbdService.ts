import { APBDData, SikdRecord } from '../types';
import { safeParseNumber } from '../lib/formatters';

export class APBDService {
  /**
   * Mengambil data APBD dari Google Apps Script Web App
   */
  static async fetchData(url: string): Promise<APBDData[]> {
    if (!url) throw new Error('URL Google Apps Script belum dikonfigurasi.');

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil data (HTTP ${response.status}). Pastikan izin Web App adalah 'Anyone'.`);
      }
      
      const json = await response.json();
      
      // Cek error internal dari GAS
      if (json && typeof json === 'object' && 'error' in json) {
        throw new Error(`Google Apps Script Error: ${json.error}`);
      }

      if (!Array.isArray(json)) {
        throw new Error('Format data tidak valid. Ekspektasi: JSON Array.');
      }

      if (json.length === 0) {
        throw new Error('Sheet ditemukan tetapi tidak ada baris data.');
      }

      // Validasi sederhana tipe data per item
      return json.map((item: any) => {
        const akun = String(item.akun || item.Akun || item['Nama Akun'] || item['nama_akun'] || item['nama akun'] || '');
        
        const getVal = (key1: string, key2: string, key3: string) => {
          if (item[key1] !== undefined && item[key1] !== null && item[key1] !== '') return item[key1];
          if (item[key2] !== undefined && item[key2] !== null && item[key2] !== '') return item[key2];
          if (item[key3] !== undefined && item[key3] !== null && item[key3] !== '') return item[key3];
          return 0;
        };

        const anggaran = safeParseNumber(getVal('anggaran', 'Anggaran', 'anggaran'));
        const realisasi = safeParseNumber(getVal('realisasi', 'Realisasi', 'realisasi'));
        let persentase = safeParseNumber(getVal('persentase', 'Persentase', 'persen'));
        
        if (persentase === 0 && anggaran > 0) {
          persentase = parseFloat(((realisasi / anggaran) * 100).toFixed(2));
        }
        const kategori = (item.kategori || item.Kategori || 'pendapatan').toString().toLowerCase() as any;
        const bulan = String(item.bulan || item.Bulan || 'Januari');
        return {
          akun,
          anggaran,
          realisasi,
          persentase,
          kategori,
          bulan
        };
      });
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error('Respon dari server bukan JSON yang valid. Pastikan URL benar.');
      }
      throw error;
    }
  }

  /**
   * Mengambil data SIKD dari Google Apps Script Web App (Sheet: Data SIKD)
   */
  static async fetchSIKDData(url: string): Promise<SikdRecord[]> {
    if (!url) throw new Error('URL Google Apps Script belum dikonfigurasi.');
    const connector = url.includes('?') ? '&' : '?';
    const targetUrl = `${url}${connector}sheet=Data SIKD`;
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data SIKD (HTTP ${response.status}).`);
      }
      const json = await response.json();
      if (json && typeof json === 'object' && 'error' in json) {
        throw new Error(`Google Apps Script Error: ${json.error}`);
      }
      if (!Array.isArray(json)) {
        throw new Error('Format data SIKD tidak valid. Ekspektasi: JSON Array.');
      }
      return json.map((item: any) => ({
        tanggal: String(item.tanggal || item.Tanggal || ''),
        jenisDana: String(item.jenisDana || item.jenis_dana || item['Jenis Dana'] || ''),
        uraian: String(item.uraian || item.Uraian || ''),
        periode: String(item.periode || item.Periode || 'Semua'),
        nilaiKotor: safeParseNumber(item.nilaiKotor !== undefined ? item.nilaiKotor : (item.nilai_kotor !== undefined ? item.nilai_kotor : (item['Nilai Kotor'] !== undefined ? item['Nilai Kotor'] : 0))),
        potongan: safeParseNumber(item.potongan !== undefined ? item.potongan : (item.Potongan !== undefined ? item.Potongan : 0)),
        nilaiBersih: safeParseNumber(item.nilaiBersih !== undefined ? item.nilaiBersih : (item.nilai_bersih !== undefined ? item.nilai_bersih : (item['Nilai Bersih'] !== undefined ? item['Nilai Bersih'] : 0))),
        tunda: safeParseNumber(item.tunda !== undefined ? item.tunda : (item.Tunda !== undefined ? item.Tunda : 0)),
        status: String(item.status || item.Status || ''),
        lkt: String(item.lkt || item.LKT || ''),
      }));
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error('Respon dari server bukan JSON yang valid. Pastikan URL benar.');
      }
      throw error;
    }
  }

  /**
   * Menghitung statistik akumulasi
   */
  static calculateStats(data: APBDData[]) {
    const totalAnggaran = data.reduce((acc, curr) => acc + curr.anggaran, 0);
    const totalRealisasi = data.reduce((acc, curr) => acc + curr.realisasi, 0);
    const overallPersentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;

    return { totalAnggaran, totalRealisasi, overallPersentase };
  }
}
