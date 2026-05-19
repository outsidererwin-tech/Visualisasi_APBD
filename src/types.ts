export interface APBDData {
  akun: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
  kategori: 'pendapatan' | 'belanja' | 'pembiayaan';
  bulan: string;
}

export interface DashboardStats {
  totalAnggaran: number;
  totalRealisasi: number;
  overallPersentase: number;
}
