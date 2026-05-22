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

  // Pendapatan - Maret
  { akun: "PAD", anggaran: 159002204724, realisasi: 98000224932, persentase: 61.64, kategori: 'pendapatan', bulan: 'Maret' },
  { akun: "TKDD", anggaran: 1200000000000, realisasi: 580000000000, persentase: 48.33, kategori: 'pendapatan', bulan: 'Maret' },
  { akun: "Pendapatan Lainnya", anggaran: 45000000000, realisasi: 22000000000, persentase: 48.89, kategori: 'pendapatan', bulan: 'Maret' },

  // Pendapatan - April
  { akun: "PAD", anggaran: 159002204724, realisasi: 110002249312, persentase: 69.18, kategori: 'pendapatan', bulan: 'April' },
  { akun: "TKDD", anggaran: 1200000000000, realisasi: 640000000000, persentase: 53.33, kategori: 'pendapatan', bulan: 'April' },
  { akun: "Pendapatan Lainnya", anggaran: 45000000000, realisasi: 26000000000, persentase: 57.78, kategori: 'pendapatan', bulan: 'April' },

  // Pendapatan - Mei
  { akun: "PAD", anggaran: 159002204724, realisasi: 125002249312, persentase: 78.62, kategori: 'pendapatan', bulan: 'Mei' },
  { akun: "TKDD", anggaran: 1200000000000, realisasi: 710000000000, persentase: 59.17, kategori: 'pendapatan', bulan: 'Mei' },
  { akun: "Pendapatan Lainnya", anggaran: 45000000000, realisasi: 30000000000, persentase: 66.67, kategori: 'pendapatan', bulan: 'Mei' },

  // Pendapatan - Juni
  { akun: "PAD", anggaran: 159002204724, realisasi: 142002249312, persentase: 89.31, kategori: 'pendapatan', bulan: 'Juni' },
  { akun: "TKDD", anggaran: 1200000000000, realisasi: 780000000000, persentase: 65.00, kategori: 'pendapatan', bulan: 'Juni' },
  { akun: "Pendapatan Lainnya", anggaran: 45000000000, realisasi: 35000000000, persentase: 77.78, kategori: 'pendapatan', bulan: 'Juni' },

  // Belanja - Januari
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 210000000000, persentase: 26.25, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 50000000000, persentase: 12.5, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 1000000000, persentase: 10.0, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 80000000000, persentase: 26.6, kategori: 'belanja', bulan: 'Januari' },

  // Belanja - Februari
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 320000000000, persentase: 40.0, kategori: 'belanja', bulan: 'Februari' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 120000000000, persentase: 30.0, kategori: 'belanja', bulan: 'Februari' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 1500000000, persentase: 15.0, kategori: 'belanja', bulan: 'Februari' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 100000000000, persentase: 33.33, kategori: 'belanja', bulan: 'Februari' },

  // Belanja - Maret
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 380000000000, persentase: 47.5, kategori: 'belanja', bulan: 'Maret' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 160000000000, persentase: 40.0, kategori: 'belanja', bulan: 'Maret' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 2000000000, persentase: 20.0, kategori: 'belanja', bulan: 'Maret' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 110000000000, persentase: 36.67, kategori: 'belanja', bulan: 'Maret' },

  // Belanja - April
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 440000000000, persentase: 55.0, kategori: 'belanja', bulan: 'April' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 200000000000, persentase: 50.0, kategori: 'belanja', bulan: 'April' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 3000000000, persentase: 30.0, kategori: 'belanja', bulan: 'April' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 140000000000, persentase: 46.67, kategori: 'belanja', bulan: 'April' },

  // Belanja - Mei
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 512000000000, persentase: 64.0, kategori: 'belanja', bulan: 'Mei' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 250000000000, persentase: 62.5, kategori: 'belanja', bulan: 'Mei' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 4000000000, persentase: 40.0, kategori: 'belanja', bulan: 'Mei' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 180000000000, persentase: 60.00, kategori: 'belanja', bulan: 'Mei' },

  // Belanja - Juni
  { akun: "Belanja Operasi", anggaran: 800000000000, realisasi: 590000000000, persentase: 73.75, kategori: 'belanja', bulan: 'Juni' },
  { akun: "Belanja Modal", anggaran: 400000000000, realisasi: 310000000000, persentase: 77.5, kategori: 'belanja', bulan: 'Juni' },
  { akun: "Belanja Tidak Terduga", anggaran: 10000000000, realisasi: 5000000000, persentase: 50.0, kategori: 'belanja', bulan: 'Juni' },
  { akun: "Belanja Transfer", anggaran: 300000000000, realisasi: 210000000000, persentase: 70.00, kategori: 'belanja', bulan: 'Juni' },
  
  // Pembiayaan - Januari
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'Januari' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 5000000000, persentase: 25, kategori: 'pembiayaan', bulan: 'Januari' },

  // Pembiayaan - Februari
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'Februari' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 6000000000, persentase: 30, kategori: 'pembiayaan', bulan: 'Februari' },

  // Pembiayaan - Maret
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'Maret' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 8000000000, persentase: 40, kategori: 'pembiayaan', bulan: 'Maret' },

  // Pembiayaan - April
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'April' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 10000000000, persentase: 50, kategori: 'pembiayaan', bulan: 'April' },

  // Pembiayaan - Mei
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'Mei' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 12000000000, persentase: 60, kategori: 'pembiayaan', bulan: 'Mei' },

  // Pembiayaan - Juni
  { akun: "Penerimaan Pembiayaan", anggaran: 100000000000, realisasi: 100000000000, persentase: 100, kategori: 'pembiayaan', bulan: 'Juni' },
  { akun: "Pengeluaran Pembiayaan", anggaran: 20000000000, realisasi: 15000000000, persentase: 75, kategori: 'pembiayaan', bulan: 'Juni' }
];
