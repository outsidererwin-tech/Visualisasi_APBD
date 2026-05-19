import { APBDData } from '../types';

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
      return json.map((item: any) => ({
        akun: String(item.akun || ''),
        anggaran: Number(item.anggaran || 0),
        realisasi: Number(item.realisasi || 0),
        persentase: Number(item.persentase || 0),
        kategori: (item.kategori || 'pendapatan').toString().toLowerCase() as any,
        bulan: String(item.bulan || 'Januari'),
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
