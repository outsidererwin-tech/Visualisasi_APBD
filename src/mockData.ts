import { APBDData } from './types';

export const MOCK_DATA: APBDData[] = [
  // Pendapatan
  { akun: "PAD", anggaran: 159002204724, realisasi: 72782249312, persentase: 45.77, kategori: 'pendapatan', bulan: 'Januari' },
  { akun: "PAD", anggaran: 159002204724, realisasi: 85002249312, persentase: 53.46, kategori: 'pendapatan', bulan: 'Februari' },
  { akun: "PAD", anggaran: 159002204724, realisasi: 92002249312, persentase: 57.86, kategori: 'pendapatan', bulan: 'Maret' },
  { akun: "Pajak Daerah", anggaran: 89923000000, realisasi: 56325135210, persentase: 62.64, kategori: 'pendapatan', bulan: 'Januari' },
  { akun: "Pajak Daerah", anggaran: 89923000000, realisasi: 62325135210, persentase: 69.30, kategori: 'pendapatan', bulan: 'Februari' },
  
  // Belanja
  { akun: "Belanja Pegawai", anggaran: 767308347491, realisasi: 216334298033, persentase: 28.19, kategori: 'belanja', bulan: 'Januari' },
  { akun: "Belanja Pegawai", anggaran: 767308347491, realisasi: 245334298033, persentase: 31.97, kategori: 'belanja', bulan: 'Februari' },
  { akun: "Belanja Pegawai", anggaran: 767308347491, realisasi: 310334298033, persentase: 40.44, kategori: 'belanja', bulan: 'Maret' },
  
  // Pembiayaan
  { akun: "SiLPA", anggaran: 100000000000, realisasi: 45000000000, persentase: 45.00, kategori: 'pembiayaan', bulan: 'Januari' },
  { akun: "SiLPA", anggaran: 100000000000, realisasi: 55000000000, persentase: 55.00, kategori: 'pembiayaan', bulan: 'Februari' }
];
