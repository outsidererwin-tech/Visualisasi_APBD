import { APBDData } from './types';

export const MOCK_DATA: APBDData[] = [
  // Pendapatan - Januari
  { akun: "PAD", anggaran: 159002204724, realisasi: 72782249312, persentase: 45.77, kategori: 'pendapatan', bulan: 'Januari' },
  { akun: "TKDD", anggaran: 1200000000000, realisasi: 450000000000, persentase: 37.5, kategori: 'pendapatan', bulan: 'Januari' },
  { akun: "Pendapatan Lainnya", anggaran: 45000000000, realisasi: 12000000000, persentase: 26.6, kategori: 'pendapatan', bulan: 'Januari' },
  
  // Pendapatan - Februari
  { akun: "PAD", anggaran: 159002204724, realisasi: 85002249312, persentase: 53.46, kategori: 'pendapatan', bulan: 'Februari' },
  { akun: "TKDD", anggaran: 1200000000000, realisasi: 520000000000, persentase: 43.3, kategori: 'pendapatan', bulan: 'Februari' },
  { akun: "Pendapatan Lainnya", anggaran: 45000000000, realisasi: 18000000000, persentase: 40.0, kategori: 'pendapatan', bulan: 'Februari' },

  // Belanja - Januari
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 210000000000, persentase: 26.25, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 50000000000, persentase: 12.5, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 1000000000, persentase: 10.0, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 80000000000, persentase: 26.6, kategori: 'belanja', bulan: 'Januari' },

  // Belanja - Februari
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 320000000000, persentase: 40.0, kategori: 'belanja', bulan: 'Februari' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 120000000000, persentase: 30.0, kategori: 'belanja', bulan: 'Februari' },
  
  // Pembiayaan - Januari
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'Januari' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 5000000000, persentase: 25, kategori: 'pembiayaan', bulan: 'Januari' }
];
